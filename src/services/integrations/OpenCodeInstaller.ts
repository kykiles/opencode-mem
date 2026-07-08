
import path from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, unlinkSync } from 'fs';
import { logger } from '../../utils/logger.js';
import { CONTEXT_TAG_OPEN, CONTEXT_TAG_CLOSE, injectContextIntoMarkdownFile } from '../../utils/context-injection.js';
import { getWorkerHost, getWorkerPort } from '../../shared/worker-utils.js';

const OPENCODE_PLUGIN_CONFIG_PATH = './plugins/opencode-mem.js';

type OpenCodeConfig = {
  $schema?: string;
  plugin?: unknown;
  [key: string]: unknown;
};

export function getOpenCodeConfigDirectory(): string {
  if (process.env.OPENCODE_CONFIG_DIR) {
    return process.env.OPENCODE_CONFIG_DIR;
  }
  return path.join(homedir(), '.config', 'opencode');
}

export function getOpenCodePluginsDirectory(): string {
  return path.join(getOpenCodeConfigDirectory(), 'plugins');
}

export function getOpenCodeConfigPath(): string {
  return path.join(getOpenCodeConfigDirectory(), 'opencode.json');
}

export function getOpenCodeAgentsMdPath(): string {
  return path.join(getOpenCodeConfigDirectory(), 'AGENTS.md');
}

export function getInstalledPluginPath(): string {
  return path.join(getOpenCodePluginsDirectory(), 'opencode-mem.js');
}

function getOpenCodePluginEntries(config: OpenCodeConfig): unknown[] {
  if (Array.isArray(config.plugin)) {
    return config.plugin;
  }
  return config.plugin === undefined ? [] : [config.plugin];
}

export function addOpenCodePluginReference(config: OpenCodeConfig): OpenCodeConfig {
  const existingPlugins = getOpenCodePluginEntries(config);
  if (existingPlugins.includes(OPENCODE_PLUGIN_CONFIG_PATH)) {
    return config;
  }

  return {
    ...config,
    plugin: [...existingPlugins, OPENCODE_PLUGIN_CONFIG_PATH],
  };
}

export function removeOpenCodePluginReference(config: OpenCodeConfig): OpenCodeConfig {
  return {
    ...config,
    plugin: getOpenCodePluginEntries(config).filter(
      (plugin) => plugin !== OPENCODE_PLUGIN_CONFIG_PATH,
    ),
  };
}

export function registerOpenCodePluginInConfig(): number {
  const configPath = getOpenCodeConfigPath();
  const defaultConfig: OpenCodeConfig = {
    $schema: 'https://opencode.ai/config.json',
  };

  try {
    const config = existsSync(configPath)
      ? JSON.parse(readFileSync(configPath, 'utf-8')) as OpenCodeConfig
      : defaultConfig;
    const updatedConfig = addOpenCodePluginReference(config);

    writeFileSync(configPath, `${JSON.stringify(updatedConfig, null, 2)}\n`, 'utf-8');
    console.log(`  Plugin registered in: ${configPath}`);
    logger.info('OPENCODE', 'Plugin registered in config', { path: configPath });

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to register OpenCode plugin in config: ${message}`);
    return 1;
  }
}

export function deregisterOpenCodePluginFromConfig(): number {
  const configPath = getOpenCodeConfigPath();
  if (!existsSync(configPath)) {
    return 0;
  }

  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8')) as OpenCodeConfig;
    const updatedConfig = removeOpenCodePluginReference(config);

    writeFileSync(configPath, `${JSON.stringify(updatedConfig, null, 2)}\n`, 'utf-8');
    console.log(`  Plugin deregistered from: ${configPath}`);
    logger.info('OPENCODE', 'Plugin deregistered from config', { path: configPath });

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to deregister OpenCode plugin from config: ${message}`);
    return 1;
  }
}

