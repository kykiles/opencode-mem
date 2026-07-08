# opencode-mem Fork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the clean `claude-mem` v13.10.2 clone into `opencode-mem` — an opencode-native fork (Identity level) with reproducible build, working opencode capture, and Qwen `qwen-plus` (DashScope) as the default free model that works in RU without VPN.

**Architecture:** Keep the engine (worker, SQLite+FTS5, Chroma, summarization pipeline, provider abstraction). Rebrand identity (name/paths/tags/env), move data to `~/.opencode-mem`, rename env prefix `CLAUDE_MEM_`→`OPENCODE_MEM_`, prune to opencode-only IDE integrations, add Qwen/DeepSeek presets on the existing `openrouter` provider, and fix capture by ensuring the worker runs + install-honesty round-trip.

**Tech Stack:** TypeScript, Bun (runtime + test), esbuild (bundler), SQLite (FTS5), Chroma (vectors), zod, @modelcontextprotocol/sdk. Node ≥20.12. opencode 1.17.15 plugin API.

## Global Constraints

- Base: `thedotmack/claude-mem` v13.10.2, commit `312d640b0` (currently in `claude-mem-upstream/`).
- Data dir default: `~/.opencode-mem` (fresh start; do NOT migrate `~/.claude-mem`).
- Env prefix: `OPENCODE_MEM_*` (full rename of all 687 `CLAUDE_MEM_` occurrences / 80 files in `src/`).
- Plugin file: `~/.config/opencode/plugins/opencode-mem.js` (built from `dist/opencode-plugin/index.js`).
- Context tags: `<opencode-mem-context>` / `</opencode-mem-context>`.
- Plugin export: `OpenCodeMemPlugin` (default). MCP tool: `opencode_mem_search`.
- Default provider: `openrouter` preset → Qwen `qwen-plus` @ `https://dashscope.aliyuncs.com/compatible-mode/v1` (key: DashScope API key, stored as `OPENCODE_MEM_OPENROUTER_API_KEY`).
- Provider validation set stays `{claude, gemini, openrouter}` — no new provider ids.
- IDE: opencode-only (remove Cursor/Codex/Windsurf/OpenClaw/Antigravity/claude-code plugin registration).
- MCP server artifacts dropped (opencode uses native `tool:` registration, not MCP).
- Attribution to upstream preserved in LICENSE/NOTICE and a one-line "forked from thedotmack/claude-mem" reference; no functional `claude-mem` branding remains.
- Every task ends with green `tsc --noEmit` + `bun test` unless the task itself changes tests.

---

## File Structure (decomposition)

**Root layout after Фаза 0:** contents of `claude-mem-upstream/` moved to repo root; `claude-mem-upstream/` removed; `.git` from upstream becomes the repo's `.git`; `origin`→`upstream` remote; branch `opencode-mem/main`.

**Files created:**
- `docs/superpowers/plans/2026-07-08-opencode-mem-fork.md` (this plan)
- `scripts/sync-opencode-plugin.cjs` — copies `dist/opencode-plugin/index.js` → `~/.config/opencode/plugins/opencode-mem.js`

**Files heavily modified (rebrand):**
- `package.json` — name/bin/keywords/repository/description
- `src/shared/SettingsDefaultsManager.ts` — env keys + defaults (Qwen)
- `src/utils/context-injection.ts` — tags
- `src/services/integrations/OpenCodeInstaller.ts` — plugin path, header, branding
- `src/integrations/opencode-plugin/index.ts` — export name, tool name, log prefix
- `src/npx-cli/commands/install.ts` — `promptProvider` (Qwen/DeepSeek presets, opencode-only `--ide`)
- `src/npx-cli/commands/ide-detection.ts` — opencode-only
- `src/services/worker/http/routes/SettingsRoutes.ts` — validation strings (after rename)
- `src/shared/openrouter-base-url.ts` — doc comments
- `scripts/build-hooks.js` — remove non-opencode build targets + `claude-mem` assertions (lines 665-720)
- All `src/**/*.ts` with `CLAUDE_MEM_`/`.claude-mem`/`claude-mem` references (80+ files)
- `README.md`, `CLAUDE.md`→ dev docs, `LICENSE`/`NOTICE` attribution

