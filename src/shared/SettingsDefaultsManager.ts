
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { HOOK_TIMEOUTS, getTimeout } from './hook-constants.js';
import { parseJsonWithBom, writeJsonFileAtomic } from './atomic-json.js';

export interface SettingsDefaults {
  OPENCODE_MEM_MODEL: string;
  OPENCODE_MEM_CONTEXT_OBSERVATIONS: string;
  OPENCODE_MEM_WORKER_PORT: string;
  OPENCODE_MEM_WORKER_HOST: string;
  OPENCODE_MEM_API_TIMEOUT_MS: string;
  OPENCODE_MEM_SKIP_TOOLS: string;
  OPENCODE_MEM_PROVIDER: string;  
  OPENCODE_MEM_CLAUDE_AUTH_METHOD: string;  
  OPENCODE_MEM_GEMINI_API_KEY: string;
  OPENCODE_MEM_GEMINI_MODEL: string;  
  OPENCODE_MEM_GEMINI_RATE_LIMITING_ENABLED: string;
  OPENCODE_MEM_OPENROUTER_API_KEY: string;
  OPENCODE_MEM_OPENROUTER_MODEL: string;
  OPENCODE_MEM_OPENROUTER_BASE_URL: string;
  OPENCODE_MEM_OPENROUTER_SITE_URL: string;
  OPENCODE_MEM_OPENROUTER_APP_NAME: string;
  OPENCODE_MEM_DATA_DIR: string;
  OPENCODE_MEM_LOG_LEVEL: string;
  OPENCODE_MEM_PYTHON_VERSION: string;
  CLAUDE_CODE_PATH: string;
  OPENCODE_MEM_MODE: string;
  OPENCODE_MEM_CONTEXT_SHOW_READ_TOKENS: string;
  OPENCODE_MEM_CONTEXT_SHOW_WORK_TOKENS: string;
  OPENCODE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT: string;
  OPENCODE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT: string;
  OPENCODE_MEM_CONTEXT_FULL_COUNT: string;
  OPENCODE_MEM_CONTEXT_FULL_FIELD: string;
  OPENCODE_MEM_CONTEXT_SESSION_COUNT: string;
  OPENCODE_MEM_CONTEXT_SHOW_LAST_SUMMARY: string;
  OPENCODE_MEM_CONTEXT_SHOW_LAST_MESSAGE: string;
  OPENCODE_MEM_CONTEXT_SHOW_TERMINAL_OUTPUT: string;
  OPENCODE_MEM_WELCOME_HINT_ENABLED: string;
  OPENCODE_MEM_FOLDER_CLAUDEMD_ENABLED: string;
  OPENCODE_MEM_FOLDER_USE_LOCAL_MD: string;  
  OPENCODE_MEM_TRANSCRIPTS_ENABLED: string;  
  OPENCODE_MEM_TRANSCRIPTS_CONFIG_PATH: string;  
  OPENCODE_MEM_CODEX_TRANSCRIPT_INGESTION: string;
  OPENCODE_MEM_MAX_CONCURRENT_AGENTS: string;  
  OPENCODE_MEM_HOOK_FAIL_LOUD_THRESHOLD: string;  
  OPENCODE_MEM_EXCLUDED_PROJECTS: string;  
  OPENCODE_MEM_FOLDER_MD_EXCLUDE: string;
  OPENCODE_MEM_FOLDER_MD_SKELETON_DENYLIST: string;
  OPENCODE_MEM_SEMANTIC_INJECT: string;        
  OPENCODE_MEM_SEMANTIC_INJECT_LIMIT: string;  
  OPENCODE_MEM_TIER_ROUTING_ENABLED: string;
  OPENCODE_MEM_TIER_SIMPLE_MODEL: string;
  OPENCODE_MEM_TIER_SUMMARY_MODEL: string;
  OPENCODE_MEM_TIER_FAST_MODEL: string;        // #2289 — resolved by $TIER:fast in OPENCODE_MEM_MODEL
  OPENCODE_MEM_TIER_SMART_MODEL: string;       // #2289 — resolved by $TIER:smart in OPENCODE_MEM_MODEL
  OPENCODE_MEM_CHROMA_ENABLED: string;   
  OPENCODE_MEM_CHROMA_MODE: string;      
  OPENCODE_MEM_CHROMA_HOST: string;
  OPENCODE_MEM_CHROMA_PORT: string;
  OPENCODE_MEM_CHROMA_SSL: string;
  OPENCODE_MEM_CHROMA_API_KEY: string;
  OPENCODE_MEM_CHROMA_TENANT: string;
  OPENCODE_MEM_CHROMA_DATABASE: string;
  OPENCODE_MEM_CHROMA_PREWARM_TIMEOUT_MS: string;
  OPENCODE_MEM_TELEGRAM_ENABLED: string;
  OPENCODE_MEM_TELEGRAM_BOT_TOKEN: string;
  OPENCODE_MEM_TELEGRAM_CHAT_ID: string;
  OPENCODE_MEM_TELEGRAM_TRIGGER_TYPES: string;
  OPENCODE_MEM_TELEGRAM_TRIGGER_CONCEPTS: string;
  OPENCODE_MEM_QUEUE_ENGINE: string;
  OPENCODE_MEM_REDIS_URL: string;
  OPENCODE_MEM_REDIS_HOST: string;
  OPENCODE_MEM_REDIS_PORT: string;
  OPENCODE_MEM_REDIS_MODE: string;
  OPENCODE_MEM_QUEUE_REDIS_PREFIX: string;
  OPENCODE_MEM_AUTH_MODE: string;
  OPENCODE_MEM_RUNTIME: string;
  // Phase 1a (cmem-sdk rename): canonical server settings keys. Hooks read
  // these first and fall back to the legacy `*_BETA_*` keys below.
  OPENCODE_MEM_SERVER_URL: string;
  OPENCODE_MEM_SERVER_API_KEY: string;
  OPENCODE_MEM_SERVER_PROJECT_ID: string;
  // Legacy keys retained for back-compat with existing settings.json files.
  OPENCODE_MEM_SERVER_BETA_URL: string;
  OPENCODE_MEM_SERVER_BETA_API_KEY: string;
  OPENCODE_MEM_SERVER_BETA_PROJECT_ID: string;
}

