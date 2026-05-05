# Индексация репозиториев

Индексация репозиториев сканирует исходный код вашего проекта, применяет AST-aware эвристическое разбиение для файлов с кодом и строит searchable catalog. Этот каталог используется для:

- **анализа сбоев** - поиска релевантного кода при падении теста
- **coverage intelligence** - сопоставления тестов с code-aware единицами покрытия

## Предварительные требования

- Активирована AI Pro лицензия
- В лицензии доступна функция `indexing`

## Шаг 1. Укажите корень кодовой базы

Сообщите платформе, где расположен ваш исходный код:

```env
AI_ANALYSIS_MONOREPO_ROOT=/path/to/your/project
```

Это базовая директория, относительно которой разрешаются относительные пути репозиториев. Если переменная не задана, используется рабочая директория backend-процесса.

В self-hosted Docker-установке задавайте это значение в окружении backend-контейнера. Оно должно указывать на директорию на сервере, где исходные репозитории реально доступны для индексации.

## Шаг 2. Зарегистрируйте репозитории

Репозитории определяют область индексации. Их можно зарегистрировать через Settings UI или API.

### Через Settings UI

1. Откройте **Settings > AI Analysis**.
2. В блоке **Repository Context** нажмите **Add Repository**.
3. Заполните поля:
   - **ID** - уникальный идентификатор, например `backend`
   - **Name** - человекочитаемое имя
   - **Path/URL** - относительный путь от `AI_ANALYSIS_MONOREPO_ROOT`, например `backend/src`
4. Сохраните изменения.

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

```bash
curl -X POST http://localhost:3001/ai-analysis/index/repositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{}'
```

С кастомными параметрами:

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

## Параметры индексации

| Параметр | По умолчанию | Описание |
|----------|--------------|----------|
| `chunkSizeChars` | 1200 | Размер чанка в символах |
| `chunkOverlapChars` | 180 | Перекрытие между соседними чанками |
| `maxFileSizeBytes` | 200000 | Файлы больше этого лимита пропускаются |

## Что индексируется

Включённые расширения:

`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.json`, `.yml`, `.yaml`, `.md`, `.sql`, `.ps1`, `.sh`

Игнорируемые директории:

`node_modules`, `.git`, `.next`, `.turbo`, `dist`, `build`, `coverage`, `artifacts`, `allure-results`, `uploads`, `temp`

Лимит на один репозиторий: до 2000 файлов.