**Files deleted (Фаза 2):**
- `src/services/integrations/{CursorHooksInstaller,CodexCliInstaller,WindsurfHooksInstaller,OpenClawInstaller,AntigravityCliHooksInstaller}.ts`
- `src/integrations/openclaw/` (if present), `cursor-hooks/`, `.codex-plugin/`, `.claude-plugin/`, `.windsurf/`, `.agents/` (claude-code marketplace), `openclaw/`
- `plugin/.mcp.json`, MCP server build target in `build-hooks.js`
- Related test directories under `tests/`

---

## Task 1: Фаза 0 — Подготовка репо

**Files:**
- Modify: repo root structure (move `claude-mem-upstream/*` → root)
- Create: branch `opencode-mem/main`

**Interfaces:** Produces a git repo at root with `upstream` remote; all later tasks operate at root.

- [ ] **Step 1: Verify current state is clean**
Run: `cd /home/kykiles/projects/opencode-mem/claude-mem-upstream && git status --porcelain && git log --oneline -1`
Expected: empty porcelain output; HEAD `312d640b0 Merge pull request #3157...`

- [ ] **Step 2: Lift upstream contents to repo root**
Move all files (including `.git`) from `claude-mem-upstream/` up one level. Preserve the root `AGENTS.md` (guidelines) by first backing it up, then letting upstream's `CLAUDE.md` coexist (it gets rebranded later).
```bash
cd /home/kykiles/projects/opencode-mem
cp AGENTS.md /tmp/opencode-mem-root-AGENTS.md
shopt -s dotglob
mv claude-mem-upstream/* .
shopt -u dotglob
rmdir claude-mem-upstream
cp /tmp/opencode-mem-root-AGENTS.md AGENTS.md
```

- [ ] **Step 3: Rename remote origin → upstream, create fork branch**
```bash
cd /home/kykiles/projects/opencode-mem
git remote rename origin upstream
git checkout -b opencode-mem/main
```

- [ ] **Step 4: Verify structure**
Run: `git remote -v` → `upstream https://github.com/thedotmack/claude-mem.git`; `git branch --show-current` → `opencode-mem/main`; `ls` shows `src/ package.json README.md AGENTS.md CLAUDE.md ...`; `git status` clean.

- [ ] **Step 5: Commit the restructure**
```bash
git add -A
git commit -m "chore: lift claude-mem v13.10.2 to repo root as fork base (upstream remote)"
```

---

## Task 2: Фаза 1a — Scripted env + data-dir + branding rename

**Files:**
- Modify: all `src/**/*.ts` (80 files), `scripts/**/*.js`/`*.cjs`, `tests/**/*.ts`, `package.json`, `README.md`, `CLAUDE.md`

**Interfaces:** Produces `OPENCODE_MEM_*` env keys, `~/.opencode-mem` data dir, `opencode-mem`/`opencode_mem` branding. Later tasks build on these names.

- [ ] **Step 1: Write a rename guard test (failing)**
Create `tests/rebrand-guard.test.ts`:
```ts
import { describe, it, expect } from "bun:test";
import { glob } from "bun";
import { readFileSync } from "fs";

const SRC = await Array.fromAsync(glob("src/**/*.ts"));

describe("rebrand guard", () => {
  it("no CLAUDE_MEM_ env prefix remains in src", () => {
    const hits: string[] = [];
    for (const f of SRC) {
      const c = readFileSync(f, "utf-8");
      if (/\bCLAUDE_MEM_[A-Z]/.test(c)) hits.push(f);
    }
    expect(hits, `files still using CLAUDE_MEM_: ${hits.join(", ")}`).toEqual([]);
  });

  it("no .claude-mem data dir remains in src", () => {
    const hits = SRC.filter(f => readFileSync(f, "utf-8").includes(".claude-mem"));
    expect(hits).toEqual([]);
  });

  it("no functional claude-mem/claude_mem branding in src", () => {
    const hits: string[] = [];
    for (const f of SRC) {
      const c = readFileSync(f, "utf-8");
      const stripped = c.replace(/thedotmack\/claude-mem/g, "");
      if (/claude[-_]mem/i.test(stripped)) hits.push(f);
    }
    expect(hits).toEqual([]);
  });
});
```

