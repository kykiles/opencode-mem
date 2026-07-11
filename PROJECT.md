# opencode-mem: AI Development Instructions

opencode-mem is an OpenCode plugin providing persistent memory across sessions. It captures tool usage, compresses observations using an AI provider (default: DeepSeek V4 Flash Free via OpenCode Zen), and injects relevant context into future sessions.

## Build

```bash
npm run build-and-sync   # Build, sync plugin to ~/.config/opencode/plugins/
```

## File Locations

- **Source**: `<project-root>/src/`
- **Built Plugin**: `<project-root>/dist/opencode-plugin/`
- **Installed Plugin**: `~/.config/opencode/plugins/opencode-mem.js`
- **Database**: `~/.opencode-mem/opencode-mem.db`
- **Chroma**: `~/.opencode-mem/chroma/`

## Requirements

- **Bun** (all platforms - auto-installed if missing)
- **uv** (all platforms - auto-installed if missing, provides Python for Chroma)
- Node.js >= 20.12

## Important

- This is an opencode-only fork. Only `--ide opencode` is supported.
- Default AI provider: DeepSeek V4 Flash Free (`deepseek-v4-flash-free`) via OpenCode Zen (`https://opencode.ai/zen/v1`); key auto-read from your OpenCode subscription. Qwen `qwen-plus` via DashScope is a selectable alternative (free, works in RU without VPN).
- All env vars use the `OPENCODE_MEM_*` prefix. Data dir: `~/.opencode-mem/`.
- No need to edit the changelog ever, it's generated automatically.

## Forked From

claude-mem by Alex Newman (@thedotmack) — https://github.com/thedotmack/claude-mem