export class SettingsDefaultsManager {
  private static readonly DEFAULTS: SettingsDefaults = {
    OPENCODE_MEM_MODEL: 'claude-haiku-4-5-20251001',
    OPENCODE_MEM_CONTEXT_OBSERVATIONS: '50',
    OPENCODE_MEM_WORKER_PORT: String(37700 + ((process.getuid?.() ?? 77) % 100)),
    OPENCODE_MEM_WORKER_HOST: '127.0.0.1',
    OPENCODE_MEM_API_TIMEOUT_MS: String(getTimeout(HOOK_TIMEOUTS.API_REQUEST)),
    OPENCODE_MEM_SKIP_TOOLS: 'ListMcpResourcesTool,SlashCommand,Skill,TodoWrite,AskUserQuestion',
    OPENCODE_MEM_PROVIDER: 'openrouter',  // Default to OpenCode Zen (free, uses deepseek-v4-flash-free via the Zen catalog)
    OPENCODE_MEM_CLAUDE_AUTH_METHOD: 'subscription',  // Default to logged-in Claude SDK auth (not API key)
    OPENCODE_MEM_GEMINI_API_KEY: '',  // Empty by default, can be set via UI or env
    OPENCODE_MEM_GEMINI_MODEL: 'gemini-2.5-flash-lite',  // Default Gemini model (highest free tier RPM)
    OPENCODE_MEM_GEMINI_RATE_LIMITING_ENABLED: 'true',  // Rate limiting ON by default for free tier users
    OPENCODE_MEM_OPENROUTER_API_KEY: '',  // Empty by default, can be set via UI or env
    OPENCODE_MEM_OPENROUTER_MODEL: 'deepseek-v4-flash-free',  // Default: OpenCode Zen (deepseek-v4-flash-free)
    OPENCODE_MEM_OPENROUTER_BASE_URL: 'https://opencode.ai/zen/v1',  // OpenCode Zen OpenAI-compatible endpoint (deepseek-v4-flash-free); empty = default OpenRouter endpoint.
    OPENCODE_MEM_OPENROUTER_SITE_URL: '',  // Optional: for OpenRouter analytics
    OPENCODE_MEM_OPENROUTER_APP_NAME: 'opencode-mem',  // App name for OpenRouter analytics
    OPENCODE_MEM_DATA_DIR: join(homedir(), '.opencode-mem'),
    OPENCODE_MEM_LOG_LEVEL: 'INFO',
    OPENCODE_MEM_PYTHON_VERSION: '3.13',
    CLAUDE_CODE_PATH: '', // Empty means auto-detect via 'which claude'
    OPENCODE_MEM_MODE: 'code', // Default mode profile
    OPENCODE_MEM_CONTEXT_SHOW_READ_TOKENS: 'false',
    OPENCODE_MEM_CONTEXT_SHOW_WORK_TOKENS: 'false',
    OPENCODE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT: 'false',
    OPENCODE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT: 'true',
    OPENCODE_MEM_CONTEXT_FULL_COUNT: '0',
    OPENCODE_MEM_CONTEXT_FULL_FIELD: 'narrative',
    OPENCODE_MEM_CONTEXT_SESSION_COUNT: '10',
    OPENCODE_MEM_CONTEXT_SHOW_LAST_SUMMARY: 'true',
    OPENCODE_MEM_CONTEXT_SHOW_LAST_MESSAGE: 'false',
    OPENCODE_MEM_CONTEXT_SHOW_TERMINAL_OUTPUT: 'true',
    OPENCODE_MEM_WELCOME_HINT_ENABLED: 'true',
    OPENCODE_MEM_FOLDER_CLAUDEMD_ENABLED: 'false',
    OPENCODE_MEM_FOLDER_USE_LOCAL_MD: 'false',  // When true, writes to CLAUDE.local.md instead of CLAUDE.md
    OPENCODE_MEM_TRANSCRIPTS_ENABLED: 'true',
    OPENCODE_MEM_TRANSCRIPTS_CONFIG_PATH: join(homedir(), '.opencode-mem', 'transcript-watch.json'),
    OPENCODE_MEM_CODEX_TRANSCRIPT_INGESTION: 'false',
    OPENCODE_MEM_MAX_CONCURRENT_AGENTS: '2',  // Max concurrent Claude SDK agent subprocesses
    OPENCODE_MEM_HOOK_FAIL_LOUD_THRESHOLD: '3',  // Plan 05 Phase 8 — escalate to exit code 2 after N consecutive worker-unreachable hook invocations
    OPENCODE_MEM_EXCLUDED_PROJECTS: '',  // Comma-separated glob patterns for excluded project paths
    OPENCODE_MEM_FOLDER_MD_EXCLUDE: '[]',  // JSON array of folder paths to exclude from CLAUDE.md generation
    OPENCODE_MEM_FOLDER_MD_SKELETON_DENYLIST: '[]',  // #2400 — JSON array of glob patterns; when a folder matches AND its generated CLAUDE.md would be empty/skeleton, skip injection (avoids polluting non-content dirs with empty skeletons). Default [] preserves existing behavior.
    OPENCODE_MEM_SEMANTIC_INJECT: 'false',             // Inject relevant past observations on every UserPromptSubmit (experimental, disabled by default)
    OPENCODE_MEM_SEMANTIC_INJECT_LIMIT: '5',           // Top-N most relevant observations to inject per prompt
    OPENCODE_MEM_TIER_ROUTING_ENABLED: 'true',         // Route observations to models by complexity
    OPENCODE_MEM_TIER_SIMPLE_MODEL: 'haiku', // Portable tier alias — works across Direct API, Bedrock, Vertex, Azure (see #1463)
    OPENCODE_MEM_TIER_SUMMARY_MODEL: '',                // Empty = use default model for summaries
    OPENCODE_MEM_TIER_FAST_MODEL: 'haiku',              // #2289 — $TIER:fast resolves here (portable alias)
    OPENCODE_MEM_TIER_SMART_MODEL: 'sonnet',            // #2289 — $TIER:smart resolves here (portable alias)
    OPENCODE_MEM_CHROMA_ENABLED: 'true',         // Set to 'false' to disable Chroma and use SQLite-only search
    OPENCODE_MEM_CHROMA_MODE: 'local',           // 'local' uses persistent chroma-mcp via uvx, 'remote' connects to existing server
    OPENCODE_MEM_CHROMA_HOST: '127.0.0.1',
    OPENCODE_MEM_CHROMA_PORT: '8000',
    OPENCODE_MEM_CHROMA_SSL: 'false',
    OPENCODE_MEM_CHROMA_API_KEY: '',
    OPENCODE_MEM_CHROMA_TENANT: 'default_tenant',
    OPENCODE_MEM_CHROMA_DATABASE: 'default_database',
    OPENCODE_MEM_CHROMA_PREWARM_TIMEOUT_MS: '120000',
    OPENCODE_MEM_TELEGRAM_ENABLED: 'true',
    OPENCODE_MEM_TELEGRAM_BOT_TOKEN: '',
    OPENCODE_MEM_TELEGRAM_CHAT_ID: '',
    OPENCODE_MEM_TELEGRAM_TRIGGER_TYPES: 'security_alert',
    OPENCODE_MEM_TELEGRAM_TRIGGER_CONCEPTS: '',
    OPENCODE_MEM_QUEUE_ENGINE: 'sqlite',
    OPENCODE_MEM_REDIS_URL: '',
    OPENCODE_MEM_REDIS_HOST: '127.0.0.1',
    OPENCODE_MEM_REDIS_PORT: '6379',
    OPENCODE_MEM_REDIS_MODE: 'external',
    OPENCODE_MEM_QUEUE_REDIS_PREFIX: `opencode_mem_${process.env.OPENCODE_MEM_WORKER_PORT ?? String(37700 + ((process.getuid?.() ?? 77) % 100))}`,
    OPENCODE_MEM_AUTH_MODE: 'api-key',
    OPENCODE_MEM_RUNTIME: 'worker',
    // Phase 1a (cmem-sdk rename): canonical server settings keys. Hooks read
    // these first; the legacy `*_BETA_*` defaults below remain so existing
    // settings.json files still resolve correctly.
    OPENCODE_MEM_SERVER_URL: `http://127.0.0.1:${process.env.OPENCODE_MEM_SERVER_PORT ?? String(37877 + ((process.getuid?.() ?? 77) % 100))}`,  // Default server runtime URL — UID-derived for multi-account isolation
    OPENCODE_MEM_SERVER_API_KEY: '',                          // Local hook API key, populated by installer when runtime=server
    OPENCODE_MEM_SERVER_PROJECT_ID: '',                       // Default Postgres project_id used by hooks when runtime=server
    OPENCODE_MEM_SERVER_BETA_URL: `http://127.0.0.1:${process.env.OPENCODE_MEM_SERVER_PORT ?? String(37877 + ((process.getuid?.() ?? 77) % 100))}`,  // Legacy server-beta runtime URL — UID-derived for multi-account isolation
    OPENCODE_MEM_SERVER_BETA_API_KEY: '',                     // Legacy local hook API key (read as fallback when OPENCODE_MEM_SERVER_API_KEY unset)
    OPENCODE_MEM_SERVER_BETA_PROJECT_ID: '',                  // Legacy Postgres project_id (read as fallback when OPENCODE_MEM_SERVER_PROJECT_ID unset)
  };

