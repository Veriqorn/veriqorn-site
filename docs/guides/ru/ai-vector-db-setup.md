# AI Vector DB Setup (PostgreSQL + Qdrant)

Этот гайд описывает, как настроить хранение данных для AI retrieval в QA Report Platform:

- **PostgreSQL** — основная БД платформы (настройки, каталоги, метаданные).
- **Qdrant** — векторная БД для ANN/semantic retrieval (production-ориентированный выбор).

---

## 1) Что где хранится

| Компонент | Что хранит | Где используется |
|---|---|---|
| PostgreSQL | системные настройки, лицензия, индекс-каталог | `settings`, `index/repositories`, `index/catalog` |
| Qdrant | dense-вектора чанков и ANN индекс | `retrieve/evidence`, `failures/analyze` |

Ключевые settings-ключи:
- `aiAnalysisRepositories`
- `aiAnalysisVectorProvider`
- `aiAnalysisIndexCatalog`
- `aiAnalysisLicense`

---

## 2) Предусловия

1. Поднят backend (`http://localhost:3001`) и frontend (`http://localhost:3000`).
2. Активирована AI Pro лицензия (минимум фичи `indexing` и `retrieval`).
3. Указан `AI_ANALYSIS_MONOREPO_ROOT` (корень исходников для индексации).

См. также:
- [AI Module Overview](./ai-module-overview.md)
- [Repository Indexing](./ai-repository-indexing.md)
- [Activating Pro License](./ai-pro-license.md)

---

## 3) Установка и подключение PostgreSQL

### Вариант A (рекомендуется для локальной разработки)

Использовать существующий compose:

```bash
docker-compose -f docker-compose.dev.yml up
```