- [ ] **Step 2: Run guard to verify it fails**
Run: `bun test tests/rebrand-guard.test.ts`
Expected: FAIL (many files listed).

- [ ] **Step 3: Run scripted rename (mechanical)**
```bash
rg -l 'CLAUDE_MEM_' src scripts tests *.json *.toml 2>/dev/null | while read f; do
  sed -i 's/CLAUDE_MEM_/OPENCODE_MEM_/g' "$f"
done
rg -l '\.claude-mem' src scripts tests *.json 2>/dev/null | while read f; do
  sed -i 's/\.claude-mem/.opencode-mem/g' "$f"
done
rg -li 'claude[-_]mem' src scripts tests README.md CLAUDE.md package.json 2>/dev/null | while read f; do
  sed -i 's/claude-mem/opencode-mem/g; s/claude_mem/opencode_mem/g; s/Claude-Mem/opencode-mem/g; s/CLAUDE-MEM/OPENCODE-MEM/g' "$f"
done
sed -i 's#thedotmack/opencode-mem#thedotmack/claude-mem#g' README.md LICENSE NOTICE 2>/dev/null || true
```

- [ ] **Step 4: Fix type errors from rename**
Run: `npx tsc --noEmit 2>&1 | head -40`
`CLAUDE_CODE_PATH` and `ANTHROPIC_*` env (for claude provider) are intentionally NOT renamed — do not touch them. Fix any other errors from the rename; re-run until clean.

- [ ] **Step 5: Run guard + full typecheck**
Run: `bun test tests/rebrand-guard.test.ts` → PASS; `npx tsc --noEmit` → exit 0.

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "refactor: rebrand to opencode-mem (env OPENCODE_MEM_*, data ~/.opencode-mem, branding)"
```

---

## Task 3: Фаза 1b — Targeted identity fixes (tags, plugin export, tool name, package.json)

**Files:**
- Modify: `src/utils/context-injection.ts`, `src/integrations/opencode-plugin/index.ts`, `src/services/integrations/OpenCodeInstaller.ts`, `package.json`

**Interfaces:** `CONTEXT_TAG_OPEN='<opencode-mem-context>'`; `OpenCodeMemPlugin` default export; tool `opencode_mem_search`; `package.json` name `opencode-mem`, bin `opencode-mem`.

- [ ] **Step 1: Add specific guard assertions**
Append to `tests/rebrand-guard.test.ts`:
```ts
import { CONTEXT_TAG_OPEN, CONTEXT_TAG_CLOSE } from "../src/utils/context-injection";