  static getAllDefaults(): SettingsDefaults {
    return { ...this.DEFAULTS };
  }

  static get(key: keyof SettingsDefaults): string {
    return process.env[key] ?? this.DEFAULTS[key];
  }

  static getInt(key: keyof SettingsDefaults): number {
    const value = this.get(key);
    return parseInt(value, 10);
  }

  private static applyEnvOverrides(settings: SettingsDefaults): SettingsDefaults {
    const result = { ...settings };
    for (const key of Object.keys(this.DEFAULTS) as Array<keyof SettingsDefaults>) {
      if (process.env[key] !== undefined) {
        result[key] = process.env[key]!;
      }
    }
    return result;
  }

  static loadFromFile(settingsPath: string, applyEnvOverrides = true): SettingsDefaults {
    try {
      if (!existsSync(settingsPath)) {
        const defaults = this.getAllDefaults();
        try {
          writeJsonFileAtomic(settingsPath, defaults);
          // stderr, never stdout: this fires on the first boot in a fresh data
          // dir, and CLI commands like `start` promise machine-readable JSON
          // on stdout to the hook framework.
          console.warn('[SETTINGS] Created settings file with defaults:', settingsPath);
        } catch (error: unknown) {
          console.warn('[SETTINGS] Failed to create settings file, using in-memory defaults:', settingsPath, error instanceof Error ? error.message : String(error));
        }
        return applyEnvOverrides ? this.applyEnvOverrides(defaults) : defaults;
      }

      const settingsData = readFileSync(settingsPath, 'utf-8');
      const settings = parseJsonWithBom<Record<string, any>>(settingsData);

      let flatSettings = settings;
      if (settings.env && typeof settings.env === 'object') {
        flatSettings = settings.env;

        try {
          writeJsonFileAtomic(settingsPath, flatSettings);
          // stderr, never stdout — same JSON-on-stdout contract as above.
          console.warn('[SETTINGS] Migrated settings file from nested to flat schema:', settingsPath);
        } catch (error: unknown) {
          console.warn('[SETTINGS] Failed to auto-migrate settings file:', settingsPath, error instanceof Error ? error.message : String(error));
          // Continue with in-memory migration even if write fails
        }
      }

      const result: SettingsDefaults = { ...this.DEFAULTS };
      for (const key of Object.keys(this.DEFAULTS) as Array<keyof SettingsDefaults>) {
        if (flatSettings[key] !== undefined) {
          result[key] = flatSettings[key];
        }
      }

      return applyEnvOverrides ? this.applyEnvOverrides(result) : result;
    } catch (error: unknown) {
      console.warn('[SETTINGS] Failed to load settings, using defaults:', settingsPath, error instanceof Error ? error.message : String(error));
      const defaults = this.getAllDefaults();
      return applyEnvOverrides ? this.applyEnvOverrides(defaults) : defaults;
    }
  }
}
