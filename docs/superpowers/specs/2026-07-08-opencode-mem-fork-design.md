# opencode-mem: форк claude-mem под OpenCode — дизайн (Identity)

- **Дата:** 2026-07-08
- **Статус:** Approved (дизайн одобрен пользователем)
- **Тип:** Design spec → пойдёт в writing-plans
- **Базируется на:** `thedotmack/claude-mem` v13.10.2 (`origin/main`, commit `312d640b0`)

## 1. Контекст и проблема

`/home/kykiles/projects/opencode-mem/` содержит чистый, немодифицированный клон `claude-mem` v13.10.2 в подкаталоге `claude-mem-upstream/` и корневой `AGENTS.md` (поведенческие гайдлайны). Сам «форк» сегодня существует **только как скомпилированный бандл** `~/.config/opencode/plugins/opencode-mem.js` (337 КБ, esbuild+zod inlined) — ребренд апстрим-плагина поверх движка claude-mem. Исходников этого ребренда в репо нет, пересобрать/починить плагин из репо нельзя.

**Аудит выявил три проблемы:**

1. **opencode ни разу не захватил наблюдения.** В `~/.claude-mem/claude-mem.db` 67 сессий, 252 наблюдения, 42 саммари — все с `platform_source = "claude"`, проекты `web_cabinet`/`routing_config`/`claude_admin_agents_system`. Наблюдений с проекта `opencode` нет. `~/.config/opencode/AGENTS.md` висит с заглушкой «No context yet». Корневая причина: воркер не запущен во время opencode-сессий → fire-and-forget POST плагина глушит `ECONNREFUSED` и тихо теряет данные.
2. **Воркер не запущен** (порт 37700 не слушает, процесса нет) → захват и инъекция сейчас не идут.
3. **Форк не воспроизводим** — нет исходников ребренда, бандл собран где-то вовне.

Цель — превратить это в настоящий opencode-нативный форк с воспроизводимой сборкой, рабочим захватом и free-моделью по умолчанию, работающей в РФ без VPN.

## 2. Решение по скоупу (выбрано пользователем)

Из трёх вариантов — **Skin** (только ребренд), **Identity** (ребренд + данные/env/IDE), **Native** (Identity + удаление claude-провайдера + перепис воркера) — выбран **Identity**.

Обоснование: Skin не является «глубоким рерайтом»; Native даёт маргинальную выгоду при высоком риске (хирургия оттестированного пайплайна суммаризации); абстракция провайдеров уже поддерживает OpenAI-совместимые модели, так что Qwen/DeepSeek как дефолт не требуют удаления claude. Identity — sweet spot: настоящая opencode-нативная идентичность без рискованной переписки движка.

## 3. Архитектурные решения

### 3.1. Что оставляем без изменений (движок)

- Воркер-сервис (`src/services/worker-service.ts`, `src/services/worker/`).
- Хранилище: SQLite + FTS5 (`src/services/sqlite/`), Chroma vector DB.
- Пайплайн суммаризации и наблюдений: `SessionManager`, `ClaudeProvider`, `GeminiProvider`, `OpenRouterProvider`, `OpenAICompatibleProvider`, `FormattingService`.
- HTTP API воркера (`src/services/worker/http/`) — эндпоинты `/api/sessions/init`, `/api/sessions/observations`, `/api/sessions/summarize`, `/api/context/inject`, `/api/search/observations`, `/api/readiness`.
- Контракт opencode-плагина (`src/integrations/opencode-plugin/index.ts`): хуки `tool.execute.after`, `chat.message`, `event`, `experimental.session.compacting`; bus-события `session.idle`, `session.deleted` (см. `plans/08-opencode-integration.md` — уже корректно).
- Абстракцию провайдеров и классификацию ошибок.

### 3.2. Что меняем