В `docker-compose.dev.yml` backend уже получает:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/test_ops
```

### Вариант B (локальный PostgreSQL без Docker)

Пример для `backend/.env`:

```env
DATABASE_URL=postgres://user:password@localhost:5432/qa_report
JWT_SECRET=supersecret
AI_ANALYSIS_MONOREPO_ROOT=C:/path/to/your/monorepo
```

После этого:

```bash
npm install --prefix backend
npm run migration:run --prefix backend
npm run dev --prefix backend
```

---

## 4) Установка Qdrant

### Быстрый запуск через Docker

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

Ожидается:

```json
{"status":"ok"}
```

---

## 5) Настройка AI retrieval

### 5.1 Указать репозитории для индексации

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

### 5.2 Выбрать vector provider

Сейчас в сервисе поддержаны провайдеры:
- `memory`
- `in-memory`
- `local-ann`
- `qdrant`

Пример:

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

Если Qdrant/сеть недоступны, retrieval автоматически перейдёт в deterministic fallback и добавит предупреждение в `warnings`.

### 5.2.1 ENV для Qdrant adapter

```env
AI_ANALYSIS_QDRANT_URL=http://127.0.0.1:6333
AI_ANALYSIS_QDRANT_API_KEY=
AI_ANALYSIS_QDRANT_TIMEOUT_MS=3000
AI_ANALYSIS_QDRANT_COLLECTION_PREFIX=qa_report_ai
```

### 5.3 Запустить индексацию

```bash
curl -X POST http://localhost:3001/ai-analysis/index/repositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{}'
```

### 5.4 Проверить retrieval

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

## 6) Почему выбор пал на Qdrant (а не на другую БД)

Ниже — отдельная архитектурная аргументация.

### Ключевые причины

1. **Self-hosted friendly**
   - Лёгкий запуск (один контейнер), простой операционный контур.
   - Хорошо подходит под on-prem и требования data residency.

2. **Сильный фокус на векторном поиске**
   - Qdrant изначально проектировался под ANN/HNSW, а не как "добавка" к OLTP БД.
   - Предсказуемая производительность на retrieval-нагрузках.

3. **Payload-фильтрация рядом с векторами**
   - Удобно фильтровать по метаданным (репозиторий, путь, язык, теги) в том же запросе, где идёт similarity search.

4. **Прозрачный rollback-сценарий**
   - В нашей архитектуре при проблемах с vector provider retrieval не падает, а уходит в lexical fallback.
   - Это снижает операционный риск при rollout.

5. **Баланс "функциональность/простота/стоимость"**
   - Для self-hosted Pro сценария даёт хороший trade-off без обязательной привязки к managed SaaS.

### Краткое сравнение альтернатив

| Вариант | Плюсы | Ограничения в нашем контексте |
|---|---|---|
| **Qdrant** | Специализация на ANN, payload-фильтры, простой self-hosting | Нужно отдельно поддерживать vector-сервис |
| **pgvector (PostgreSQL)** | Одна БД для всего, простой старт | OLTP + heavy vector search в одном контуре может сложнее масштабироваться |
| **OpenSearch kNN** | Мощный экосистемный стек | Тяжелее в эксплуатации для нашего use-case |
| **Weaviate** | Богатые ML-возможности | Сложнее operational footprint, чем нужно на этом этапе |
| **Managed (Pinecone и т.п.)** | Минимум ops | Vendor lock-in и требования по внешнему хранению данных |

---

## 7) Практическая рекомендация по rollout

1. Начать с `memory`/`local-ann` в staging.
2. Проверить качество retrieval и latency.
3. Поднять Qdrant и включить его в rollout-план.
4. На проде мониторить `fallbackUsed` и `warnings`.
5. При деградации быстро откатываться на lexical fallback через `aiAnalysisVectorProvider`.

Это соответствует текущей модели безопасного внедрения AI retrieval в платформе.

---

## 8) Алгоритм чанкирования: как именно режется код

В текущей реализации используется гибрид:

- **AST-aware heuristic chunking** для TS/JS (разбиение по declaration boundaries)
- **char-window fallback** для остальных файлов/случаев

Базовая схема:
1. Текст файла нормализуется по переводам строк (`\r\n` -> `\n`) и trim.
2. Для TS/JS индексатор сначала ищет структурные declaration-блоки.
3. Если AST-aware путь не применим, используется char-window:
   - размер окна = `chunkSizeChars`
   - шаг = `chunkSizeChars - chunkOverlapChars`
4. Каждый непустой блок становится чанком.

Пример:
- `chunkSizeChars = 1200`
- `chunkOverlapChars = 180`
- шаг = `1020`

Это даёт перекрытие контекста, чтобы важные фрагменты на границе чанков не терялись.

### Как обеспечивается стабильность индекса

Для каждого чанка формируется детерминированный `chunkId` на основе:
- `repositoryId`
- `filePath`
- `chunkIndex`
- `sha1` самого чанка

Из этого следует: при одинаковом входном коде и параметрах индексации вы получаете одинаковые chunk ID.

### Какие метаданные добавляются к чанку

Кроме текста, сохраняются:
- `language` (по расширению файла),
- `pathTokens` (токены пути/сегментов),
- `symbolHints` (подсказки по символам: классы/функции/вызовы),
- `chunkingMode`, `astEntityType`, `astEntityName`,
- `summary`, `summaryVersion`,
- `sha1`, `charCount`.

Эти поля используются на этапе ранжирования и explainability.

Дополнительно каталог включает `symbolGraph` (nodes/edges) для graph-expansion канала retrieval.

---

## 9) Как работает сортировка и обработка retrieval-данных

Ниже end-to-end pipeline для `POST /ai-analysis/retrieve/evidence`:

1. **Нормализация запроса**
   - Приведение к lower-case и токенам.
   - Валидация `topK`, `minScore`.

2. **Фильтрация кандидатов**
   - По `repositoryIds` и `filePathPrefixes` (если заданы).

3. **Восстановление текста чанков**
   - Для отфильтрованных метаданных сервис читает файл и воспроизводит чанк по `chunkIndex`.

4. **BM25 stage**
   - Взвешенный lexical relevance (BM25).

5. **Vector stage (если провайдер включен)**
   - Upsert эмбеддингов кандидатов.
   - ANN-поиск по запросу.
   - Таймауты на vector-операции + fail-safe fallback.
   - Если провайдер не отвечает/неподдержан/вернул пусто — включается lexical fallback.

6. **Hint и graph каналы**
   - `pathHints`/`symbolHints` boosts,
   - graph expansion через `symbolGraph`.

7. **RRF fusion**
   - Reciprocal Rank Fusion объединяет все активные каналы.

8. **Optional reranker**
   - Дополнительный rerank stage (heuristic/http provider).

9. **Порог и explainability**
   - Отбрасывание по `minScore`.
   - Формирование:
     - `rankingReasons[]`
     - `scoreBreakdown { lexical/bm25, vector, pathBoost, symbolBoost, graphBoost, fusion, rerank, final }`

10. **Детерминированная сортировка**
   - Сначала по score (desc),
   - затем tie-breakers: `repositoryId` -> `filePath` -> `chunkIndex`.

11. **Наблюдаемость**
   - В ответ включаются `stageFlags` и `stageTimingsMs`.

Это важно для повторяемости: при одинаковых входах порядок стабильный.

---

## 10) Правда ли, что универсальный алгоритм “на все проекты” сделать сложно?

**Короткий ответ: да, это правда.**

Причина: релевантность сильно зависит от:
- языка (TS/Java/Python/Go и т.д.),
- фреймворка (Spring/Nest/React и др.),
- архитектурного стиля (монолит/микросервисы),
- стиля кодирования команды (именование, размер файлов, глубина абстракций).

Поэтому "идеальный" чанкер/ранкер обычно **настраиваемый**, а не универсальный.

Что можно сделать универсально:
- дать безопасный baseline,
- обеспечить explainability,
- добавить quality-метрики и итеративный тюнинг.

Именно так сделано в текущем модуле.

---

## 11) Как подтюнить retrieval под ваш проект

Ниже практические рычаги тюнинга.

### 11.1 Параметры чанкирования

- Увеличивайте `chunkSizeChars` (например 1400–2000), если:
  - код часто разбросан по длинным блокам,
  - важный контекст не помещается в 1200 символов.

- Увеличивайте `chunkOverlapChars` (например 220–320), если:
  - много релевантных совпадений теряется на границе чанков.

- Уменьшайте размер чанка (800–1100), если:
  - файлы очень плотные,
  - выдача часто слишком "размытая" по теме.

### 11.2 Настройка поиска

- `topK`:
  - triage UI обычно 5–8,
  - для глубокой диагностики 10–15.

- `minScore`:
  - повышайте (например до 0.12–0.18), чтобы уменьшить шум,
  - понижайте (0.05–0.08), если релевантные чанки пропускаются.

### 11.3 Репозиторный scope

- Держите `aiAnalysisRepositories` точным (без лишних директорий).
- Исключайте шумные зоны (`generated`, временные артефакты, vendor-код).

### 11.4 Подсказки из failure signals

- Чем качественнее `pathHints` и `symbolHints`, тем лучше ранжирование.
- Для нестандартных стектрейсов полезно дообогащать/нормализовать parser rules.

### 11.5 Оценка качества после каждого тюнинга

Используйте evaluation harness:
- `precision`
- `rootCausePrecision`
- `recallAtK`
- `rankingStability`
- `ndcgAtK`
- `mrr`
- `averageLatencyMs`

Тюнинг считается успешным, если выросли `recallAtK`/`precision`, а `rankingStability` не деградировал существенно.

### 11.6 Рекомендуемая стратегия

1. Зафиксируйте baseline на реальных failure-кейсах.
2. Меняйте один параметр за раз.
3. Прогоняйте evaluation на том же датасете.
4. Закрепляйте изменения только при измеримом улучшении.
