import * as p from '@clack/prompts';
import { styleText } from 'node:util';
import { randomUUID } from 'crypto';
import { loadTelemetryConfig, saveTelemetryConfig } from '../../services/telemetry/consent.js';
import { captureCliEvent } from '../../services/telemetry/cli-telemetry.js';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { SettingsDefaultsManager, type SettingsDefaults } from '../../shared/SettingsDefaultsManager.js';
import { USER_SETTINGS_PATH } from '../../shared/paths.js';
import { writeJsonFileAtomic as writeSettingsJsonAtomic } from '../../shared/atomic-json.js';
import { loadOpenCodeMemEnv, saveOpenCodeMemEnv } from '../../shared/EnvManager.js';
import { ensureWorkerStarted, type WorkerStartResult } from '../../services/worker-spawner.js';
import { formatHostForUrl } from '../../shared/worker-utils.js';
import {
  ensureBun,
  ensureUv,
  installPluginDependencies,
  writeInstallMarker,
  isInstallCurrent,
} from '../install/setup-runtime.js';
import { playBanner } from '../banner.js';
import { normalizeRuntimeFlag } from './server-runtime-setup.js';
import { ErrorSeverity } from '../install/error-taxonomy.js';
import {
  createInstallSummary,
  flushSummary,
  installerError,
  InstallAbortError,
  type InstallSummary,
} from '../install/error-reporter.js';
import { extractEresolveBlock, isEresolve, runNpmStrict } from '../install/npm-install-helper.js';

function getSetting<K extends keyof SettingsDefaults>(key: K): SettingsDefaults[K] {
  return SettingsDefaultsManager.loadFromFile(USER_SETTINGS_PATH)[key];
}

const isInteractive = process.stdin.isTTY === true;

/**
 * Which package manager launched this CLI (npx / bunx / pnpm / yarn), parsed
 * from npm_config_user_agent ("npm/10.8.2 node/v22.14.0 darwin arm64 ...").
 * Bounded enum for telemetry — never raw user-agent content.
 */
function detectInstallMethod(): string {
  const agent = process.env.npm_config_user_agent ?? '';
  const name = agent.split('/')[0]?.trim().toLowerCase();
  if (name === 'npm' || name === 'bun' || name === 'pnpm' || name === 'yarn') return name;
  if (process.versions.bun) return 'bun';
  return 'unknown';
}

interface TaskDescriptor {
  title: string;
  task: (message: (msg: string) => void) => Promise<string>;
}

async function runTasks(tasks: TaskDescriptor[]): Promise<void> {
  if (isInteractive) {
    await p.tasks(tasks);
  } else {
    for (const t of tasks) {
      const result = await t.task((msg: string) => console.log(`  ${msg}`));
      console.log(`  ${result}`);
    }
  }
}

/**
 * Tick a task's spinner message with elapsed seconds. The multi-minute
 * dependency installs used to sit on one static message (and previously a
 * blocked event loop), which read as a stalled install. Returns a stop
 * function for a finally block. Non-interactive runs get the label once —
 * a per-second console.log line would spam CI logs.
 */
function startHeartbeat(message: (msg: string) => void, label: string): () => void {
  message(label);
  if (!isInteractive) return () => {};
  const started = Date.now();
  const timer = setInterval(() => {
    const elapsed = Math.round((Date.now() - started) / 1000);
    message(`${label} ${styleText('dim', `(${elapsed}s — still working)`)}`);
  }, 1000);
  return () => clearInterval(timer);
}

async function bufferConsole<T>(fn: () => Promise<T>): Promise<{ result: T; output: string }> {
  if (!isInteractive) {
    const result = await fn();
    return { result, output: '' };
  }
  let buffer = '';
  const append = (...args: unknown[]) => {
    buffer += args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ') + '\n';
  };
  const orig = { log: console.log, error: console.error, warn: console.warn };
  console.log = append;
  console.error = append;
  console.warn = append;
  try {
    const result = await fn();
    return { result, output: buffer };
  } finally {
    console.log = orig.log;
    console.error = orig.error;
    console.warn = orig.warn;
  }
}

const log = {
  info: (msg: string) => isInteractive ? p.log.info(msg) : console.log(`  ${msg}`),
  success: (msg: string) => isInteractive ? p.log.success(msg) : console.log(`  ${msg}`),
  warn: (msg: string) => isInteractive ? p.log.warn(msg) : console.warn(`  ${msg}`),
  error: (msg: string) => isInteractive ? p.log.error(msg) : console.error(`  ${msg}`),
};

import {
  marketplaceDirectory,
  npmPackagePluginDirectory,
  npmPackageRootDirectory,
  pluginCacheDirectory,
  readPluginVersion,
} from '../utils/paths.js';
import { readFlatSettings } from '../utils/settings.js';
import { shutdownWorkerAndWait } from '../../services/install/shutdown-helper.js';
import { detectInstalledIDEs } from './ide-detection.js';

function copyPluginToMarketplace(): void {
  const marketplaceDir = marketplaceDirectory();
  const packageRoot = npmPackageRootDirectory();

  if (!existsSync(marketplaceDir)) {
    mkdirSync(marketplaceDir, { recursive: true });
  }

  const allowedTopLevelEntries = [
    '.agents',
    '.codex-plugin',
    'plugin',
    'package.json',
    'package-lock.json',
    'openclaw',
    'dist',
    'LICENSE',
    'README.md',
    'CHANGELOG.md',
  ];

  for (const entry of allowedTopLevelEntries) {
    const sourcePath = join(packageRoot, entry);
    const destPath = join(marketplaceDir, entry);
    if (!existsSync(sourcePath)) continue;

    if (existsSync(destPath)) {
      rmSync(destPath, { recursive: true, force: true });
    }
    cpSync(sourcePath, destPath, {
      recursive: true,
      force: true,
    });
  }
}

function copyPluginToCache(version: string): void {
  const sourcePluginDirectory = npmPackagePluginDirectory();
  const cachePath = pluginCacheDirectory(version);

  rmSync(cachePath, { recursive: true, force: true });
  if (!existsSync(cachePath)) {
    mkdirSync(cachePath, { recursive: true });
  }
  cpSync(sourcePluginDirectory, cachePath, { recursive: true, force: true });
}