| Поверхность | Было (апстрим) | Станет (форк) |
|---|---|---|
| Имя пакета / bin | `claude-mem` / `claude-mem` | `opencode-mem` / `opencode-mem` |
| Дата-директория | `~/.claude-mem` | `~/.opencode-mem` |
| Env-префикс | `CLAUDE_MEM_*` | `OPENCODE_MEM_*` |
| Context-теги | `<claude-mem-context>` / `</claude-mem-context>` | `<opencode-mem-context>` / `</opencode-mem-context>` |
| Заголовок AGENTS.md | `# Claude-Mem Memory Context` | `# opencode-mem Memory Context` |
| Файл плагина | `~/.config/opencode/plugins/claude-mem.js` | `~/.config/opencode/plugins/opencode-mem.js` |
| Экспорт плагина | `ClaudeMemPlugin` (default) | `OpenCodeMemPlugin` (default) |
| Имя MCP tool | `claude_mem_search` | `opencode_mem_search` |
| Log-префикс | `[claude-mem]` | `[opencode-mem]` |
| README / CLAUDE.md | claude-mem | opencode-mem |

### 3.3. IDE-интеграции — opencode-only

Удаляем инсталлеры и пути сборки для чужих IDE: `CursorHooksInstaller`, `CodexCliInstaller`, `WindsurfHooksInstaller`, `OpenClawInstaller`, `AntigravityCliHooksInstaller`, claude-code plugin registration. Оставляем только `OpenCodeInstaller` и `src/integrations/opencode-plugin/`. В `src/npx-cli/commands/install.ts` оставляем `case 'opencode'`; прочие `--ide` cases убираем (или заменяем на clear error «opencode-mem supports only OpenCode»). В `src/npx-cli/commands/ide-detection.ts` оставляем только opencode.

### 3.4. Провайдеры — Qwen по умолчанию

Модель по умолчанию в установщике — **Qwen `qwen-plus` через DashScope (Alibaba)**. Обоснование выбора пользователем: бесплатная квота, доступ из РФ без VPN, OpenAI-совместимый API, хорошо следует структурированному формату вывода (задача воркера — фиксированная экстракция/суммаризация, не сложный reasoning; Haiku-класса достаточно).

Реализация — **без нового provider-id**: Qwen и DeepSeek добавляются как **пресеты существующего `openrouter`-провайдера** (он уже поддерживает кастомный `OPENROUTER_BASE_URL` для OpenAI-compatible эндпоинтов, см. `src/shared/openrouter-base-url.ts`, `src/services/worker/OpenRouterProvider.ts`):

| Пресет | `OPENCODE_MEM_PROVIDER` | `OPENCODE_MEM_OPENROUTER_BASE_URL` | `OPENCODE_MEM_OPENROUTER_MODEL` | Ключ |
|---|---|---|---|---|
| **Qwen (DashScope) — дефолт** | `openrouter` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` | `DASHSCOPE_API_KEY` |
| DeepSeek | `openrouter` | `https://api.deepseek.com` | `deepseek-chat` | `DEEPSEEK_API_KEY` (или `OPENROUTER_API_KEY`) |
| OpenRouter (free models) | `openrouter` | (пусто = дефолт OpenRouter) | `deepseek/deepseek-v3.2-exp:free` и т.п. | `OPENROUTER_API_KEY` |
| Gemini | `gemini` | — | `gemini-2.5-flash-lite` | `CLAUDE_MEM_GEMINI_API_KEY` → `OPENCODE_MEM_GEMINI_API_KEY` |
| Claude (Agent SDK) | `claude` | — | `claude-haiku-4-5-20251001` | subscription / `ANTHROPIC_API_KEY` |

Валидация `OPENCODE_MEM_PROVIDER` (`src/services/worker/http/routes/SettingsRoutes.ts`) остаётся `{claude, gemini, openrouter}` — новых значений нет. Пресеты — это просто предзаполнение настроек в интерактивном промпте установщика.

### 3.5. Структура репо (Фаза 0)

Содержимое `claude-mem-upstream/` поднимается в корень `/home/kykiles/projects/opencode-mem/`. Текущий git-remote `origin` (`thedotmack/claude-mem`) переименовывается в `upstream` — для подтягивания будущих фиксов апстрима. Наши изменения идут на новой ветке `opencode-mem/main`. Корневой `AGENTS.md` (поведенческие гайдлайны) сохраняется; апстримный `CLAUDE.md` ребрендится в dev-документ `AGENTS.md` для воркера (или оставляется как `CLAUDE.md` с обновлением содержания — решается в плане).

### 3.6. Старт свежим

