# opencode-mem

Система сжатия постоянной памяти для [OpenCode](https://opencode.ai). Захватывает наблюдения использования инструментов, сжимает их в семантические сводки и внедряет релевантный контекст в будущие сеансы OpenCode.

> Форк [claude-mem](https://github.com/thedotmack/claude-mem) от Alex Newman (@thedotmack). Apache-2.0.

## Быстрый старт

```bash
npx opencode-mem install --ide opencode
```

Перезапустите OpenCode. Контекст из предыдущих сеансов будет автоматически появляться в новых сеансах.

## Как это работает

1. **Плагин OpenCode** — регистрирует хуки (`tool.execute.after`, `chat.message`, `experimental.session.compacting`, `event`), которые захватывают использование инструментов как наблюдения.
2. **Сервис Worker** — локальный HTTP API (порт по умолчанию 37700), хранит наблюдения в SQLite + FTS5, генерирует семантические сводки через AI-провайдера и обслуживает внедрение контекста + поиск.
3. **Инструмент mem-search** — `opencode_mem_search` — поиск по прошлым наблюдениям на естественном языке.
4. **Внедрение контекста** — при старте сеанса релевантный прошлый контекст внедряется в `~/.config/opencode/AGENTS.md` внутрь тегов `<opencode-mem-context>`.

## AI-провайдер

По умолчанию: **OpenCode Zen (`deepseek-v4-flash-free`)** — бесплатно, быстро, использует ключ подписки OpenCode (авто-чтение из `~/.local/share/opencode/auth.json`).

Альтернативы, выбираемые при установке: OpenCode Go, Qwen (DashScope), DeepSeek, OpenRouter (любая модель), Gemini, Claude Agent SDK.

Настройте ключ API при установке или вручную в `~/.opencode-mem/settings.json`:

```json
{
  "OPENCODE_MEM_PROVIDER": "openrouter",
  "OPENCODE_MEM_OPENROUTER_BASE_URL": "https://opencode.ai/zen/v1",
  "OPENCODE_MEM_OPENROUTER_MODEL": "deepseek-v4-flash-free",
  "OPENCODE_MEM_OPENROUTER_API_KEY": "<ваш-ключ-подписки-opencode>"
}
```

Для пресета `opencode-zen` ключ считывается автоматически из подписки OpenCode; ручная настройка не требуется.

## Расположение файлов

- **Директория данных**: `~/.opencode-mem/`
- **База данных**: `~/.opencode-mem/opencode-mem.db` (SQLite + FTS5)
- **Векторы Chroma**: `~/.opencode-mem/chroma/`
- **Настройки**: `~/.opencode-mem/settings.json`
- **Плагин (установленный)**: `~/.config/opencode/plugins/opencode-mem.js`
- **Файл контекста**: `~/.config/opencode/AGENTS.md`

## Разработка

```bash
npm install            # установка зависимостей (рекомендуется bun)
npm run build          # сборка worker + npx-cli + плагина OpenCode -> dist/
npm run sync:opencode  # копирование dist/opencode-plugin/index.js в ~/.config/opencode/plugins/
npm run build-and-sync # сборка + синхронизация
npm test               # bun test
npx tsc --noEmit       # проверка типов
```

### Требования

- **Bun** (среда выполнения + тесты) — устанавливается автоматически при отсутствии
- **uv** (Python для векторного поиска Chroma) — устанавливается автоматически при отсутствии
- **Node.js** ≥ 20.12

## Конфигурация

Настройки в `~/.opencode-mem/settings.json` (создаётся автоматически с настройками по умолчанию при первом запуске). Все переменные окружения используют префикс `OPENCODE_MEM_*`.

## Устранение неполадок

Если память не захватывается:

1. Проверьте, запущен ли worker: `curl http://127.0.0.1:37700/api/readiness` → `{"status":"ready"}`
2. Если нет, запустите: `npx opencode-mem start`
3. Перезапустите OpenCode (плагин загружается при старте).
4. Повторно запустите установку (теперь она самопроверяет захват): `npx opencode-mem install --ide opencode`

## Лицензия

Apache-2.0. Форк claude-mem (https://github.com/thedotmack/claude-mem).
