# Индексация репозиториев

Индексация репозиториев сканирует исходный код вашего проекта, применяет AST-совместимое (эвристическое) разбиение для файлов с кодом и создаёт каталог с возможностью поиска. Этот каталог используется для:

- **Анализа сбоев** — поиск релевантного кода при падении теста
- **Интеллектуального покрытия** — сопоставление тестов с единицами покрытия на уровне кода

## Предварительные требования

- Активна лицензия AI Pro ([см. руководство по активации](./ai-pro-license.md))
- Токен функции `indexing` в вашей лицензии

## Шаг 1. Укажите корень монорепозитория

Сообщите платформе, где находится ваш исходный код:

```env
AI_ANALYSIS_MONOREPO_ROOT=/path/to/your/project
```

Это базовая директория, от которой разрешаются относительные пути репозиториев. Если не задана, используется рабочая директория процесса backend.

## Шаг 2. Зарегистрируйте репозитории

Репозитории определяют область индексации. Зарегистрируйте их через интерфейс настроек или API:

### Через интерфейс настроек

1. Откройте **Settings > AI Analysis**
2. В разделе **Repository Context** нажмите **Add Repository**
3. Заполните:
   - **ID** — уникальный идентификатор (например, `backend`, `frontend`)
   - **Name** — человекочитаемое название
   - **Path/URL** — относительный путь от корня монорепозитория (например, `backend/src`)
4. Сохраните

### Через API

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisRepositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": [
      { "id": "backend", "name": "Backend", "url": "backend/src" },
      { "id": "frontend", "name": "Frontend", "url": "frontend" },
      { "id": "tests", "name": "E2E Tests", "url": "test" }
    ]
  }'
```

## Шаг 3. Запустите индексацию

### Через API

```bash
curl -X POST http://localhost:3001/ai-analysis/index/repositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{}'
```

С пользовательскими параметрами:

```bash
curl -X POST http://localhost:3001/ai-analysis/index/repositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "repositoryIds": ["backend"],
    "chunkSizeChars": 1500,
    "chunkOverlapChars": 200,
    "maxFileSizeBytes": 500000
  }'
```

### Ответ

```json
{
  "status": "ready",
  "generatedAt": "2025-06-15T10:30:00Z",
  "repositories": [
    {
      "repositoryId": "backend",
      "repositoryName": "Backend",
      "status": "indexed",
      "indexedFiles": 87,
      "skippedFiles": 3,
      "chunkCount": 142,
      "errors": []
    }
  ],
  "totalChunks": 142,
  "totalIndexedFiles": 87,
  "totalSkippedFiles": 3,
  "catalogKey": "aiAnalysisIndexCatalog"
}
```

## Параметры индексации

| Параметр | По умолчанию | Диапазон | Описание |
|----------|--------------|----------|----------|
| `chunkSizeChars` | 1200 | 200–4000 | Количество символов на чанк |
| `chunkOverlapChars` | 180 | 0–(chunkSize-1) | Перекрытие между соседними чанками |
| `maxFileSizeBytes` | 200,000 | 1,024–2,000,000 | Пропускать файлы размером больше указанного |

## Что индексируется

**Включённые расширения файлов:**
`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.json`, `.yml`, `.yaml`, `.md`, `.sql`, `.ps1`, `.sh`

**Игнорируемые директории:**
`node_modules`, `.git`, `.next`, `.turbo`, `dist`, `build`, `coverage`, `artifacts`, `allure-results`, `uploads`, `temp`

**Лимит на репозиторий:** максимум 2 000 файлов.

## Просмотр каталога индекса

```bash
curl http://localhost:3001/ai-analysis/index/catalog \
  -b "auth_token=<jwt>"
```

Возвращает полный каталог с метаданными чанков по каждому файлу, полезно для отладки.

Начиная с EPIC-603, метаданные каталога также включают:

- `schemaVersion`
- `chunkingMode` (`char-window` или `ast-heuristic`)
- Поля семантического резюме (`summary`, `summaryVersion`)
- Граф символов (`symbolGraph.nodes`, `symbolGraph.edges`)

## Переиндексация

Запустите `POST /ai-analysis/index/repositories` повторно в любое время. Каталог полностью заменяется при каждом запуске. Инкрементальная индексация отсутствует — каждый запуск заново сканирует всю область.

**Когда переиндексировать:**
- После значительных изменений в коде
- После добавления новых репозиториев
- После изменения параметров разбиения на чанки

## Поиск

После индексации каталог автоматически используется следующими эндпоинтами:

- `POST /ai-analysis/failures/analyze` — находит релевантный код для контекста сбоя
- `POST /ai-analysis/retrieve/evidence` — прямой поиск доказательств

### Тестирование поиска

```bash
curl -X POST http://localhost:3001/ai-analysis/retrieve/evidence \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "query": "upload allure results timeout",
    "topK": 5,
    "minScore": 0.1
  }'
```

### Параметры поиска

| Параметр | По умолчанию | Максимум | Описание |
|----------|--------------|----------|----------|
| `topK` | 5 | 25 | Количество возвращаемых результатов |
| `minScore` | 0.08 | - | Минимальный порог релевантности (0–1) |
| `repositoryIds` | все | - | Фильтрация по конкретным репозиториям |
| `filePathPrefixes` | нет | - | Фильтрация по конкретным директориям |
| `stageOverrides` | нет | - | Переключатели стадий для конкретного запроса: `bm25`, `vector`, `graphExpansion`, `rerank`, `summaries` |

Ответ поиска теперь включает:

- `stageFlags` — разрешённые runtime-флаги стадий поиска
- `stageTimingsMs` — диагностика времени выполнения по каждой стадии

## Векторный провайдер

По умолчанию поиск использует **лексический fallback** (сопоставление на основе токенов).

Доступные runtime-провайдеры:
- `memory`
- `in-memory`
- `local-ann`
- `qdrant`

Настройка провайдера через настройки/API:

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisVectorProvider \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "value": "memory" }'
```

Для планирования production-развёртывания с Qdrant и топологией PostgreSQL см.:
- [Настройка AI Vector DB (PostgreSQL + Qdrant)](./ai-vector-db-setup.md)

Пример поэтапного развёртывания (с безопасным fallback-поведением):

```env
AI_ANALYSIS_VECTOR_PROVIDER=qdrant
```

Когда настроенный провайдер недоступен, система автоматически переключается на лексическое сопоставление и добавляет предупреждение в ответ.