describe("rebrand identity specifics", () => {
  it("context tags are opencode-mem", () => {
    expect(CONTEXT_TAG_OPEN).toBe("<opencode-mem-context>");
    expect(CONTEXT_TAG_CLOSE).toBe("</opencode-mem-context>");
  });
});
```

- [ ] **Step 2: Fix context-injection tags**
`src/utils/context-injection.ts:6-7` — confirm:
```ts
export const CONTEXT_TAG_OPEN = '<opencode-mem-context>';
export const CONTEXT_TAG_CLOSE = '</opencode-mem-context>';
```

- [ ] **Step 3: Fix plugin export + tool name**
`src/integrations/opencode-plugin/index.ts`:
- Rename `ClaudeMemPlugin` → `OpenCodeMemPlugin` (export + default).
- Rename tool key `claude_mem_search` → `opencode_mem_search`.
- Log prefix `[claude-mem]` → `[opencode-mem]` (verify).
- Update `tests/integrations/opencode-plugin-contract.test.ts` import: `ClaudeMemPlugin` → `OpenCodeMemPlugin`.

- [ ] **Step 4: Fix OpenCodeInstaller paths**
`src/services/integrations/OpenCodeInstaller.ts`:
- `OPENCODE_PLUGIN_CONFIG_PATH` const → `'./plugins/opencode-mem.js'`
- `getInstalledPluginPath()` → filename `opencode-mem.js`
- Header in `injectContextIntoAgentsMd` → `'# opencode-mem Memory Context'`
- Placeholder text → `opencode-mem search tools` (verify).

- [ ] **Step 5: Fix package.json**
```bash
node -e '
const fs=require("fs"); const p=JSON.parse(fs.readFileSync("package.json","utf8"));
p.name="opencode-mem";
p.bin={"opencode-mem":"./dist/npx-cli/index.js"};
p.description="Memory compression system for OpenCode - persist context across sessions";
p.keywords=p.keywords.map(k=>k.replace("claude","opencode"));
p.repository.url="https://github.com/kykiles/opencode-mem.git";
p.homepage="https://github.com/kykiles/opencode-mem#readme";
p.bugs.url="https://github.com/kykiles/opencode-mem/issues";
fs.writeFileSync("package.json", JSON.stringify(p,null,2)+"\n");
'
```

- [ ] **Step 6: Run typecheck + tests**
Run: `npx tsc --noEmit && bun test`
Expected: PASS (contract test updated).

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "refactor: identity (tags, OpenCodeMemPlugin export, opencode_mem_search tool, package.json)"
```

---

## Task 4: Фаза 2 — opencode-only (prune IDE integrations + build cleanup, drop MCP)

**Files:**
- Delete: `src/services/integrations/{CursorHooksInstaller,CodexCliInstaller,WindsurfHooksInstaller,OpenClawInstaller,AntigravityCliHooksInstaller}.ts`, `src/integrations/openclaw/` (if any), `cursor-hooks/`, `.codex-plugin/`, `.claude-plugin/`, `.windsurf/`, `.agents/`, `openclaw/`, `plugin/.mcp.json`
- Modify: `src/npx-cli/commands/install.ts`, `src/npx-cli/commands/ide-detection.ts`, `scripts/build-hooks.js`

**Interfaces:** `npx opencode-mem install` supports only `--ide opencode`; build produces only worker + npx-cli + opencode-plugin (no MCP server, no codex/claude-code/openclaw/cursor/windsurf targets).

- [ ] **Step 1: Write a failing guard**
Append to `tests/rebrand-guard.test.ts`:
```ts
import { existsSync } from "fs";

describe("opencode-only", () => {
  it("no foreign IDE installers", () => {
    const foreign = ["CursorHooksInstaller","CodexCliInstaller","WindsurfHooksInstaller","OpenClawInstaller","AntigravityCliHooksInstaller"];
    for (const name of foreign) {
      expect(existsSync(`src/services/integrations/${name}.ts`)).toBe(false);
    }
  });
  it("no MCP server artifacts (opencode uses native tool)", () => {
    expect(existsSync("plugin/.mcp.json")).toBe(false);
  });
});
```
Run → FAIL.

- [ ] **Step 2: Delete foreign IDE files + dirs + MCP artifacts**
```bash
rm -f src/services/integrations/{CursorHooksInstaller,CodexCliInstaller,WindsurfHooksInstaller,OpenClawInstaller,AntigravityCliHooksInstaller}.ts
rm -rf cursor-hooks .codex-plugin .claude-plugin .windsurf .agents openclaw src/integrations/openclaw 2>/dev/null
rm -f plugin/.mcp.json
```
Remove related test dirs after checking `ls tests/`.

- [ ] **Step 3: Prune install.ts IDE cases**
`src/npx-cli/commands/install.ts`: remove `case 'cursor'`, `case 'windsurf'`, `case 'openclaw'`, `case 'codex-cli'`, `case 'antigravity'`, and the claude-code plugin registration case. Keep `case 'opencode'`. Replace switch default with: `throw new Error("opencode-mem supports only --ide opencode")`. Remove now-unused imports.

