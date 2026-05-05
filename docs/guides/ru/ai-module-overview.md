# AI-модуль - Обзор

QA Report Platform включает опциональный AI-модуль, который добавляет интеллектуальный анализ сбоев, code-aware оценку тестового покрытия и автоматические рекомендации по пробелам.

## Редакции

| Функция | Basic (OSS) | Pro |
|---------|-------------|-----|
| Загрузка Allure-результатов и прогоны | Да | Да |
| Дашборд и аналитика | Да | Да |
| Уведомления (Slack/Telegram/Webhook) | Да | Да |
| Мультипроектность и контроль доступа | Да | Да |
| Выборочный перезапуск тестов | Да | Да |
| AI-анализ сбоев | - | Да |
| Индексация репозиториев и retrieval | - | Да |
| Коннекторы доказательств (Kibana/Sentry/Grafana) | - | Да |
| Coverage Intelligence | - | Да |

## Руководства

1. [AI Pro License](./ai-pro-license.md) - активация AI-функций
2. [LLM Connection](./ai-llm-connection.md) - подключение LLM-провайдера
3. [Repository Indexing](./ai-repository-indexing.md) - индексация вашей кодовой базы
4. [Auto-Indexing](./ai-auto-indexing.md) - автоматическая переиндексация по коммитам
5. [Knowledge Base Chat](./ai-knowledge-base-chat.md) - вопросы по вашему коду
6. [MCP Server](./ai-mcp-server.md) - запросы к индексированному коду из Claude Code / VS Code
7. [Evidence Connectors](./ai-evidence-connectors.md) - подключение Kibana, Sentry, Grafana
8. [Coverage Intelligence](./ai-coverage-intelligence.md) - настройка оценки покрытия
9. [AI Vector DB Setup](./ai-vector-db-setup.md) - настройка PostgreSQL + Qdrant для retrieval

## Быстрый старт

```bash
# 1. Задайте переменные окружения развёртывания
AI_ANALYSIS_DEFAULT_MODE=pro_self_hosted
AI_ANALYSIS_LICENSE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
AI_ANALYSIS_MONOREPO_ROOT=/path/to/your/project

# 2. Активируйте лицензию через API или Settings UI
POST /settings/aiAnalysisLicense
{ "value": { "payload": {...}, "signature": "..." } }

# 3. Проверьте capabilities
GET /ai-analysis/capabilities

# 4. Запустите индексацию репозиториев
POST /ai-analysis/index/repositories

# 5. Откройте Coverage Intelligence в UI
# /projects/{projectId}/coverage
```

Задавайте эти значения в окружении self-hosted deployment, например в `.env` рядом с `veriqorn-install/docker-compose.yml`.

## Retrieval Operations

Рекомендуемый порядок rollout для self-hosted Pro:

1. Начните с `aiAnalysisVectorProvider=lexical-fallback`.
2. Переиндексируйте репозитории после включения code-aware chunk metadata.
3. Переключитесь на поддерживаемый vector provider в staging (`memory`, `in-memory`, `local-ann`).
4. Проверьте качество retrieval и latency на сценариях с упавшими тестами.
5. Отслеживайте fallback ratio и warnings перед production rollout.

Текущий hybrid retrieval stack:

- BM25 lexical channel
- ANN/vector channel, включая `qdrant`
- path/symbol hint channels
- symbol-graph expansion channel
- optional reranker stage
- reciprocal rank fusion (RRF)

Rollback:

- верните `aiAnalysisVectorProvider=lexical-fallback`
- переиндексируйте репозитории, если между версиями менялась схема индекса
