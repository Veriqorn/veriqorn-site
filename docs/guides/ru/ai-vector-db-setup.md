# Настройка AI Vector DB (PostgreSQL + Qdrant)

Этот гайд описывает, как устроено хранилище данных для AI retrieval в QA Report Platform:

- **PostgreSQL** - основная база платформы для настроек, каталогов и метаданных.
- **Qdrant** - векторная база для ANN/semantic retrieval.

---

## 1) Что где хранится

| Компонент | Что хранит | Где используется |
|---|---|---|
| PostgreSQL | системные настройки, лицензия, каталог индекса | `settings`, `index/repositories`, `index/catalog` |
| Qdrant | плотные векторы чанков и ANN-индекс | `retrieve/evidence`, `failures/analyze` |

Ключевые настройки:

- `aiAnalysisRepositories`
- `aiAnalysisVectorProvider`
- `aiAnalysisIndexCatalog`
- `aiAnalysisLicense`

---

## 2) Предварительные условия

1. Backend (`http://localhost:3001`) и frontend (`http://localhost:3000`) уже запущены.
2. Активирована AI Pro лицензия как минимум с возможностями `indexing` и `retrieval`.
3. Настроен `AI_ANALYSIS_MONOREPO_ROOT` - корневой путь к исходникам, которые будут индексироваться.

См. также:

- [AI Module Overview](./ai-module-overview.md)
- [Repository Indexing](./ai-repository-indexing.md)
- [AI Pro License](./ai-pro-license.md)

---

## 3) PostgreSQL и допущения по развёртыванию

Этот публичный гайд предполагает, что платформа уже развёрнута через поддерживаемый self-hosted install flow.

Если вы используете `veriqorn-install/docker-compose.yml`, PostgreSQL уже входит в поставку, а backend уже подключён к внутреннему сервису `postgres`. Дополнительная настройка PostgreSQL для этого гайда не требуется.

Этот документ не описывает source-based local development и внутренние debug-workflow.

---

## 4) Установка Qdrant

### Быстрый старт через Docker

```bash
docker volume create qdrant_storage

docker run -d \
  --name qa-qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  -v qdrant_storage:/qdrant/storage \
  qdrant/qdrant:v1.10.1
```

Проверка health:

```bash
curl http://localhost:6333/healthz
```

Ожидаемый ответ:

```json
{"status":"ok"}
```

---

## 5) Настройка AI retrieval

### 5.1 Укажите репозитории для индексации

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisRepositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": [
      { "id": "backend", "name": "Backend", "url": "backend/src" },
      { "id": "frontend", "name": "Frontend", "url": "frontend" }
    ]
  }'
```

### 5.2 Выберите vector provider

Сейчас поддерживаются:

- `memory`
- `in-memory`
- `local-ann`
- `qdrant`

Пример для memory:

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisVectorProvider \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "value": "memory" }'
```

Пример для Qdrant:

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisVectorProvider \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "value": "qdrant" }'
```

Если Qdrant или сеть недоступны, retrieval автоматически переключится на deterministic fallback и вернёт предупреждение в `warnings`.

### 5.2.1 Переменные окружения для Qdrant adapter

```env
AI_ANALYSIS_QDRANT_URL=http://127.0.0.1:6333
AI_ANALYSIS_QDRANT_API_KEY=
AI_ANALYSIS_QDRANT_TIMEOUT_MS=3000
AI_ANALYSIS_QDRANT_COLLECTION_PREFIX=qa_report_ai
```

### 5.3 Запустите индексацию

```bash
curl -X POST http://localhost:3001/ai-analysis/index/repositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{}'
```

### 5.4 Проверьте retrieval

```bash
curl -X POST http://localhost:3001/ai-analysis/retrieve/evidence \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "query": "timeout in payment retry middleware",
    "topK": 5,
    "minScore": 0.08
  }'
```

На что смотреть в ответе:

- `vectorProvider`
- `fallbackUsed`
- `warnings`
- `rankingReasons`
- `scoreBreakdown`

---

## 6) Почему выбран Qdrant

Основные причины:

1. Удобен для self-hosted сценария.
2. Изначально заточен под vector search и ANN.
3. Поддерживает metadata filtering рядом с vector query.
4. При проблемах с provider платформа может откатиться на lexical fallback.
5. Даёт хороший баланс между функциональностью, сложностью эксплуатации и стоимостью.

---

## 7) Практическая рекомендация по rollout

1. Начните с `memory` или `local-ann` в staging.
2. Проверьте качество retrieval и latency.
3. Затем подключайте Qdrant в rollout-план.
4. В production отслеживайте `fallbackUsed` и `warnings`.
5. При деградации быстро переключайтесь обратно на fallback через `aiAnalysisVectorProvider`.