- [ ] **Step 4: Prune ide-detection.ts**
`src/npx-cli/commands/ide-detection.ts`: keep only the opencode detector; remove cursor/codex/windsurf/openclaw/antigravity/claude-code detection.

- [ ] **Step 5: Clean build-hooks.js**
`scripts/build-hooks.js`:
- Remove the openclaw build block (~lines 600-628) and `openclawOutDir`.
- Remove the MCP server build target (`mcp-server.cjs`) and its output log line.
- In distribution-file verification (~lines 665-720): remove the `claude-mem` marketplace name assertion, codex hooks validation, MCP cache path assertions (`plugins/cache/claude-mem`, `thedotmack/claude-mem`). Remove `requiredDistributionFiles` entries for codex/claude-code/openclaw/MCP: `plugin/hooks/codex-hooks.json`, `.codex-plugin/plugin.json`, `.agents/plugins/marketplace.json`, `plugin/.claude-plugin/plugin.json`, `plugin/.mcp.json`. Keep the opencode-plugin build block (630-653) + its output log (737-740).
- Remove the codex market/claude cache assertions (707-719).

- [ ] **Step 6: Run typecheck + build + tests**
Run: `npx tsc --noEmit && npm run build && bun test`
Expected: build succeeds; `dist/opencode-plugin/index.js` produced; tests green.

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "refactor: opencode-only (remove cursor/codex/windsurf/openclaw/antigravity + MCP + build cleanup)"
```

---

## Task 5: Фаза 3a — Qwen preset as default in SettingsDefaultsManager

**Files:**
- Modify: `src/shared/SettingsDefaultsManager.ts`

**Interfaces:** Defaults: `OPENCODE_MEM_PROVIDER='openrouter'`, `OPENCODE_MEM_OPENROUTER_BASE_URL='https://dashscope.aliyuncs.com/compatible-mode/v1'`, `OPENCODE_MEM_OPENROUTER_MODEL='qwen-plus'`, `OPENCODE_MEM_OPENROUTER_APP_NAME='opencode-mem'`.

- [ ] **Step 1: Write a failing test**
`tests/settings-defaults.test.ts`:
```ts
import { describe, it, expect } from "bun:test";
import { SettingsDefaultsManager } from "../src/shared/SettingsDefaultsManager";

describe("Qwen default preset", () => {
  it("defaults provider to openrouter with Qwen DashScope", () => {
    expect(SettingsDefaultsManager.get("OPENCODE_MEM_PROVIDER")).toBe("openrouter");
    expect(SettingsDefaultsManager.get("OPENCODE_MEM_OPENROUTER_BASE_URL"))
      .toBe("https://dashscope.aliyuncs.com/compatible-mode/v1");
    expect(SettingsDefaultsManager.get("OPENCODE_MEM_OPENROUTER_MODEL")).toBe("qwen-plus");
  });
});
```
Run → FAIL.

- [ ] **Step 2: Update defaults**
`src/shared/SettingsDefaultsManager.ts` (the renamed keys post-Task 2):
```ts
    OPENCODE_MEM_PROVIDER: 'openrouter',
    OPENCODE_MEM_OPENROUTER_MODEL: 'qwen-plus',
    OPENCODE_MEM_OPENROUTER_BASE_URL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    OPENCODE_MEM_OPENROUTER_APP_NAME: 'opencode-mem',
```
Keep `OPENCODE_MEM_CLAUDE_AUTH_METHOD: 'subscription'` and `OPENCODE_MEM_MODEL` (claude preset still selectable).

- [ ] **Step 3: Run test**
Run: `bun test tests/settings-defaults.test.ts` → PASS.

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "feat: default to Qwen qwen-plus (DashScope) preset for free RU-no-VPN usage"
```

---

## Task 6: Фаза 3b — Qwen/DeepSeek presets in installer promptProvider

**Files:**
- Modify: `src/npx-cli/commands/install.ts` (`promptProvider`)
- Create: `src/npx-cli/commands/provider-presets.ts`

**Interfaces:** `buildProviderPreset(id)` → preset object; interactive menu shows Qwen (default) / DeepSeek / OpenRouter / Gemini / Claude; selecting Qwen/DeepSeek writes preset settings + prompts for the API key stored as `OPENCODE_MEM_OPENROUTER_API_KEY`.

