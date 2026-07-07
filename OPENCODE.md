# OpenCode-Mem: Persistent Memory for OpenCode

OpenCode-mem is an OpenCode plugin providing persistent memory across sessions. It captures tool usage, compresses observations using the Claude Agent SDK, and injects relevant context into future sessions.

## Build

```bash
npm run build                    # Build, generate plugin
```

## File Locations

- **Source**: `<project-root>/src/`
- **Built Plugin**: `<project-root>/dist/` and `<project-root>/plugin/`
- **OpenCode Plugin Config**: `~/.config/opencode/plugins/opencode-mem.js`
- **Database**: `~/.opencode-mem/opencode-mem.db`
- **Chroma**: `~/.opencode-mem/chroma/`

## Requirements

- **Bun** (all platforms - auto-installed if missing)
- **uv** (all platforms - auto-installed if missing, provides Python for Chroma)
- Node.js

## Documentation

**Public Docs**: https://docs.opencode-mem.ai
**Source**: `docs/public/` - MDX files, edit `docs.json` for navigation

## Important

No need to edit the changelog ever, it's generated automatically.

## Daily Maintenance

Run a daily version check across all package manifests and upgrade every dependency to its latest version — including major version bumps. Staying on the latest is the goal; do not skip majors.

- Check `package.json` (root) and all nested `package.json` files (e.g. `plugin/`) for outdated dependencies via `npm outdated`.
- Upgrade every package to `latest` (use `npm install <pkg>@latest` for each, or `npx npm-check-updates -u && npm install`). Bump majors too.
- Run `npm audit fix` to resolve advisories.
- After upgrades, run `npm run build` and verify the worker starts and tests pass. Fix any breakage caused by major bumps in the same change.
- Commit the updated `package.json` and `package-lock.json` files.
