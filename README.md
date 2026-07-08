# opencode-mem

Persistent memory compression system for [OpenCode](https://opencode.ai). Captures tool usage observations, compresses them into semantic summaries, and injects relevant context into future OpenCode sessions.

> Forked from [claude-mem](https://github.com/thedotmack/claude-mem) by Alex Newman (@thedotmack). Apache-2.0.

## Quick Start

```bash
npx opencode-mem install --ide opencode
```

Restart OpenCode. Context from previous sessions will automatically appear in new sessions.

## How It Works

1. **OpenCode plugin** — registers hooks (`tool.execute.after`, `chat.message`, `experimental.session.compacting`, `event`) that capture tool usage as observations.
2. **Worker service** — local HTTP API (default port 37700) that stores observations in SQLite + FTS5, generates semantic summaries via an AI provider, and serves context injection + search.
3. **mem-search tool** — `opencode_mem_search` plugin tool for natural-language queries over past observations.
4. **Context injection** — on session start, relevant past context is injected into `~/.config/opencode/AGENTS.md` inside `<opencode-mem-context>` tags.

## AI Provider

Default: **Qwen `qwen-plus` via DashScope (Alibaba)** — free tier, works in Russia without VPN, OpenAI-compatible API.

Alternatives selectable during install: DeepSeek (`deepseek-chat`), OpenRouter (any model), Gemini, Claude Agent SDK.

Configure your DashScope API key during install, or set it manually in `~/.opencode-mem/settings.json`:

```json
{
  "OPENCODE_MEM_PROVIDER": "openrouter",
  "OPENCODE_MEM_OPENROUTER_BASE_URL": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "OPENCODE_MEM_OPENROUTER_MODEL": "qwen-plus",
  "OPENCODE_MEM_OPENROUTER_API_KEY": "<your-dashscope-key>"
}
```

## File Locations

- **Data directory**: `~/.opencode-mem/`
- **Database**: `~/.opencode-mem/opencode-mem.db` (SQLite + FTS5)
- **Chroma vectors**: `~/.opencode-mem/chroma/`
- **Settings**: `~/.opencode-mem/settings.json`
- **Plugin (installed)**: `~/.config/opencode/plugins/opencode-mem.js`
- **Context file**: `~/.config/opencode/AGENTS.md`

## Development

```bash
npm install          # install deps (bun preferred)
npm run build        # build worker + npx-cli + opencode plugin -> dist/
npm run sync:opencode  # copy dist/opencode-plugin/index.js to ~/.config/opencode/plugins/
npm run build-and-sync  # build + sync
npm test             # bun test
npx tsc --noEmit     # typecheck
```

### Requirements

- **Bun** (runtime + test) — auto-installed if missing
- **uv** (Python for Chroma vector search) — auto-installed if missing
- **Node.js** ≥ 20.12

## Configuration

Settings in `~/.opencode-mem/settings.json` (auto-created with defaults on first run). All env vars use the `OPENCODE_MEM_*` prefix.

## Troubleshooting

If memory is not being captured:

1. Verify the worker is running: `curl http://127.0.0.1:37700/api/readiness` → `{"status":"ready"}`
2. If not, start it: `npx opencode-mem start`
3. Restart OpenCode (the plugin loads at startup).
4. Re-run install (it now self-verifies the capture path): `npx opencode-mem install --ide opencode`

## License

Apache-2.0. Forked from claude-mem (https://github.com/thedotmack/claude-mem).
