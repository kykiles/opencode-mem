# opencode-mem: Runtime fallback API key для OpenCode Go

- **Дата:** 2026-07-08
- **Статус:** Draft
- **Дополняет:** `2026-07-08-opencode-mem-fork-design.md`

## Проблема

`readOpenCodeApiKey()` читает ключ из `~/.local/share/opencode/auth.json` **только в интерактивном инсталлере**. Рантайм (`OpenRouterProvider`) не знает об auth.json — если ключ отсутствует в `settings.json` или `.env`, worker не может делать LLM-вызовы к OpenCode Go.

Текущее состояние: `settings.json` содержит `OPENCODE_MEM_PROVIDER`, `OPENCODE_MEM_OPENROUTER_BASE_URL`, `OPENCODE_MEM_OPENROUTER_MODEL` — **но не `OPENCODE_MEM_OPENROUTER_API_KEY`**.

## Решение

Два изменения:

### 1. Runtime fallback в `OpenRouterProvider.getOpenRouterConfig()`

Добавить `readOpenCodeApiKey()` третьим звеном в цепочку разрешения ключа:

```
settings.OPENCODE_MEM_OPENROUTER_API_KEY
  || getCredential('OPENROUTER_API_KEY')
  || readOpenCodeApiKey()    // ← новый fallback
  || ''
```

### 2. Non-interactive installer пишет ключ

В `install.ts`, ветка `!isInteractive` с `options.provider === 'opencode-go'/'opencode-zen'`: сейчас только `log.warn` и пропуск. Нужно читать `readOpenCodeApiKey()` и писать в `mergeSettings` вместе с base URL и model.

## Файлы изменений

| Файл | Изменение |
|---|---|
| `src/services/worker/OpenRouterProvider.ts` | Добавить `import { readOpenCodeApiKey }` + fallback в `getOpenRouterConfig()` |
| `src/npx-cli/commands/install.ts` | В non-interactive ветке: читать ключ и писать его в settings.json |
| `src/npx-cli/commands/provider-presets.ts` | Уже есть `readOpenCodeApiKey()` — без изменений |