- [ ] **Step 1: Write a failing test**
`tests/installer-presets.test.ts`:
```ts
import { describe, it, expect } from "bun:test";
import { buildProviderPreset } from "../src/npx-cli/commands/provider-presets";

describe("installer provider presets", () => {
  it("Qwen preset maps to openrouter + DashScope + qwen-plus", () => {
    const preset = buildProviderPreset("qwen");
    expect(preset).toEqual({
      OPENCODE_MEM_PROVIDER: "openrouter",
      OPENCODE_MEM_OPENROUTER_BASE_URL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      OPENCODE_MEM_OPENROUTER_MODEL: "qwen-plus",
      label: "Qwen qwen-plus (DashScope)",
      keyEnv: "OPENCODE_MEM_OPENROUTER_API_KEY",
    });
  });

  it("DeepSeek preset maps to openrouter + deepseek-chat", () => {
    const preset = buildProviderPreset("deepseek");
    expect(preset.OPENCODE_MEM_OPENROUTER_BASE_URL).toBe("https://api.deepseek.com");
    expect(preset.OPENCODE_MEM_OPENROUTER_MODEL).toBe("deepseek-chat");
  });
});
```
Run → FAIL.

- [ ] **Step 2: Create provider-presets.ts**
`src/npx-cli/commands/provider-presets.ts`:
```ts
export type ProviderPresetId = "qwen" | "deepseek" | "openrouter" | "gemini" | "claude";

export interface ProviderPreset {
  OPENCODE_MEM_PROVIDER: string;
  OPENCODE_MEM_OPENROUTER_BASE_URL?: string;
  OPENCODE_MEM_OPENROUTER_MODEL?: string;
  label: string;
  keyEnv: string;
}

export function buildProviderPreset(id: ProviderPresetId): ProviderPreset {
  switch (id) {
    case "qwen":
      return {
        OPENCODE_MEM_PROVIDER: "openrouter",
        OPENCODE_MEM_OPENROUTER_BASE_URL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        OPENCODE_MEM_OPENROUTER_MODEL: "qwen-plus",
        label: "Qwen qwen-plus (DashScope)",
        keyEnv: "OPENCODE_MEM_OPENROUTER_API_KEY",
      };
    case "deepseek":
      return {
        OPENCODE_MEM_PROVIDER: "openrouter",
        OPENCODE_MEM_OPENROUTER_BASE_URL: "https://api.deepseek.com",
        OPENCODE_MEM_OPENROUTER_MODEL: "deepseek-chat",
        label: "DeepSeek deepseek-chat",
        keyEnv: "OPENCODE_MEM_OPENROUTER_API_KEY",
      };
    case "openrouter":
      return { OPENCODE_MEM_PROVIDER: "openrouter", label: "OpenRouter", keyEnv: "OPENCODE_MEM_OPENROUTER_API_KEY" };
    case "gemini":
      return { OPENCODE_MEM_PROVIDER: "gemini", label: "Gemini", keyEnv: "OPENCODE_MEM_GEMINI_API_KEY" };
    case "claude":
      return { OPENCODE_MEM_PROVIDER: "claude", label: "Claude Agent SDK", keyEnv: "" };
  }
}
```

- [ ] **Step 3: Wire presets into promptProvider**
In `install.ts` `promptProvider`: replace the provider select menu with the 5-option menu (Qwen default `initialValue: "qwen"`). After selection: `const preset = buildProviderPreset(selectedProvider);` For non-claude presets, prompt for `preset.keyEnv` if not already set, then `mergeSettings({ OPENCODE_MEM_PROVIDER: preset.OPENCODE_MEM_PROVIDER, ...(preset.OPENCODE_MEM_OPENROUTER_BASE_URL ? { OPENCODE_MEM_OPENROUTER_BASE_URL: preset.OPENCODE_MEM_OPENROUTER_BASE_URL, OPENCODE_MEM_OPENROUTER_MODEL: preset.OPENCODE_MEM_OPENROUTER_MODEL } : {}), [preset.keyEnv]: apiKey })`. Keep the existing claude auth flow for `selectedProvider === "claude"`.

