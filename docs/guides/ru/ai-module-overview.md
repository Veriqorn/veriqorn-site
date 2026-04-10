# AI-модуль — Обзор

QA Report Platform включает опциональный AI-модуль, который добавляет интеллектуальный анализ сбоев, оценку тестового покрытия с учётом кода и автоматические рекомендации по устранению пробелов.

## Редакции

| Функция | Basic (OSS) | Pro |
|---------|-------------|-----|
| Загрузка Allure-результатов и запуски | Да | Да |
| Дашборд и аналитика | Да | Да |
| Уведомления (Slack/Telegram/Webhook) | Да | Да |
| Мультипроектность и контроль доступа | Да | Да |
| Выборочный перезапуск тестов | Да | Да |
| AI-анализ сбоев | - | Да |
| Индексация репозитория и поиск | - | Да |
| Коннекторы доказательств (Kibana/Sentry/Grafana) | - | Да |
| Coverage Intelligence | - | Да |

## Архитектура

```
┌─────────────────────────────────────────────────┐
│                  Frontend                        │
│  Settings UI · Failure Panel · Coverage Page     │
└──────────────────────┬──────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────┐
│                  Backend                         │
│                                                  │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Edition Gate │→ │ Indexing · Retrieval      │  │
│  │ (License)    │  │ Connectors · Analysis     │  │
│  └──────────────┘  │ Coverage Intelligence     │  │
│                    └──────────────────────────┘  │
│                         │                        │
│                    ┌────▼─────┐                   │
│                    │ Settings │  (PostgreSQL)     │
│                    └──────────┘                   │
└──────────────────────────────────────────────────┘
```

## Руководства

1. [Активация Pro-лицензии](./ai-pro-license.md) — включение AI-функций
2. [Подключение LLM](./ai-llm-connection.md) — подключение LLM-провайдера
3. [Индексация репозитория](./ai-repository-indexing.md) — индексация вашей кодовой базы
4. [Автоиндексация](./ai-auto-indexing.md) — автоматическая переиндексация при коммитах
5. [Чат по базе знаний](./ai-knowledge-base-chat.md) — задавайте вопросы о вашем коде
6. [MCP-сервер](./ai-mcp-server.md) — запросы к коду из Claude Code / VS Code
7. [Коннекторы доказательств](./ai-evidence-connectors.md) — подключение Kibana, Sentry, Grafana
8. [Coverage Intelligence](./ai-coverage-intelligence.md) — настройка оценки тестового покрытия
9. [Настройка векторной БД для AI (PostgreSQL + Qdrant)](./ai-vector-db-setup.md) — установка и настройка хранилища векторного поиска
10. [Гибридная архитектура поиска](../architecture/ai-retrieval-hybrid-architecture.md) — границы этапов, подключаемые интерфейсы, модель миграции
11. [Развёртывание гибридного поиска](../rollout/ai-hybrid-retrieval-rollout.md) — поэтапное включение и план отката

## Быстрый старт

```bash
# 1. Set environment variables in backend .env
AI_ANALYSIS_DEFAULT_MODE=pro_self_hosted
AI_ANALYSIS_LICENSE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
AI_ANALYSIS_MONOREPO_ROOT=/path/to/your/project

# 2. Configure license via API or Settings UI
POST /settings/aiAnalysisLicense
{ "value": { "payload": {...}, "signature": "..." } }

# 3. Verify capabilities
GET /ai-analysis/capabilities
# → { "licensed": true, "features": { "analysis": { "enabled": true }, ... } }

# 4. Index your repositories
POST /ai-analysis/index/repositories

# 5. Open Coverage Intelligence page in UI
# → /projects/{projectId}/coverage
```

## Операции поиска (векторный + резервный)

Рекомендуемый порядок развёртывания для self-hosted Pro:
1. Начните с `aiAnalysisVectorProvider=lexical-fallback`.
2. Переиндексируйте репозитории после включения метаданных чанков с учётом кода.
3. Переключитесь на поддерживаемый векторный провайдер в staging-среде (`memory`, `in-memory`, `local-ann`).
4. Проверьте релевантность поиска и задержку при обработке упавших тестов.
5. Отслеживайте долю фолбэков и предупреждения перед развёртыванием в продакшене.

Текущий стек гибридного поиска:
- Лексический канал BM25
- ANN/векторный канал (включая `qdrant`)
- Каналы подсказок по путям/символам
- Канал расширения графа символов
- Опциональный этап переранжирования
- Reciprocal Rank Fusion (RRF) для объединения каналов

Безопасные значения по умолчанию:
- Векторные ANN-операции защищены тайм-аутами провайдера.
- При ошибках провайдера, тайм-аутах или пустых ANN-совпадениях поиск автоматически переключается на детерминированный лексический режим.
- В логах поиска фиксируются режим провайдера, использование фолбэка, количество кандидатов/совпадений для диагностики.

Откат:
- Установите `aiAnalysisVectorProvider=lexical-fallback`.
- Повторите индексацию, если схема индекса изменилась между релизами.