export function findBuiltPluginPath(): string | null {
  const possiblePaths = [
    path.join(
      process.env.CLAUDE_CONFIG_DIR || path.join(homedir(), '.claude'),
      'plugins', 'marketplaces', 'thedotmack',
      'dist', 'opencode-plugin', 'index.js',
    ),
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'dist', 'opencode-plugin', 'index.js'),
  ];

  for (const candidatePath of possiblePaths) {
    if (existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return null;
}

export function installOpenCodePlugin(): number {
  const builtPluginPath = findBuiltPluginPath();
  if (!builtPluginPath) {
    console.error('Could not find built OpenCode plugin bundle.');
    console.error('  Expected at: dist/opencode-plugin/index.js');
    console.error('  Run the build first: npm run build');
    return 1;
  }

  const pluginsDirectory = getOpenCodePluginsDirectory();
  const destinationPath = getInstalledPluginPath();

  try {
    mkdirSync(pluginsDirectory, { recursive: true });

    copyFileSync(builtPluginPath, destinationPath);

    console.log(`  Plugin installed to: ${destinationPath}`);
    logger.info('OPENCODE', 'Plugin installed', { destination: destinationPath });

    const registerResult = registerOpenCodePluginInConfig();
    if (registerResult !== 0) {
      return registerResult;
    }

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to install OpenCode plugin: ${message}`);
    return 1;
  }
}

export function injectContextIntoAgentsMd(contextContent: string): number {
  const agentsMdPath = getOpenCodeAgentsMdPath();

  try {
    injectContextIntoMarkdownFile(agentsMdPath, contextContent, '# opencode-mem Memory Context');
    logger.info('OPENCODE', 'Context injected into AGENTS.md', { path: agentsMdPath });
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to inject context into AGENTS.md: ${message}`);
    return 1;
  }
}

async function fetchRealContextFromWorker(): Promise<string | null> {
  const workerHost = getWorkerHost();
  const workerPort = getWorkerPort();
  const workerUrl = `http://${workerHost}:${workerPort}`;
  const healthResponse = await fetch(`${workerUrl}/api/readiness`);
  if (!healthResponse.ok) return null;

  const contextResponse = await fetch(
    `${workerUrl}/api/context/inject?project=opencode`,
  );
  if (!contextResponse.ok) return null;

  const realContext = await contextResponse.text();
  return realContext && realContext.trim() ? realContext : null;
}

/**
 * Install-honesty round-trip (plan-08 step 4): post a probe observation to the
 * worker and require an OK. If the worker is unreachable or the capture path is
 * broken, install must NOT report success — a future contract break surfaces at
 * install time instead of silently losing all opencode session data.
 */
async function verifyCaptureRoundTrip(): Promise<boolean> {
  const workerUrl = `http://${getWorkerHost()}:${getWorkerPort()}`;
  try {
    const health = await fetch(`${workerUrl}/api/readiness`);
    if (!health.ok) return false;
    const testObs = await fetch(`${workerUrl}/api/sessions/observations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentSessionId: `opencode-install-verify-${Date.now()}`,
        tool_name: 'install_verify',
        tool_input: {},
        tool_response: 'install honesty probe',
        cwd: process.cwd(),
      }),
    });
    return testObs.ok;
  } catch {
    return false;
  }
}

function writeOrRemoveCleanedAgentsMd(agentsMdPath: string, trimmedContent: string): void {
  if (
    trimmedContent.length === 0 ||
    trimmedContent === '# opencode-mem Memory Context'
  ) {
    unlinkSync(agentsMdPath);
    console.log(`  Removed empty AGENTS.md`);
  } else {
    writeFileSync(agentsMdPath, trimmedContent + '\n', 'utf-8');
    console.log(`  Cleaned context from AGENTS.md`);
  }
}

export function uninstallOpenCodePlugin(): number {
  let hasErrors = false;

  const pluginPath = getInstalledPluginPath();
  if (existsSync(pluginPath)) {
    try {
      unlinkSync(pluginPath);
      console.log(`  Removed plugin: ${pluginPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  Failed to remove plugin: ${message}`);
      hasErrors = true;
    }
  }

  if (deregisterOpenCodePluginFromConfig() !== 0) {
    hasErrors = true;
  }

  const agentsMdPath = getOpenCodeAgentsMdPath();
  if (existsSync(agentsMdPath)) {
    let content: string;
    try {
      content = readFileSync(agentsMdPath, 'utf-8');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  Failed to read AGENTS.md: ${message}`);
      hasErrors = true;
      content = '';
    }

    const tagStartIndex = content.indexOf(CONTEXT_TAG_OPEN);
    const tagEndIndex = content.indexOf(CONTEXT_TAG_CLOSE);

    if (tagStartIndex !== -1 && tagEndIndex !== -1) {
      content =
        content.slice(0, tagStartIndex).trimEnd() +
        '\n' +
        content.slice(tagEndIndex + CONTEXT_TAG_CLOSE.length).trimStart();

      const trimmedContent = content.trim();
      try {
        writeOrRemoveCleanedAgentsMd(agentsMdPath, trimmedContent);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`  Failed to clean AGENTS.md: ${message}`);
        hasErrors = true;
      }
    }
  }

  return hasErrors ? 1 : 0;
}