/**
 * Install marketplace dependencies, strict-first.
 *
 * Phase 4 of plans/04-installer-transparency.md: the old code ALWAYS passed
 * `--legacy-peer-deps`, papering over any real peer conflict unconditionally.
 * Now we run strict first and only fall back to `--legacy-peer-deps` on a
 * confirmed ERESOLVE token, announced loudly. `--ignore-scripts` is the default
 * (v12.6.2 lesson: a transitive postinstall can hang the install).
 */
async function runNpmInstallInMarketplace(summary: InstallSummary): Promise<void> {
  const marketplaceDir = marketplaceDirectory();
  const packageJsonPath = join(marketplaceDir, 'package.json');

  if (!existsSync(packageJsonPath)) return;

  const baseFlags = ['install', '--omit=dev', '--ignore-scripts'];
  const strictResult = await runNpmStrict(marketplaceDir, baseFlags);
  if (strictResult.code === 0) return;

  if (strictResult.timedOut) {
    installerError(ErrorSeverity.ABORT, {
      component: 'marketplace-npm-install',
      phase: 'marketplace-deps',
      cause: new Error('npm install timed out'),
      details: strictResult.stderr.slice(0, 4000),
    }, summary);
  }

  if (!isEresolve(strictResult.stderr)) {
    // A strict failure with no ERESOLVE is a real bug — never retry, ABORT.
    installerError(ErrorSeverity.ABORT, {
      component: 'marketplace-npm-install',
      phase: 'marketplace-deps',
      cause: new Error(`npm install failed (exit ${strictResult.code})`),
      details: strictResult.stderr.slice(0, 4000),
    }, summary);
  }

  // Confirmed ERESOLVE — log loudly, attempt one fallback with --legacy-peer-deps.
  log.warn('npm reported an ERESOLVE peer-dependency conflict in marketplace deps; retrying once with --legacy-peer-deps.');
  log.warn(extractEresolveBlock(strictResult.stderr));

  const legacyResult = await runNpmStrict(marketplaceDir, [...baseFlags, '--legacy-peer-deps']);
  if (legacyResult.code === 0) {
    summary.warnings.push({
      component: 'marketplace-npm-install',
      message: 'tree-sitter peer-dep ERESOLVE was resolved with the --legacy-peer-deps fallback. Benign for the marketplace install; re-evaluate when tree-sitter peer ranges change.',
      remediation: 'No action required.',
    });
    return;
  }

  installerError(ErrorSeverity.ABORT, {
    component: 'marketplace-npm-install',
    phase: 'marketplace-deps',
    cause: new Error(`npm install --legacy-peer-deps still failed (exit ${legacyResult.code}): ERESOLVE`),
    details: legacyResult.stderr.slice(0, 4000),
  }, summary);
}

