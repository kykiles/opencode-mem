# OpenCode Go API Key Runtime Fallback

> **For agentic workers:** Inline execution — small scope, 2 files.

**Goal:** Make OpenCode Go API key (`~/.local/share/opencode/auth.json`) available at runtime so the worker can make LLM calls without the key being pre-written to settings.json.

**Architecture:** Add `readOpenCodeApiKey()` as fallback in `OpenRouterProvider.getOpenRouterConfig()` key resolution chain + fix non-interactive installer to write the key.

**Tech Stack:** TypeScript, Node.js, OpenCode auth.json

---
### Task 1: Runtime fallback in OpenRouterProvider

**Files:**
- Modify: `src/services/worker/OpenRouterProvider.ts` (add import + fallback in `getOpenRouterConfig()`)

- [ ] **Read current file state**

- [ ] **Add import for `readOpenCodeApiKey`**

  Add to imports:
  ```typescript
  import { readOpenCodeApiKey } from '../../npx-cli/commands/provider-presets.js';
  ```

- [ ] **Add fallback in `getOpenRouterConfig()`**

  Change the `apiKey` resolution (around line 335-340):
  
  Before:
  ```typescript
  const apiKey = settings.OPENCODE_MEM_OPENROUTER_API_KEY
    || getCredential('OPENROUTER_API_KEY')
    || '';
  ```
  
  After:
  ```typescript
  const apiKey = settings.OPENCODE_MEM_OPENROUTER_API_KEY
    || getCredential('OPENROUTER_API_KEY')
    || readOpenCodeApiKey()
    || '';
  ```

- [ ] **Verify: `tsc --noEmit` passes**

  Run: `npx tsc --noEmit` in repo root — should be clean.

---

### Task 2: Fix non-interactive installer to write API key

**Files:**
- Modify: `src/npx-cli/commands/install.ts` (in `promptProvider`, non-interactive branch)

- [ ] **Read current file state (around lines 947-966)**

- [ ] **Replace the warn-only non-interactive opencode-go branch**

  Current (lines 947-966):
  ```typescript
  if (!isInteractive) {
    if (options.provider) {
      if (options.provider === 'claude') {
        persistClaudeProvider();
        return 'claude';
      }
      const preset = buildProviderPreset(options.provider);
      const wrote = mergeSettings({
        OPENCODE_MEM_PROVIDER: preset.OPENCODE_MEM_PROVIDER,
        ...(preset.OPENCODE_MEM_OPENROUTER_BASE_URL ? {
          OPENCODE_MEM_OPENROUTER_BASE_URL: preset.OPENCODE_MEM_OPENROUTER_BASE_URL,
          OPENCODE_MEM_OPENROUTER_MODEL: preset.OPENCODE_MEM_OPENROUTER_MODEL,
        } : {}),
      });
      if (wrote) log.info(`Saved provider=${options.provider} to ~/.opencode-mem/settings.json`);
      log.warn(`Provider=${options.provider} requested non-interactively. API key prompt skipped — set ${preset.keyEnv} in settings.json or env manually if not already set.`);
      return options.provider;
    }
    return initialProvider;
  }
  ```

  After:
  ```typescript
  if (!isInteractive) {
    if (options.provider) {
      if (options.provider === 'claude') {
        persistClaudeProvider();
        return 'claude';
      }
      const preset = buildProviderPreset(options.provider);
  
      const existingKey = getSetting(preset.keyEnv as keyof SettingsDefaults) as string | undefined;
      const autoKey = (options.provider === 'opencode-go' || options.provider === 'opencode-zen')
        ? readOpenCodeApiKey()
        : null;
      const effectiveKey = existingKey || autoKey;
  
      const updates: Record<string, string> = {
        OPENCODE_MEM_PROVIDER: preset.OPENCODE_MEM_PROVIDER,
        ...(preset.OPENCODE_MEM_OPENROUTER_BASE_URL ? {
          OPENCODE_MEM_OPENROUTER_BASE_URL: preset.OPENCODE_MEM_OPENROUTER_BASE_URL,
          OPENCODE_MEM_OPENROUTER_MODEL: preset.OPENCODE_MEM_OPENROUTER_MODEL,
        } : {}),
      };
      if (effectiveKey) {
        updates[preset.keyEnv] = effectiveKey;
      }
  
      const wrote = mergeSettings(updates);
      if (wrote) log.info(`Saved provider=${options.provider} to ~/.opencode-mem/settings.json`);
      if (options.provider === 'opencode-go' || options.provider === 'opencode-zen') {
        if (effectiveKey) {
          log.info('Auto-read OpenCode subscription key from ~/.local/share/opencode/auth.json');
        } else {
          log.warn('OpenCode subscription key not found in ~/.local/share/opencode/auth.json. Set OPENCODE_MEM_OPENROUTER_API_KEY in settings.json or env manually.');
        }
      } else {
        log.warn(`Provider=${options.provider} requested non-interactively. API key prompt skipped — set ${preset.keyEnv} in settings.json or env manually if not already set.`);
      }
      return options.provider;
    }
    return initialProvider;
  }
  ```

- [ ] **Verify: `tsc --noEmit` passes**

  Run: `npx tsc --noEmit` in repo root.

- [ ] **Full test run**

  Run: `npm test` — should pass.

---

### Task 3: Verify end-to-end

- [ ] **Build and restart the worker, check it can use the OpenCode Go API key**

  ```bash
  npm run build && node scripts/sync-opencode-plugin.cjs
  ```

  Then restart opencode and confirm the worker processes observations.