export function checkOpenCodeStatus(): number {
  console.log('\nopencode-mem OpenCode Integration Status\n');

  const configDirectory = getOpenCodeConfigDirectory();
  const pluginPath = getInstalledPluginPath();
  const agentsMdPath = getOpenCodeAgentsMdPath();

  console.log(`Config directory: ${configDirectory}`);
  console.log(`  Exists: ${existsSync(configDirectory) ? 'yes' : 'no'}`);
  console.log('');

  console.log(`Plugin: ${pluginPath}`);
  console.log(`  Installed: ${existsSync(pluginPath) ? 'yes' : 'no'}`);
  console.log('');

  console.log(`Context (AGENTS.md): ${agentsMdPath}`);
  if (existsSync(agentsMdPath)) {
    const content = readFileSync(agentsMdPath, 'utf-8');
    const hasContextTags = content.includes(CONTEXT_TAG_OPEN);
    console.log(`  Exists: yes`);
    console.log(`  Has opencode-mem context: ${hasContextTags ? 'yes' : 'no'}`);
  } else {
    console.log(`  Exists: no`);
  }

  console.log('');
  return 0;
}

export async function installOpenCodeIntegration(): Promise<number> {
  console.log('\nInstalling opencode-mem for OpenCode...\n');

  const pluginResult = installOpenCodePlugin();
  if (pluginResult !== 0) {
    return pluginResult;
  }

  const placeholderContext = `# Memory Context from Past Sessions

*No context yet. Complete your first session and context will appear here.*

Use opencode-mem search tools for manual memory queries.`;

  let contextToInject = placeholderContext;
  let contextSource = 'placeholder';
  try {
    const realContext = await fetchRealContextFromWorker();
    if (realContext) {
      contextToInject = realContext;
      contextSource = 'existing memory';
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.debug('WORKER', 'Worker not available during OpenCode install', {}, error);
    } else {
      logger.debug('WORKER', 'Worker not available during OpenCode install', {}, new Error(String(error)));
    }
  }

  const injectResult = injectContextIntoAgentsMd(contextToInject);
  if (injectResult !== 0) {
    logger.warn('OPENCODE', `Failed to inject ${contextSource} context into AGENTS.md during install`);
  } else {
    if (contextSource === 'existing memory') {
      console.log('  Context injected from existing memory');
    } else {
      console.log('  Placeholder context created (worker not running)');
    }
  }

  // Install honesty (plan-08 step 4): verify the capture path is live before
  // claiming success. If the worker is down or the observation POST fails,
  // return non-zero so the user knows to start the worker.
  const captureOk = await verifyCaptureRoundTrip();
  if (!captureOk) {
    console.error(
      '\nCapture path is not live: worker unreachable or observation POST failed.\n' +
      'Start the worker and re-run install:  npx opencode-mem start && npx opencode-mem install --ide opencode',
    );
    return 1;
  }
  console.log('  Capture round-trip: OK');

  console.log(`
Installation complete!

Plugin installed to: ${getInstalledPluginPath()}
Context file: ${getOpenCodeAgentsMdPath()}

Next steps:
  1. Start opencode-mem worker: npx opencode-mem start
  2. Restart OpenCode to load the plugin
  3. Memory capture is automatic from then on
`);

  return 0;
}
