# Подключение LLM

AI-модуль использует LLM для формирования объяснений при анализе сбоев и рекомендаций по покрытию. Без настроенного LLM система работает в **детерминированном резервном режиме** — она по-прежнему возвращает структурированные результаты на основе лексического поиска и эвристической оценки, но без объяснений на естественном языке.

## Поддерживаемые провайдеры

| Провайдер | Примеры моделей | Примечания |
|----------|---------------|-------|
| OpenAI | `gpt-4.1-mini`, `gpt-4o` | Требуется API-ключ |
| Anthropic | `claude-sonnet-4-20250514` | Требуется API-ключ |
| Google Gemini | `gemini-2.5-pro` | Требуется API-ключ |
| Azure OpenAI | Имя вашего развёртывания | Требуется URL эндпоинта + API-ключ |
| Локальный (Ollama) | `llama3`, `codellama` | Self-hosted, API-ключ не нужен |
| Локальный (LM Studio) | Любая загруженная модель | Self-hosted, API-ключ не нужен |
| Пользовательский API | Любой OpenAI-совместимый | Требуется URL эндпоинта |

## Настройка через Settings UI

1. Откройте **Settings** в боковой панели
2. Перейдите на вкладку **AI Analysis**
3. В разделе **LLM connection** выберите **Provider** из выпадающего списка
4. Заполните:
   - **Model** — идентификатор модели (например, `gpt-4.1-mini`)
   - **API Key** — API-ключ вашего провайдера (оставьте пустым для локальных моделей)
   - **Endpoint URL** — обязателен для Azure, Ollama, LM Studio или пользовательских API
5. Настройте чекбоксы **Analysis scope**, чтобы управлять использованием LLM:
   - Суммировать упавшие тесты
   - Предлагать вероятные первопричины
   - Генерировать шаги по исправлению
   - Включить анализ нестабильных тестов
6. Нажмите **Save LLM Settings**
7. Нажмите **Test Connection** для проверки доступности LLM — результат покажет задержку и имя модели

## Настройка через API

```bash
# Save full LLM connection settings
curl -X POST http://localhost:3001/settings/aiLlmConnection \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": {
      "provider": "openai",
      "model": "gpt-4.1-mini",
      "apiKey": "sk-...",
      "endpointUrl": "",
      "analysisScope": {
        "summarizeFailedTests": true,
        "suggestRootCauses": true,
        "generateRemediation": false,
        "flakyTestAnalysis": false
      }
    }
  }'

# Test the connection
curl -X POST http://localhost:3001/ai-analysis/llm/test-connection \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>"
```

## Настройка локального LLM (Ollama)

Если вы предпочитаете запускать модель локально:

```bash
# 1. Install Ollama (https://ollama.ai)
# 2. Pull a model
ollama pull llama3

# 3. Ollama runs on http://localhost:11434 by default
# 4. In Settings UI, select "Local (Ollama/LM Studio)"
#    - Endpoint URL: http://localhost:11434
#    - Model: llama3
```

## Настройка локального LLM (LM Studio)

[LM Studio](https://lmstudio.ai/) — это десктопное приложение для запуска open-source LLM локально со встроенным OpenAI-совместимым API-сервером.

### 1. Установите и загрузите модель

1. Скачайте LM Studio с [lmstudio.ai](https://lmstudio.ai/) (Windows, macOS, Linux)
2. Откройте приложение, перейдите на вкладку **Discover**
3. Найдите и загрузите модель — рекомендуемые варианты для QA-анализа:
   - `Qwen2.5-Coder-7B-Instruct` — хороший баланс скорости и качества для анализа кода
   - `Mistral-7B-Instruct` — универсальная, быстрая
   - `CodeLlama-13B-Instruct` — лучшее понимание кода, требует больше оперативной памяти
   - `Llama-3-8B-Instruct` — надёжная универсальная модель

### 2. Запустите локальный сервер

1. Перейдите на вкладку **Developer** (или **Local Server** в более ранних версиях)
2. Загрузите скачанную модель
3. Нажмите **Start Server**
4. По умолчанию сервер запускается на `http://localhost:1234`
5. Проверьте, что он работает:

```bash
curl http://localhost:1234/v1/models
# Should return a JSON list with your loaded model
```

### 3. Настройте в QA Report Platform

**Через Settings UI:**

1. Откройте **Settings > AI Analysis**
2. Выберите провайдер: **Local (Ollama / LM Studio)**
3. Укажите:
   - **Endpoint URL:** `http://localhost:1234`
   - **Model:** идентификатор модели из ответа `/v1/models` (например, `qwen2.5-coder-7b-instruct`)
   - **API Key:** оставьте пустым (не требуется для локального сервера)
4. Нажмите **Save LLM Settings**
5. Нажмите **Test Connection** для проверки — должно отобразиться успешное подключение с именем модели и задержкой

**Через API:**

```bash
curl -X POST http://localhost:3001/settings/aiLlmConnection \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": {
      "provider": "local",
      "model": "qwen2.5-coder-7b-instruct",
      "apiKey": "",
      "endpointUrl": "http://localhost:1234"
    }
  }'
```

### Советы

- **Требования к оперативной памяти:** модели 7B требуют ~8 ГБ, модели 13B — ~16 ГБ. Учитывайте это, если запускаете модель одновременно с платформой.
- **GPU-ускорение:** LM Studio автоматически использует GPU при наличии (CUDA/Metal). Это значительно ускоряет время ответа.
- **Контекстное окно:** для анализа сбоев с контекстом кода рекомендуется модель с контекстным окном не менее 4K. Большинство современных моделей поддерживают 8K+.
- **Примечание для Docker:** если платформа работает в Docker, а LM Studio запущен на хосте, используйте `http://host.docker.internal:1234` в качестве URL эндпоинта вместо `localhost`.

## Детерминированный резервный режим

Когда LLM не настроен, система всё равно работает:

- **Анализ сбоев** — возвращает результаты, ранжированные по доказательствам из индекса кода, с эвристическими гипотезами о первопричинах
- **Оценка покрытия** — полностью детерминированная, LLM не используется
- **Рекомендации по покрытию** — генерирует шаблонные сценарные наброски на основе анализа пробелов

В поле `model` в ответах API будет указано `deterministic-fallback-v1` при работе без LLM.

## Проверка подключения

После настройки запустите тестовый анализ:

```bash
curl -X POST http://localhost:3001/ai-analysis/failures/analyze \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "runId": 1,
    "resultId": "test-uuid",
    "failureMessage": "Expected 200 but got 500"
  }'
```

Поле `model` в ответе подтверждает, какая модель была использована.