Старая БД `~/.claude-mem/` (252 наблюдения, все `platform_source=claude`, чужие проекты) **не мигрируется**. Форк стартует свежим в `~/.opencode-mem/`. Обоснование: старые данные не относятся к opencode-сессиям, миграция добавит риск ради нулевой пользы.

## 4. Фазы внедрения и критерии верификации

> Порядок фаз строго последовательный. Каждая фаза завершается явной проверкой.

### Фаза 0 — Подготовка репо
- Поднять содержимое `claude-mem-upstream/` в корень репо.
- `origin` → `upstream`; ветка `opencode-mem/main`.
- Сохранить корневой `AGENTS.md` (гайдлайны); ребрендить апстримный dev-документ.
- **verify:** `git remote -v` показывает `upstream`; `ls` корня = тело форка; `git status` чистый на `opencode-mem/main`.

### Фаза 1 — Механический ребренд + env-rename + data-dir
- Scripted-замена: `CLAUDE_MEM_` → `OPENCODE_MEM_` (687 вхождений / 80 файлов в `src/`), `~/.claude-mem` → `~/.opencode-mem` (56 / 26), брендовые `claude-mem`/`claude_mem` → `opencode-mem`/`opencode_mem` (1146).
- Правка `package.json`: `name`, `bin`, `keywords`, `repository`, `description`.
- Правка `src/utils/context-injection.ts`: теги `CONTEXT_TAG_OPEN`/`CLOSE`.
- Правка `src/services/integrations/OpenCodeInstaller.ts`: путь плагина `opencode-mem.js`, заголовок, branding.
- Правка `src/integrations/opencode-plugin/index.ts`: экспорт `OpenCodeMemPlugin`, tool `opencode_mem_search`, log-префикс.
- **verify:** `grep -ri "claude[-_ ]mem" src/` → только intended (в комментариях-ссылках на апстрим); `tsc --noEmit` зелёный; `bun test` зелёный (с обновлёнными ссылками в тестах).

### Фаза 2 — opencode-only
- Удалить: `src/services/integrations/{CursorHooksInstaller,CodexCliInstaller,WindsurfHooksInstaller,OpenClawInstaller,AntigravityCliHooksInstaller}.ts` и сопутствующие.
- В `src/npx-cli/commands/install.ts` убрать `--ide` cases кроме `opencode`; в `ide-detection.ts` оставить opencode.
- В `scripts/build-hooks.js` и `scripts/sync-marketplace*` убрать ссылки на claude-code/cursor/codex/windsurf/openclaw.
- **verify:** `npm run build` succeeds; `npx opencode-mem install --ide opencode` работает end-to-end; прочие `--ide` убраны/дают clear error; `bun test` зелёный.

### Фаза 3 — Пресеты провайдеров (Qwen дефолт)
- В `promptProvider` (`install.ts`) добавить опции Qwen (DashScope) и DeepSeek, маппинг на `openrouter`-пресет (предзаполнение `OPENCODE_MEM_OPENROUTER_BASE_URL` + `OPENCODE_MEM_OPENROUTER_MODEL`).
- Qwen — `initialValue` интерактивного промпта и non-interactive default.
- Обновить `src/shared/SettingsDefaultsManager.ts` дефолты: `OPENCODE_MEM_PROVIDER` дефолт → `openrouter`, `OPENCODE_MEM_OPENROUTER_BASE_URL` → DashScope URL, `OPENCODE_MEM_OPENROUTER_MODEL` → `qwen-plus` (для пресета Qwen по умолчанию — либо отдельный пресет-объект; решается в плане).
- **verify:** unit-тест генерации preset-конфига (Qwen/DeepSeek); round-trip суммаризации через Qwen live — запустить воркер, отправить тестовое observation через `/api/sessions/observations`, убедиться что саммари создалось в `~/.opencode-mem/opencode-mem.db`.

### Фаза 4 — Чиним захват opencode + install honesty
- Запуск воркера в install-флоу (или явный `opencode-mem start` + проверка `/api/readiness`).
- Реализовать round-trip проверку на install (plan-08 step 4 «Install honesty»): тестовое observation должно дойти до воркера до того, как install сообщит «OK».
- Подтвердить, что opencode 1.17.15 реально грузит плагин (форма default-export `OpenCodeMemPlugin`, контракт хуков).
- **verify:** live opencode-сессия создаёт observation с `platform_source = "opencode"` в `~/.opencode-mem/opencode-mem.db`; в `~/.config/opencode/AGENTS.md` появляется реальный контекст (не заглушка).