- [ ] **Step 4: Run tests**
Run: `bun test tests/installer-presets.test.ts && npx tsc --noEmit` → PASS.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat(install): Qwen/DeepSeek provider presets; Qwen default (free, RU no-VPN)"
```

---

## Task 7: Фаза 4a — Install honesty: round-trip capture check

**Files:**
- Modify: `src/services/integrations/OpenCodeInstaller.ts` (`installOpenCodeIntegration`), `src/npx-cli/commands/install.ts` (opencode case)

**Interfaces:** `installOpenCodeIntegration()` returns non-zero if the worker is unreachable or a test observation round-trip fails, instead of silently reporting OK.

- [ ] **Step 1: Write a failing test**
`tests/opencode-install-honesty.test.ts`:
```ts
import { describe, it, expect } from "bun:test";

describe("install honesty round-trip", () => {
  it("fails install when worker is unreachable", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async () => { throw Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" }); }) as typeof fetch;
    try {
      const { installOpenCodeIntegration } = await import("../src/services/integrations/OpenCodeInstaller");
      const code = await installOpenCodeIntegration();
      expect(code).not.toBe(0);
    } finally {
      globalThis.fetch = original;
    }
  });
});
```
Run → FAIL.

- [ ] **Step 2: Add round-trip check to installOpenCodeIntegration**
In `OpenCodeInstaller.ts`:
```ts
async function verifyCaptureRoundTrip(): Promise<boolean> {
  const url = `http://${getWorkerHost()}:${getWorkerPort()}`;
  try {
    const health = await fetch(`${url}/api/readiness`);
    if (!health.ok) return false;
    const testObs = await fetch(`${url}/api/sessions/observations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentSessionId: `opencode-install-verify-${Date.now()}`,
        tool_name: "install_verify",
        tool_input: {},
        tool_response: "install honesty probe",
        cwd: process.cwd(),
      }),
    });
    return testObs.ok;
  } catch {
    return false;
  }
}
```
In `installOpenCodeIntegration()`: call `verifyCaptureRoundTrip()` after plugin install + before "Installation complete"; if false, `console.error("Worker unreachable or capture round-trip failed. Start the worker: npx opencode-mem start"); return 1;`

- [ ] **Step 3: Start worker bootstrap in install flow**
In `install.ts` opencode case: ensure the worker is started before the round-trip — `const { spawnWorker } = await import('../../services/worker-spawner.js'); await spawnWorker();` then poll `/api/readiness` up to ~5s. If already running, skip.

- [ ] **Step 4: Run tests**
Run: `bun test tests/opencode-install-honesty.test.ts && bun test` → PASS.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat(install): honesty round-trip — fail install when capture path is not live"
```

---

## Task 8: Фаза 4b — Verify opencode actually loads the plugin + captures (live)

**Files:** none modified (verification task); may produce fixes if loading fails.

- [ ] **Step 1: Build + install fresh**
```bash
npm run build
npx opencode-mem install --ide opencode
```
Expected: install completes with round-trip OK (worker started, probe observation accepted).

- [ ] **Step 2: Confirm plugin loads in opencode**
Start opencode in this project; check the opencode log (`~/.local/share/opencode/log/<latest>.log`) for plugin load / no errors. Confirm `opencode_mem_search` tool is registered.

- [ ] **Step 3: Confirm capture produces an opencode observation**
Run a couple of tool calls in an opencode session, then:
```bash
bun -e 'import {Database} from "bun:sqlite"; const db=new Database(process.env.HOME+"/.opencode-mem/opencode-mem.db",{readonly:true}); console.log(db.query("SELECT platform_source, count(*) n FROM sdk_sessions GROUP BY platform_source").all());'
```
Expected: a row `platform_source=opencode` with n≥1. Check `~/.config/opencode/AGENTS.md` gets real context (not placeholder) after a session ends/compacts.

- [ ] **Step 4: If capture fails — debug (systematic-debugging skill)**
Common causes: opencode 1.17.15 plugin API shape differs (default export form), worker port mismatch, tool name collision. Fix in `src/integrations/opencode-plugin/index.ts` and rebuild.

- [ ] **Step 5: Commit any fixes**
```bash
git add -A && git commit -m "fix(opencode): adapt plugin to opencode 1.17.15 load contract"
```

---

## Task 9: Фаза 5a — Reproducible sync script

**Files:**
- Create: `scripts/sync-opencode-plugin.cjs`
- Modify: `package.json` (add `sync:opencode` script)

- [ ] **Step 1: Write the sync script**
`scripts/sync-opencode-plugin.cjs`:
```js
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const src = path.resolve('dist/opencode-plugin/index.js');
const destDir = path.join(os.homedir(), '.config', 'opencode', 'plugins');
const dest = path.join(destDir, 'opencode-mem.js');
if (!fs.existsSync(src)) { console.error(`Missing build: ${src}. Run \`npm run build\` first.`); process.exit(1); }
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log(`Synced: ${src} -> ${dest}`);
```

- [ ] **Step 2: Add npm script**
`package.json` scripts:
```json
"sync:opencode": "node scripts/sync-opencode-plugin.cjs",
"build-and-sync": "npm run build && npm run sync:opencode"
```
(Replace the existing `build-and-sync` that pointed at the claude marketplace.)

- [ ] **Step 3: Verify reproducibility**
Run: `npm run build-and-sync`
Then: `diff dist/opencode-plugin/index.js ~/.config/opencode/plugins/opencode-mem.js` → identical.

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "build: add sync:opencode script for reproducible plugin install"
```

---

## Task 10: Фаза 5b — Docs rebrand + attribution

**Files:**
- Modify: `README.md`, `CLAUDE.md` (rebrand to opencode-mem dev doc), `LICENSE`, `NOTICE`, root `AGENTS.md` (keep guidelines, add fork note)

- [ ] **Step 1: Rebrand README + CLAUDE.md**
README: update title/badges/quick-start to `npx opencode-mem install --ide opencode`; remove OpenClaw/Cursor/Codex/Antigravity sections; document Qwen default + DashScope key setup; add "Forked from thedotmack/claude-mem" attribution. CLAUDE.md → keep as dev build instructions, rebrand commands (`npm run build-and-sync`), file locations (`~/.opencode-mem`).

- [ ] **Step 2: Update LICENSE/NOTICE attribution**
Keep Apache-2.0; NOTICE: "opencode-mem — forked from claude-mem by Alex Newman (@thedotmack), https://github.com/thedotmack/claude-mem".

- [ ] **Step 3: Run full verification suite**
Run: `npx tsc --noEmit && npm run build && bun test`
Expected: all green. Plus `grep -ri "claude[-_ ]mem" src/ | grep -v "thedotmack/claude-mem"` → empty.

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "docs: rebrand to opencode-mem; Qwen default; upstream attribution"
```

---

## Success criteria (форк готов когда)

1. `git clone` → `npm install` → `npm run build` → `npx opencode-mem install --ide opencode` работают end-to-end без ручных правок.
2. `~/.opencode-mem/opencode-mem.db` создаётся с нуля.
3. Live opencode-сессия захватывает наблюдения (`platform_source = "opencode"`).
4. В `~/.config/opencode/AGENTS.md` появляется реальный контекст из прошлых сессий (не заглушка).
5. Дефолт-установка использует Qwen `qwen-plus` (DashScope) без указания `--provider`.
6. `bun test` и `tsc --noEmit` зелёные.
7. В репо нет функционального брендинга `claude-mem` (кроме attribution-ссылок на апстрим).

## References

- Spec: `docs/superpowers/specs/2026-07-08-opencode-mem-fork-design.md`
- Upstream: `https://github.com/thedotmack/claude-mem` (v13.10.2, commit `312d640b0`)
- opencode contract plan: `plans/08-opencode-integration.md` (kept as upstream history)