function mergeSettings(updates: Record<string, string>): boolean {
  const path = USER_SETTINGS_PATH;
  try {
    let current: Record<string, unknown> = {};
    if (existsSync(path)) {
      try {
        current = { ...readFlatSettings(path) };
      } catch (parseError: unknown) {
        console.warn('[install] Failed to parse existing settings.json, starting from empty:', parseError instanceof Error ? parseError.message : String(parseError));
        current = {};
      }
    } else {
      const dir = dirname(path);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }

    for (const [key, value] of Object.entries(updates)) {
      current[key] = value;
    }

    writeSettingsJsonAtomic(path, current);
    return true;
  } catch (error: unknown) {
    log.error(`Failed to write settings to ${path}: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

type ProviderId = 'claude' | 'gemini' | 'openrouter';
// Phase 1d: Persisted DB literals (`server_beta_schema_migrations`, job_type
// enums, `server-beta-worker` lockedBy marker) are intentionally preserved in
// the source code; runtime-selector dual-accepts both `'server'` and
// `'server-beta'` settings values, but the installer writes the new canonical
// form `'server'` going forward (settings keys: OPENCODE_MEM_SERVER_{URL,
// API_KEY,PROJECT_ID}).
type RuntimeId = 'worker' | 'server';

const DEFAULT_SERVER_RUNTIME_BASE_URL = 'http://127.0.0.1:37877';

async function promptRuntime(options: InstallOptions): Promise<RuntimeId> {
  // #2543 — non-interactive runtime selection via `--runtime`. When the flag is
  // present we never prompt and never fall back to the worker path: we resolve
  // the requested runtime deterministically and, for the server runtime, plan +
  // execute the server-specific setup (Docker stack, key gen, IDE MCP config).
  if (options.runtime !== undefined) {
    const requested = normalizeRuntimeFlag(options.runtime);
    if (requested === null) {
      log.error(`Unknown --runtime: ${options.runtime}. Allowed: worker, server`);
      process.exit(1);
    }
    if (requested === 'server') {
      await setupServerRuntimeNonInteractive(options);
      return 'server';
    }
    mergeSettings({ OPENCODE_MEM_RUNTIME: 'worker' });
    return 'worker';
  }

  if (!isInteractive) {
    mergeSettings({ OPENCODE_MEM_RUNTIME: 'worker' });
    return 'worker';
  }

  const selected = await p.select<RuntimeId>({
    message: 'Which runtime should opencode-mem start after install?',
    options: [
      { value: 'worker', label: 'Worker', hint: 'stable compatibility path' },
      { value: 'server', label: 'Server (beta)', hint: 'REST V1, API keys, team-ready storage' },
    ],
    initialValue: 'worker',
  });

  if (p.isCancel(selected)) {
    p.cancel('Installation cancelled.');
    process.exit(0);
  }

  mergeSettings({
    OPENCODE_MEM_RUNTIME: selected,
  });

  if (selected === 'server') {
    await maybeBootstrapServerApiKey();
  }
  return selected;
}

// #2543 — set up the server runtime non-interactively. Docker stack bring-up
// is config-only here (we log the command an operator must run / a CI
// provisioner executes); key generation reuses the same bootstrap path as the
// interactive flow (createServerApiKey via server-bootstrap), and the IDE MCP
// config target is recorded in settings so hooks resolve the server runtime.
async function setupServerRuntimeNonInteractive(options: InstallOptions): Promise<void> {
  const serverBaseUrl = (options.serverUrl ?? '').trim() || DEFAULT_SERVER_RUNTIME_BASE_URL;

  mergeSettings({ OPENCODE_MEM_RUNTIME: 'server', OPENCODE_MEM_SERVER_URL: serverBaseUrl });

  log.info(
    'Server runtime selected. Bring up the bundled stack with '
      + '`docker compose up -d postgres valkey opencode-mem-server opencode-mem-worker` '
      + `(pg + redis/valkey). The server listens at ${serverBaseUrl}.`,
  );

  // The server mounts its MCP endpoint at `<baseUrl>/mcp` over HTTP (vs. the
  // worker's stdio transport); trailing slashes are trimmed so we never emit
  // `http://host//mcp`.
  log.info(
    `IDE MCP config target for the server runtime: http ${serverBaseUrl.replace(/\/+$/, '')}/mcp`,
  );

  await maybeBootstrapServerApiKey();
}

async function maybeBootstrapServerApiKey(): Promise<void> {
  // Only attempt if Postgres is configured. Without DATABASE_URL we cannot
  // reach the api_keys table — the operator must configure the server first
  // and rerun `opencode-mem server keys rotate`.
  if (!process.env.OPENCODE_MEM_SERVER_DATABASE_URL) {
    log.warn(
      'Skipping local hook API key bootstrap: OPENCODE_MEM_SERVER_DATABASE_URL is not set. '
        + 'Run `npx opencode-mem server keys rotate` after configuring Postgres to provision a key.',
    );
    return;
  }
  try {
    await bootstrapAndPersistServerApiKey();
  } catch (error: unknown) {
    // [ANTI-PATTERN IGNORED]: the failure is already surfaced to the user via the interactive-aware log.warn wrapper below (p.log.warn in a TTY, console.warn otherwise), including the manual remediation command.
    log.warn(
      `Failed to bootstrap server API key: ${error instanceof Error ? error.message : String(error)}. `
        + 'Hooks will fall back to the worker until you run `npx opencode-mem server keys rotate`.',
    );
  }
}

async function bootstrapAndPersistServerApiKey(): Promise<void> {
  const { bootstrapServerApiKey, persistServerSettings } = await import(
    '../../services/hooks/server-bootstrap.js'
  );
  const result = await bootstrapServerApiKey();
  persistServerSettings(USER_SETTINGS_PATH, {
    apiKey: result.rawKey,
    projectId: result.projectId,
  });
  log.info(
    `Provisioned local hook API key (project=${result.projectId.slice(0, 8)}…). `
      + 'Settings saved with mode 0600.',
  );
}

async function promptProvider(options: InstallOptions): Promise<ProviderId> {
  const initialProvider = (getSetting('OPENCODE_MEM_PROVIDER') as ProviderId) || 'claude';

  const persistClaudeProvider = () => {
    const wrote = mergeSettings({
      OPENCODE_MEM_PROVIDER: 'claude',
    });
    if (wrote) log.info('Saved Claude provider configuration to ~/.opencode-mem/settings.json');
  };

  const configureDirectApiKey = async (): Promise<void> => {
    const existing = loadOpenCodeMemEnv().ANTHROPIC_API_KEY || '';
    if (existing.trim().length > 0) {
      const choice = await p.select<'keep' | 'replace'>({
        message: 'An Anthropic API key is already configured. Keep it or enter a new one?',
        options: [
          { value: 'keep', label: 'Keep existing key' },
          { value: 'replace', label: 'Enter a new key (rotate)' },
        ],
        initialValue: 'keep',
      });
      if (p.isCancel(choice)) {
        log.warn('API key prompt cancelled — leaving existing configuration untouched.');
        return;
      }
      if (choice === 'keep') {
        saveOpenCodeMemEnv({
          ANTHROPIC_API_KEY: existing.trim(),
          ANTHROPIC_BASE_URL: '',
          ANTHROPIC_AUTH_TOKEN: '',
        });
        persistClaudeProvider();
        return;
      }
    }

    const apiKeyResult = await p.password({
      message: 'Paste your Anthropic API key:',
      mask: '*',
      validate: (v?: string) => (!v || v.trim().length === 0) ? 'API key required' : undefined,
    });

    if (p.isCancel(apiKeyResult)) {
      log.warn('API key prompt cancelled — leaving existing configuration untouched.');
      return;
    }

    saveOpenCodeMemEnv({
      ANTHROPIC_API_KEY: String(apiKeyResult).trim(),
      ANTHROPIC_BASE_URL: '',
      ANTHROPIC_AUTH_TOKEN: '',
    });
    persistClaudeProvider();
    log.info('Saved Anthropic API key for the Claude Agent SDK path.');
  };

  if (!isInteractive) {
    if (options.provider) {
      if (options.provider === 'claude') {
        persistClaudeProvider();
        return 'claude';
      }
      const keyEnvName = options.provider === 'gemini'
        ? 'OPENCODE_MEM_GEMINI_API_KEY'
        : 'OPENCODE_MEM_OPENROUTER_API_KEY';
      const settingsToMerge: Record<string, string> = { OPENCODE_MEM_PROVIDER: options.provider };
      if (options.apiKey) {
        settingsToMerge[keyEnvName] = options.apiKey;
      }
      const wrote = mergeSettings(settingsToMerge);
      if (wrote) log.info(`Saved provider=${options.provider} to ~/.opencode-mem/settings.json`);
      if (!options.apiKey) {
        log.warn(`Provider=${options.provider} requested non-interactively. API key prompt skipped — set ${keyEnvName} in settings.json or .env manually if not already set.`);
      }
      return options.provider;
    }
    return initialProvider;
  }

  let selectedProvider: ProviderId;
  if (options.provider) {
    selectedProvider = options.provider;
  } else {
    const providerResult = await p.select<ProviderId>({
      message: 'Which memory provider do you want to use?',
      options: [
        { value: 'claude', label: 'Claude Agent SDK (recommended)' },
        { value: 'gemini', label: 'Gemini' },
        { value: 'openrouter', label: 'OpenRouter' },
      ],
      initialValue: initialProvider,
    });
    if (p.isCancel(providerResult)) {
      p.cancel('Installation cancelled.');
      process.exit(0);
    }
    selectedProvider = providerResult;
  }

  if (selectedProvider === 'claude') {
    await configureDirectApiKey();
    return 'claude';
  }

  const providerLabel = selectedProvider === 'gemini' ? 'Gemini' : 'OpenRouter';
  const keyEnvName = selectedProvider === 'gemini'
    ? 'OPENCODE_MEM_GEMINI_API_KEY'
    : 'OPENCODE_MEM_OPENROUTER_API_KEY';

  const existingKey = getSetting(keyEnvName as keyof SettingsDefaults) as string | undefined;
  if (existingKey && existingKey.trim().length > 0) {
    const wrote = mergeSettings({ OPENCODE_MEM_PROVIDER: selectedProvider });
    if (wrote) log.info(`Saved provider=${selectedProvider} to ~/.opencode-mem/settings.json`);
    return selectedProvider;
  }

  const apiKeyResult = await p.password({
    message: `Paste your ${providerLabel} API key:`,
    mask: '*',
    validate: (v?: string) => (!v || v.trim().length === 0) ? 'API key required' : undefined,
  });

  if (p.isCancel(apiKeyResult)) {
    log.warn(`API key prompt cancelled — falling back to Claude provider.`);
    persistClaudeProvider();
    return 'claude';
  }

  const apiKey = String(apiKeyResult).trim();
  const wrote = mergeSettings({
    OPENCODE_MEM_PROVIDER: selectedProvider,
    [keyEnvName]: apiKey,
  });
  if (wrote) {
    log.info(`Saved provider=${selectedProvider} to ~/.opencode-mem/settings.json`);
  }
  return selectedProvider;
}

async function promptClaudeModel(options: InstallOptions): Promise<void> {
  const allowed = new Set([
    'claude-haiku-4-5-20251001',
    'claude-sonnet-4-6',
    'claude-opus-4-7',
  ]);

  if (options.model) {
    if (!allowed.has(options.model)) {
      throw new Error(
        `Unknown Claude model: ${options.model}. Allowed: ${[...allowed].join(', ')}`,
      );
    }
    const wrote = mergeSettings({ OPENCODE_MEM_MODEL: options.model });
    if (wrote) {
      log.info(`Saved Claude model=${options.model} to ~/.opencode-mem/settings.json`);
    }
    return;
  }

  if (!isInteractive) return;

  const initialModel = getSetting('OPENCODE_MEM_MODEL');
  const initialValue = allowed.has(initialModel) ? initialModel : 'claude-haiku-4-5-20251001';

  const result = await p.select<string>({
    message: 'Which Claude model should opencode-mem use to compress observations?\nThis runs whenever you and Claude touch a file — keep it cheap and fast.',
    options: [
      { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 (recommended — fast, cheap, great for compression)' },
      { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6 (balanced quality and cost)' },
      { value: 'claude-opus-4-7', label: 'Opus 4.7 (highest quality, most expensive)' },
    ],
    initialValue,
  });

  if (p.isCancel(result)) {
    p.cancel('Installation cancelled.');
    process.exit(0);
  }
  const selectedModel = result as string;

  const wrote = mergeSettings({ OPENCODE_MEM_MODEL: selectedModel });
  if (wrote) {
    log.info(`Saved Claude model=${selectedModel} to ~/.opencode-mem/settings.json`);
  }
}

function makeIDETask(ideId: string, summary: InstallSummary): TaskDescriptor | null {
  const recordFailure = (label: string, output: string) => {
    // Route every per-IDE failure through the central decision point. A single
    // IDE failure is FAIL_LOUD_PER_IDE (partial install); the summary headline
    // and exit code reflect it. The stderr is preserved verbatim in `details`.
    installerError(ErrorSeverity.FAIL_LOUD_PER_IDE, {
      component: label,
      ide: ideId,
      phase: 'ide-install',
      cause: new Error(label),
      details: output && output.trim().length > 0 ? output.trim().slice(0, 4000) : undefined,
    }, summary);
  };

  switch (ideId) {
    case 'opencode': {
      return {
        title: 'OpenCode: installing plugin',
        task: async (message) => {
          message('Loading OpenCode installer…');
          const { installOpenCodeIntegration } = await import('../../services/integrations/OpenCodeInstaller.js');
          message('Installing OpenCode plugin…');
          const { result, output } = await bufferConsole(() => installOpenCodeIntegration());
          if (result !== 0) {
            recordFailure('OpenCode: plugin installation failed', output);
            return `OpenCode: plugin installation failed ${styleText('red', 'FAIL')}`;
          }
          return `OpenCode: plugin installed ${styleText('green', 'OK')}`;
        },
      };
    }

    default: {
      return null;
    }
  }
}

async function setupIDEs(selectedIDEs: string[], summary: InstallSummary): Promise<string[]> {
  const tasks: TaskDescriptor[] = [];
  for (const ideId of selectedIDEs) {
    const taskDescriptor = makeIDETask(ideId, summary);
    if (taskDescriptor) tasks.push(taskDescriptor);
  }

  if (tasks.length > 0) {
    await runTasks(tasks);
  }

  // FAIL_LOUD_PER_IDE failures were recorded on the summary; if EVERY selected
  // IDE failed, escalate to an ABORT (all-ides-failed) — a fully failed install
  // must not print "Installation Complete".
  if (selectedIDEs.length > 0 && summary.failedIDEs.length === selectedIDEs.length) {
    installerError(ErrorSeverity.ABORT, {
      component: 'all-ides',
      phase: 'ide-install',
      cause: new Error(`All ${selectedIDEs.length} selected IDE integrations failed.`),
    }, summary);
  }

  return summary.failedIDEs;
}

async function promptForIDESelection(): Promise<string[]> {
  const detectedIDEs = detectInstalledIDEs();
  const openCodeInfo = detectedIDEs.find((ide) => ide.id === 'opencode');

  if (openCodeInfo && !openCodeInfo.detected) {
    log.warn('OpenCode not detected. The integration will be installed but may need manual setup.');
  }

  const result = await p.multiselect({
    message: 'Which IDEs do you use?',
    options: [
      {
        value: 'opencode',
        label: 'OpenCode',
        hint: 'plugin-based integration',
      },
    ],
    initialValues: ['opencode'],
    required: true,
  });

  if (p.isCancel(result)) {
    p.cancel('Installation cancelled.');
    process.exit(0);
  }

  return result as string[];
}

// --- CMEM Online email opt-in ----------------------------------------------
// Interactive, optional. The CLI POSTs the email + optional note to the live
// waitlist endpoint (cmem.ai/api/waitlist), which handles persistence, dedup,
// and the confirmation email server-side. OPENCODE_MEM_SIGNUP_URL overrides the
// default for testing/staging. No API keys ever ship in the npx package — the
// endpoint is unauthenticated and the secret (Resend) stays server-side.
// Anything that goes wrong here is swallowed — a marketing opt-in must never
// block or fail the install.

const DEFAULT_SIGNUP_ENDPOINT = 'https://cmem.ai/api/waitlist';
const SIGNUP_ENDPOINT = process.env.OPENCODE_MEM_SIGNUP_URL?.trim() || DEFAULT_SIGNUP_ENDPOINT;
const SIGNUP_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface StoredSignup {
  email: string;
  note: string;
  sent: boolean;
}

function parseStoredSignup(): StoredSignup | null {
  const flat = readFlatSettings(USER_SETTINGS_PATH);
  if (!flat) return null;
  const email = typeof flat.OPENCODE_MEM_ONLINE_SIGNUP_EMAIL === 'string' ? flat.OPENCODE_MEM_ONLINE_SIGNUP_EMAIL : '';
  if (!email) return null;
  return {
    email,
    note: typeof flat.OPENCODE_MEM_ONLINE_SIGNUP_NOTE === 'string' ? flat.OPENCODE_MEM_ONLINE_SIGNUP_NOTE : '',
    sent: flat.OPENCODE_MEM_ONLINE_SIGNUP_SENT === 'true',
  };
}

function readStoredSignup(): StoredSignup | null {
  try {
    return parseStoredSignup();
  } catch {
    // [ANTI-PATTERN IGNORED]: settings.json is optional and may be missing or hand-edited into invalid JSON; treating that as "no stored signup" simply re-asks the opt-in, the designed recovery for this never-blocking marketing flow.
    return null;
  }
}

async function postSignup(payload: { email: string; note: string; version: string }, signal: AbortSignal): Promise<boolean> {
  const res = await fetch(SIGNUP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: payload.email,
      note: payload.note,
      version: payload.version,
      platform: process.platform,
      source: 'npx-installer',
    }),
    signal,
  });
  return res.ok;
}

async function submitOnlineSignup(payload: { email: string; note: string; version: string }): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    return await postSignup(payload, controller.signal);
  } catch {
    // [ANTI-PATTERN IGNORED]: network/timeout failures of this optional waitlist POST are expected offline; the caller persists the email locally and retries silently on the next install run.
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Final step of the install flow: tell the user telemetry is on by default
 * (opt-out) and let them decide. Asked ONCE — a telemetry.json with a recorded
 * enabled decision means the user already chose, and we never re-nag. An
 * installId-only config (written by the worker's ID bootstrap) does NOT count
 * as a decision. Respects DO_NOT_TRACK (skip entirely: they already answered),
 * CI, and non-TTY. See docs/public/telemetry.mdx for what is/isn't collected.
 */
async function promptTelemetryOptIn(): Promise<void> {
  if (!isInteractive) return;
  if (process.env.CI) return;
  const dnt = process.env.DO_NOT_TRACK;
  if (dnt !== undefined && dnt !== '' && dnt !== '0' && dnt !== 'false') return;
  const existing = loadTelemetryConfig();
  if (existing?.enabled !== undefined) return;

  p.log.message(styleText('dim', 
    'Anonymous install ID only — no prompts, file paths, code, or project names, ever.\n'
    + 'Details: https://docs.opencode-mem.ai/telemetry · Change anytime: opencode-mem telemetry disable',
  ));
  const consent = await p.confirm({
    message: 'Share anonymized usage data with CMEM? It is on by default and helps us make the product better.',
    initialValue: true,
  });
  if (p.isCancel(consent)) return;

  saveTelemetryConfig({
    enabled: consent === true,
    installId: existing?.installId || randomUUID(),
    decidedAt: new Date().toISOString(),
  });
  log.success(consent ? 'Thanks! Anonymized usage sharing is on.' : 'No problem — telemetry is off.');
}

async function promptCmemOnlineOptIn(version: string): Promise<void> {
  // Interactive-only, and easy to turn off for CI / scripted installs.
  if (!isInteractive) return;
  if (process.env.CI) return;
  if (String(process.env.OPENCODE_MEM_ONLINE_OPTIN ?? '').trim().toLowerCase() === 'false') return;

  const prior = readStoredSignup();
  if (prior) {
    // We already captured this email — don't re-nag. If a previous send never
    // reached the service, quietly retry once now and record the result.
    if (!prior.sent) {
      const ok = await submitOnlineSignup({ email: prior.email, note: prior.note, version });
      if (ok) mergeSettings({ OPENCODE_MEM_ONLINE_SIGNUP_SENT: 'true' });
    }
    return;
  }

  p.note(
    [
      styleText(['bold', 'cyan'], 'New! CMEM Online: every mem everywhere all at once.'),
      '',
      "Share your email and we'll send you a link. We're rolling this out to our",
      'top users first, then everyone ASAP.',
    ].join('\n'),
    'CMEM Online',
  );

  const emailResult = await p.text({
    message: 'Your work email (press Enter to skip):',
    placeholder: 'you@company.com',
    defaultValue: '',
    validate: (v?: string) => {
      const value = (v ?? '').trim();
      if (value.length === 0) return undefined; // empty = skip, not an error
      if (!SIGNUP_EMAIL_RE.test(value)) return "That doesn't look like an email — fix it, or clear the field to skip.";
      return undefined;
    },
  });

  if (p.isCancel(emailResult)) return;
  const email = String(emailResult).trim();
  if (email.length === 0) return;

  const noteResult = await p.text({
    message: 'Optionally: what are you working on, or how can we help you and your team? (Enter to skip)',
    placeholder: 'e.g. migrating a monorepo, onboarding a 5-dev team…',
    defaultValue: '',
  });
  const note = p.isCancel(noteResult) ? '' : String(noteResult).trim();

  const spin = p.spinner();
  spin.start('Signing you up for CMEM Online…');
  const ok = await submitOnlineSignup({ email, note, version });
  // Persist locally regardless of the network result so we never re-prompt;
  // a failed send is retried silently on the next install (see above).
  mergeSettings({
    OPENCODE_MEM_ONLINE_SIGNUP_EMAIL: email,
    OPENCODE_MEM_ONLINE_SIGNUP_NOTE: note,
    OPENCODE_MEM_ONLINE_SIGNUP_AT: new Date().toISOString(),
    OPENCODE_MEM_ONLINE_SIGNUP_SENT: ok ? 'true' : 'false',
  });
  if (ok) {
    spin.stop(`You're on the list — we'll email ${styleText('cyan', email)} your CMEM Online link.`);
  } else {
    spin.stop(styleText('yellow', `Saved ${email} — we'll finish signing you up next time you run the installer.`));
  }
}

export interface InstallOptions {
  ide?: string;
  provider?: 'claude' | 'gemini' | 'openrouter';
  model?: string;
  apiKey?: string;
  noAutoStart?: boolean;
  disableAutoMemory?: boolean;
  // #2543 — non-interactive runtime selection. `server` is the operator-facing
  // alias for the canonical `server-beta` runtime id.
  runtime?: 'worker' | 'server' | 'server-beta';
  // Base URL the server runtime (and the injected IDE MCP config) targets.
  serverUrl?: string;
}

export async function runInstallCommand(options: InstallOptions = {}): Promise<void> {
  const summary = createInstallSummary();
  try {
    await runInstallCommandInner(options, summary);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err instanceof InstallAbortError) {
      // err.category.id is OUR taxonomy id (error-taxonomy.ts), never a message.
      await captureCliEvent('install_failed', {
        error_category: err.category.id,
        interactive: isInteractive,
        install_method: detectInstallMethod(),
      }, { person: true });
      // Flush whatever warnings accrued before the abort, then print the
      // remediation headline and exit non-zero. ABORT must never reach the
      // "Installation Complete" path.
      flushSummary(summary, (line) => (isInteractive ? p.log.message(line) : console.error(`  ${line}`)));
      const headline = `Installation Aborted: ${err.category.id}`;
      if (isInteractive) {
        p.log.error(headline);
        p.log.error(err.remediation);
        p.outro(styleText('red', 'opencode-mem installation aborted.'));
      } else {
        console.error(`\n  ${headline}`);
        console.error(`  ${err.remediation}`);
        console.error(`  ${err.message}`);
      }
      process.exit(1);
    }
    throw error;
  }
}

async function runInstallCommandInner(options: InstallOptions, summary: InstallSummary): Promise<void> {
  const installStartedAt = Date.now();
  const version = readPluginVersion();
  // Captured by the runtime-setup task below; reported on install_completed
  // so funnel dropoff can be sliced by toolchain versions.
  let installedBunVersion: string | undefined;
  let installedUvVersion: string | undefined;

  if (isInteractive) {
    await playBanner();
    p.intro(styleText(['bgCyan', 'black'], ' opencode-mem install '));
  } else {
    console.log('opencode-mem install');
  }
  const marketplaceDir = marketplaceDirectory();
  const alreadyInstalled = existsSync(join(marketplaceDir, 'plugin', '.claude-plugin', 'plugin.json'));

  let existingVersion: string | undefined;
  if (alreadyInstalled) {
    try {
      const existingPluginJson = JSON.parse(
        readFileSync(join(marketplaceDir, 'plugin', '.claude-plugin', 'plugin.json'), 'utf-8'),
      );
      existingVersion = existingPluginJson.version ?? undefined;
    } catch (error: unknown) {
      console.warn('[install] Failed to read existing plugin version:', error instanceof Error ? error.message : String(error));
    }
  }

  const dot = styleText('dim', '·');
  const segments = [`${styleText('bold', 'opencode-mem')} ${styleText('cyan', `v${version}`)}`];
  if (existingVersion && existingVersion !== version) {
    segments.push(`installed ${styleText('yellow', `v${existingVersion}`)}`);
  } else if (existingVersion) {
    segments.push(styleText('dim', 'reinstall'));
  }
  log.info(segments.join(` ${dot} `));

  await promptCmemOnlineOptIn(version);

  if (alreadyInstalled) {
    if (process.stdin.isTTY) {
      const shouldContinue = await p.confirm({
        message: 'Overwrite existing installation?',
        initialValue: true,
      });

      if (p.isCancel(shouldContinue) || !shouldContinue) {
        p.cancel('Installation cancelled.');
        process.exit(0);
      }
    }
  }

  let selectedIDEs: string[];
  if (options.ide) {
    selectedIDEs = [options.ide];
    if (options.ide !== 'opencode') {
      log.error(`Unknown IDE: ${options.ide}`);
      log.info(`Available IDEs: opencode`);
      process.exit(1);
    }
  } else if (process.stdin.isTTY) {
    selectedIDEs = await promptForIDESelection();
  } else {
    selectedIDEs = ['opencode'];
  }

  const selectedRuntime = await promptRuntime(options);
  const selectedProvider = await promptProvider(options);
  if (selectedProvider === 'claude') {
    await promptClaudeModel(options);
  }

  let workerStartResult: WorkerStartResult = 'dead';

  {
    const installPort = getSetting('OPENCODE_MEM_WORKER_PORT');
    const shutdownSpinner = isInteractive ? p.spinner() : null;
    shutdownSpinner?.start('Stopping running worker (so we can overwrite cleanly)…');
    try {
      const result = await shutdownWorkerAndWait(installPort, 10000);
      const stopMessage = result.workerWasRunning ? 'Stopped running worker before overwrite.' : 'No worker running — proceeding.';
      if (shutdownSpinner) {
        shutdownSpinner.stop(stopMessage);
      } else if (result.workerWasRunning) {
        log.info('Stopped running worker before overwrite.');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (shutdownSpinner) {
        shutdownSpinner.error(`Pre-overwrite worker shutdown failed: ${message}`);
      } else {
        console.warn('[install] Pre-overwrite worker shutdown failed:', message);
      }
    }

    const tasks: TaskDescriptor[] = [
      {
        title: 'Caching plugin version',
        task: async (message) => {
          message(`Caching v${version}...`);
          copyPluginToCache(version);
          return `Plugin cached (v${version}) ${styleText('green', 'OK')}`;
        },
      },
      {
        title: 'Populating marketplace directory',
        task: async (message) => {
          message('Copying plugin to marketplace...');
          copyPluginToMarketplace();
          return `Marketplace populated ${styleText('green', 'OK')}`;
        },
      },
      {
        title: 'Setting up runtime (first install can take ~30s)',
        task: async (message) => {
          message('Checking Bun…');
          const { version: bunVersion } = await ensureBun(summary);
          message('Checking uv…');
          const { version: uvVersion } = await ensureUv(summary);
          installedBunVersion = bunVersion;
          installedUvVersion = uvVersion;
          const cacheDir = pluginCacheDirectory(version);
          if (!isInstallCurrent(cacheDir, version)) {
            const { bunPath } = await ensureBun();
            const stopHeartbeat = startHeartbeat(message, 'Installing plugin dependencies (bun install)…');
            try {
              await installPluginDependencies(cacheDir, bunPath);
            } finally {
              stopHeartbeat();
            }
            writeInstallMarker(cacheDir, version, bunVersion, uvVersion);
          }
          return `Runtime ready (Bun ${bunVersion}, uv ${uvVersion}) ${styleText('green', 'OK')}`;
        },
      },
    ];

    await runTasks(tasks);
  }

  const failedIDEs = await setupIDEs(selectedIDEs, summary);

  // The server runtime is brought up via its own stack (Docker pg+redis +
  // `opencode-mem server start`), NOT the worker-service spawner. Skip the
  // worker-only autostart entirely so the server runtime never invokes the
  // worker path (#2543).
  const autoStartSkipped = !isInteractive || options.noAutoStart || selectedRuntime === 'server';

  await runTasks([
    {
      title: selectedRuntime === 'server' ? 'Starting server daemon' : 'Starting worker daemon',
      task: async (message) => {
        if (selectedRuntime === 'server') {
          return `Server runtime selected — start it with ${styleText('bold', 'npx opencode-mem server start')} ${styleText('dim', '(or via Docker compose)')}`;
        }
        if (autoStartSkipped) {
          return isInteractive
            ? `Skipped (--no-auto-start)`
            : `Skipped (non-TTY)`;
        }
        const port = Number(getSetting('OPENCODE_MEM_WORKER_PORT'));
        const marketplaceScriptPath = join(marketplaceDirectory(), 'plugin', 'scripts', 'worker-service.cjs');
        const cacheScriptPath = join(pluginCacheDirectory(version), 'scripts', 'worker-service.cjs');
        const scriptPath = existsSync(marketplaceScriptPath) ? marketplaceScriptPath : cacheScriptPath;
        // selectedRuntime is narrowed to 'worker' here: the server case
        // returned above and never reaches the worker-service spawner.
        message(`Spawning worker on port ${port}...`);
        workerStartResult = await ensureWorkerStarted(port, scriptPath);
        switch (workerStartResult) {
          case 'ready':
            return `Worker ready at http://localhost:${port} ${styleText('green', 'OK')}`;
          case 'warming':
            return `Worker starting on port ${port} — finishing in background ${styleText('yellow', '⏳')}`;
          case 'dead':
            return `Worker did not start — try \`npx opencode-mem start\` manually ${styleText('yellow', '!')}`;
        }
      },
    },
  ]);

  // "Installation Complete" only when no ABORT fired (we'd have thrown) AND no
  // IDE failed. Any failed IDE => "Installation Partial". Reads summary.failedIDEs
  // (which captures failures that happen AFTER bufferConsole returns), not a
  // stale local count.
  const hasFailures = summary.failedIDEs.length > 0;
  const installStatus = hasFailures ? 'Installation Partial' : 'Installation Complete';
  const summaryLines = [
    `Version:     ${styleText('cyan', version)}`,
    `Plugin dir:  ${styleText('cyan', marketplaceDir)}`,
    `IDEs:        ${styleText('cyan', selectedIDEs.join(', '))}`,
  ];
  if (failedIDEs.length > 0) {
    summaryLines.push(`Failed:      ${styleText('red', failedIDEs.join(', '))}`);
  }

  if (isInteractive) {
    p.note(summaryLines.join('\n'), installStatus);
  } else {
    console.log(`\n  ${installStatus}`);
    summaryLines.forEach(l => console.log(`  ${l}`));
  }

  // Flush all WARN_CONTINUE / FAIL_LOUD_PER_IDE warnings + remediation AFTER the
  // spinners and summary note (a live print would be clobbered by clack).
  flushSummary(summary, (line) => (isInteractive ? p.log.message(line) : console.log(`  ${line}`)));

  const workerHost = getSetting('OPENCODE_MEM_WORKER_HOST');
  const workerUrlHost = formatHostForUrl(workerHost);
  const workerPort = getSetting('OPENCODE_MEM_WORKER_PORT');

  let actualPort: number | string = workerPort;
  let workerReady = false;
  // Don't poll the worker or imply it's "still starting" when autostart was
  // intentionally skipped (--no-auto-start, or non-interactive default). The
  // user knows they have to start it themselves; lying about a starting worker
  // is misleading.
  if (!autoStartSkipped) {
    const healthSpinner = isInteractive ? p.spinner() : null;
    healthSpinner?.start(`Verifying worker on port ${workerPort}…`);
    try {
      const healthResponse = await fetch(`http://${workerUrlHost}:${workerPort}/api/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (healthResponse.ok) {
        workerReady = true;
        try {
          const body = await healthResponse.json() as { port?: number | string };
          if (body && (typeof body.port === 'number' || typeof body.port === 'string')) {
            actualPort = body.port;
          }
        } catch {
          // Health endpoint returned non-JSON — keep using the requested port.
        }
      }
      healthSpinner?.stop(
        workerReady
          ? `Worker ready at http://localhost:${actualPort}`
          : `Worker reachable but not ready on port ${workerPort}`,
      );
    } catch {
      healthSpinner?.stop(`Worker not yet responding on port ${workerPort} (still starting)`);
    }
  }

  const finalWorkerState = workerStartResult as WorkerStartResult;
  const workerAlive = finalWorkerState !== 'dead' || workerReady;
  const runtimeLabel = selectedRuntime === 'server' ? 'Server' : 'Worker';
  const runtimeStartCommand = selectedRuntime === 'server' ? 'npx opencode-mem server start' : 'npx opencode-mem start';
  const workerBaseUrl = `http://${workerUrlHost}:${actualPort}`;
  const configuredWorkerBaseUrl = `http://${workerUrlHost}:${workerPort}`;
  const workerHeadline = autoStartSkipped
    ? `${styleText('yellow', '!')} ${runtimeLabel} autostart skipped — start it manually with ${styleText('bold', runtimeStartCommand)}`
    : workerReady || finalWorkerState === 'ready'
      ? `${styleText('green', '✓')} ${runtimeLabel} running at ${styleText('underline', workerBaseUrl)}`
      : `${styleText('yellow', '⏳')} ${runtimeLabel} starting at ${styleText('underline', workerBaseUrl)} — give it ~30s, then refresh`;
  const nextStepsHeadline = autoStartSkipped || workerAlive
    ? workerHeadline
    : `${styleText('yellow', '!')} Worker not yet ready on port ${styleText('cyan', String(workerPort))} -- still starting up; check ${styleText('bold', 'opencode-mem status')} later, or start manually: ${styleText('bold', 'npx opencode-mem start')}`;
  const firstSuccessOpener = autoStartSkipped
    ? `once the worker is running, keep ${styleText('underline', configuredWorkerBaseUrl)} open in a browser`
    : workerAlive
      ? 'keep that URL open in a browser'
      : `keep ${styleText('underline', configuredWorkerBaseUrl)} open in a browser`;
  const nextSteps = [
    nextStepsHeadline,
    ``,
    `${styleText('bold', 'First success:')} ${firstSuccessOpener}, then open OpenCode in any project. Observations stream in as OpenCode reads, edits, and runs commands.`,
    ``,
    `${styleText('bold', 'Two paths from here:')}`,
    `  ${styleText('cyan', 'A.')} Just start working. Memory builds passively from your first prompt. (Recommended.)`,
    `  ${styleText('cyan', 'B.')} Front-load it: open OpenCode and run ${styleText('bold', '/learn-codebase')} to ingest the whole repo (~5 min, optional).`,
    ``,
    `Memory injection starts on your second session in a project.`,
    `Everything stays in ${styleText('cyan', '~/.opencode-mem')} on this machine.`,
    ``,
    `${styleText('dim', 'How it works: /how-it-works   ·   Disable first-session hint: OPENCODE_MEM_WELCOME_HINT_ENABLED=false')}`,
    `${styleText('dim', 'Note: close all OpenCode sessions before uninstalling, or ~/.opencode-mem will be recreated by active hooks.')}`,
  ];

  if (isInteractive) {
    p.note(nextSteps.join('\n'), 'Next Steps');
    // Deliberately the last interaction of the flow: consent is asked after
    // the product is installed and working, never as a gate in front of it.
    await promptTelemetryOptIn();
    if (failedIDEs.length > 0) {
      p.outro(styleText('yellow', 'opencode-mem installed with some IDE setup failures.'));
    } else {
      p.outro(styleText('green', 'opencode-mem installed successfully!'));
    }
  } else {
    console.log('\n  Next Steps');
    nextSteps.forEach(l => console.log(`  ${l}`));
    if (failedIDEs.length > 0) {
      console.log('\nopencode-mem installed with some IDE setup failures.');
      process.exitCode = 1;
    } else {
      console.log('\nopencode-mem installed successfully!');
    }
  }

  // After promptTelemetryOptIn so a just-made consent choice is honored.
  // ide/provider/runtime_mode/install_method are installer enums, the
  // *_version values are tool version strings — never user data.
  await captureCliEvent('install_completed', {
    ide: selectedIDEs.join(','),
    provider: selectedProvider,
    runtime_mode: selectedRuntime,
    is_update: alreadyInstalled,
    outcome: failedIDEs.length > 0 ? 'partial' : 'ok',
    duration_ms: Date.now() - installStartedAt,
    interactive: isInteractive,
    install_method: detectInstallMethod(),
    bun_version: installedBunVersion,
    uv_version: installedUvVersion,
  }, { person: true });
}

async function runRepairCommandInner(summary: InstallSummary): Promise<void> {
  const version = readPluginVersion();
  const cacheDir = pluginCacheDirectory(version);
  const marketplaceDir = marketplaceDirectory();
  let bunVersion = 'unknown';
  let uvVersion = 'unknown';

  if (isInteractive) {
    p.intro(styleText(['bgCyan', 'black'], ' opencode-mem repair '));
  } else {
    console.log('opencode-mem repair');
  }
  log.info(`Version: ${styleText('cyan', version)}`);

  await runTasks([
    {
      title: 'Setting up runtime',
      task: async (message) => {
        message('Checking Bun…');
        const bun = await ensureBun(summary);
        bunVersion = bun.version;
        message('Checking uv…');
        const uv = await ensureUv(summary);
        uvVersion = uv.version;
        // Repair must regenerate the cache if it was wiped (e.g. user ran
        // `rm -rf ~/.claude/plugins/cache`). Without this, bun install would
        // fail immediately with no package.json to install against.
        if (!existsSync(join(cacheDir, 'package.json'))) {
          message('Cache missing — repopulating from npm package…');
          copyPluginToCache(version);
        }
        message('Reinstalling plugin dependencies…');
        const { bunPath } = bun;
        await installPluginDependencies(cacheDir, bunPath);
        writeInstallMarker(cacheDir, version, bunVersion, uvVersion);
        return `Runtime ready (Bun ${bunVersion}, uv ${uvVersion}) ${styleText('green', 'OK')}`;
      },
    },
    {
      title: 'Repairing marketplace runtime',
      task: async (message) => {
        message('Repopulating marketplace root from npm package…');
        copyPluginToMarketplace();
        message('Reinstalling marketplace dependencies…');
        const stopHeartbeat = startHeartbeat(message, 'Running npm install…');
        try {
          await runNpmInstallInMarketplace(summary);
          writeInstallMarker(marketplaceDir, version, bunVersion, uvVersion);
        } finally {
          stopHeartbeat();
        }
        return `Marketplace runtime ready ${styleText('green', 'OK')}`;
      },
    },
  ]);

  flushSummary(summary, (line) => (isInteractive ? p.log.message(line) : console.log(`  ${line}`)));

  if (isInteractive) {
    p.outro(styleText('green', 'opencode-mem repair complete.'));
  } else {
    console.log('opencode-mem repair complete.');
  }
}

export async function runRepairCommand(): Promise<void> {
  const summary = createInstallSummary();
  try {
    await runRepairCommandInner(summary);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err instanceof InstallAbortError) {
      flushSummary(summary, (line) => (isInteractive ? p.log.message(line) : console.error(`  ${line}`)));
      const headline = `Repair Aborted: ${err.category.id}`;
      if (isInteractive) {
        p.log.error(headline);
        p.log.error(err.remediation);
        p.outro(styleText('red', 'opencode-mem repair aborted.'));
      } else {
        console.error(`\n  ${headline}`);
        console.error(`  ${err.remediation}`);
        console.error(`  ${err.message}`);
      }
      process.exit(1);
    }
    throw error;
  }
}