### Фаза 5 — Воспроизводимость сборки + docs
- `npm run build` → `dist/opencode-plugin/index.js` (ребренд) — уже wired в `scripts/build-hooks.js:630`.
- Скрипт `sync:opencode` копирует `dist/opencode-plugin/index.js` в `~/.config/opencode/plugins/opencode-mem.js`.
- Ребренд README, dev-документа; обновить `CLAUDE.md`→`AGENTS.md` инструкции по сборке.
- **verify:** пересобранный бандл = установленный (diff `dist/opencode-plugin/index.js` vs `~/.config/opencode/plugins/opencode-mem.js`); плагин грузится после рестарта opencode; `npx opencode-mem install` с чистого листа работает end-to-end (install → start → capture → context inject).

## 5. Риски и митигация

| Риск | Митигация |
|---|---|
| Env-rename 687 вхождений — пропуск/опечатка | Scripted replace + `tsc --noEmit` + полный `bun test` после каждой фазы |
| Контракт opencode plugin API 1.17.15 отличается от того, под чем писали апстрим | Фаза 4 явно верифицирует загрузку live-сессией; контракт-тест `tests/integrations/opencode-plugin-contract.test.ts` остаётся regression guard |
| Qwen rate-limit / free-quota для воркера, стреляющего на каждый tool-call | Наблюдать в Фазе 3 round-trip; при необходимости опираться на существующий `SessionMessageBuffer`/дедуп в апстриме; `CLAUDE_MEM_SKIP_TOOLS`→`OPENCODE_MEM_SKIP_TOOLS` уже фильтрует `ListMcpResourcesTool,SlashCommand,Skill,TodoWrite,AskUserQuestion` |
| Потеря чужих IDE-фич | Осознанный фича-дроп (форк opencode-only) |
| Корень репо не git-repo → спек не закоммичен сразу | Инициализация git-структуры — часть Фазы 0; спек лежит в `docs/superpowers/specs/` и коммитится в первой же транзакции Фазы 0 |

## 6. Out of scope

- Переписывание движка суммаризации/поиска (вариант Native).
- Удаление `claude`-провайдера (оставляем как опцию для пользователей с Anthropic-подпиской).
- Миграция старой `~/.claude-mem` БД (старт свежим).
- Cloud-sync / server / postgres-пути апстрима (форк локальный; серверная часть не трогается).
- Добавление новых bus-event типов opencode (контракт уже корректен по plan-08).
- Реализация GigaChat (не OpenAI-совместимый → требовал бы кастомный провайдер).

## 7. Success criteria (общие)

Форк считается готовым, когда:
1. `git clone` → `npm install` → `npm run build` → `npx opencode-mem install --ide opencode` работают end-to-end без ручных правок.
2. `~/.opencode-mem/opencode-mem.db` создаётся с нуля.
3. Live opencode-сессия захватывает наблюдения (`platform_source = "opencode"`).
4. В `~/.config/opencode/AGENTS.md` появляется реальный контекст из прошлых сессий (не заглушка).
5. Дефолт-установка использует Qwen `qwen-plus` (DashScope) без указания `--provider`.
6. `bun test` и `tsc --noEmit` зелёные.
7. В репо нет intended-брендинга `claude-mem` (кроме attribution-ссылок на апстрим).

## 8. Ссылки

- Апстрим: `https://github.com/thedotmack/claude-mem` (v13.10.2, commit `312d640b0`).
- План апстрима по opencode: `plans/08-opencode-integration.md` (контракт хуков).
- Провайдер openrouter + кастомный base_url: `src/shared/openrouter-base-url.ts`, `src/services/worker/OpenRouterProvider.ts`.
- Сборка opencode-плагина: `scripts/build-hooks.js:630` → `dist/opencode-plugin/index.js`.
- Контракт-тест: `tests/integrations/opencode-plugin-contract.test.ts`.
- Установщик провайдера: `src/npx-cli/commands/install.ts:922` (`promptProvider`).
