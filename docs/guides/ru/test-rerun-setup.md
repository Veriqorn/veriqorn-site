# Перезапуск тестов — руководство по настройке

QA Report Platform позволяет перезапускать упавшие или выбранные тесты прямо со страницы запуска. Новые результаты заменяют старые **в том же запуске** — отдельные дочерние запуски не создаются.

Данное руководство объясняет, как настроить конвейер перезапуска от начала до конца.

---

## Предварительные требования

- Backend платформы запущен и миграции применены (таблица `test_rerun_job` должна существовать).
- Хотя бы один проект с импортированными результатами тестов (чтобы было из чего перезапускать).
- CI-система (GitHub Actions, GitLab CI, Jenkins и т.д.), способная принимать webhook-триггеры, — **или** локальный агент перезапуска тестов.

---

## Шаг 1 — Откройте настройки перезапуска

1. Перейдите в **Settings** в левой боковой панели.
2. Нажмите **Test Rerun** в навигации настроек.
3. Выберите **проект** в выпадающем списке «Project scope» (настройки хранятся отдельно для каждого проекта).

---

## Шаг 2 — Создайте профиль выполнения

Каждому проекту нужен хотя бы один профиль выполнения, который сообщает платформе, *как* запускать ваши тесты.

### Поля профиля

| Поле | Описание | Пример |
|------|----------|--------|
| **Profile name** | Человекочитаемое название | `Playwright CI Rerun` |
| **Framework** | Тестовый фреймворк, используемый в проекте | `playwright`, `junit` или `testng` |
| **Execution mode** | Как платформа запускает перезапуск | `ci-webhook` или `agent` |
| **Trigger mode** | Запускать только выбранные тесты или полный пайплайн | `tests_only` или `full_pipeline` |
| **Command template** | Shell-команда с плейсхолдерами (см. ниже) | `npx playwright test --grep "{{selectorExpression}}"` |
| **CI trigger URL** | URL вебхука, который слушает ваша CI-система (для режима `ci-webhook`) | `https://ci.example.com/api/trigger` |
| **Enabled** | Переключатель для включения/выключения профиля | включён |
| **Active profile** | Радиокнопка — какой профиль использовать при наличии нескольких | выбран |

### Плейсхолдеры шаблона команды

| Плейсхолдер | Заменяется на | Пример вывода |
|-------------|---------------|---------------|
| `{{selectorExpression}}` | Regex-совместимое выражение, объединяющее все выбранные имена/ID тестов | `Login test\|Logout test` |
| `{{selectorArgs}}` | Аргументы, разделённые пробелами | `--grep "Login test" --grep "Logout test"` |

### Примеры профилей

**Playwright (CI webhook):**
```
Profile name:     Playwright Rerun
Framework:        playwright
Execution mode:   ci-webhook
Trigger mode:     tests_only
Command template: npx playwright test --grep "{{selectorExpression}}"
CI trigger URL:   https://ci.example.com/api/pipelines/trigger
```

**JUnit (CI webhook):**
```
Profile name:     JUnit Rerun
Framework:        junit
Execution mode:   ci-webhook
Trigger mode:     tests_only
Command template: mvn test -Dtest="{{selectorExpression}}"
CI trigger URL:   https://jenkins.example.com/job/rerun/buildWithParameters
```

Нажмите **Save rerun settings** после заполнения профиля.

---

## Шаг 3 — Настройте CI для приёма вебхука

Когда вы нажимаете «Rerun» в интерфейсе, платформа отправляет `POST`-запрос на ваш **CI trigger URL** с таким JSON-телом:

```json
{
  "projectId": "my-project",
  "parentRunId": 42,
  "executionProfileId": "profile-uuid",
  "framework": "playwright",
  "triggerMode": "tests_only",
  "command": "npx playwright test --grep \"Login test|Logout test\"",
  "commandArgs": ["--grep", "Login test|Logout test"],
  "selectors": [
    { "kind": "testName", "value": "Login test", "testResultId": "uuid-1" },
    { "kind": "testName", "value": "Logout test", "testResultId": "uuid-2" }
  ]
}
```

Ваш CI-пайплайн должен:

1. Разобрать поле `command` и выполнить его (запустить тесты).
2. Собрать результаты Allure.
3. Загрузить результаты обратно на платформу **с `parentRunId`**, чтобы они объединились с исходным запуском.

### Загрузка результатов обратно (пример CI-скрипта)

```bash
# After tests finish and allure-results/ directory is ready:

zip -r allure-results.zip allure-results/

curl -X POST "https://your-platform.com/upload/ci/allure-results?projectId=my-project" \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -F "file=@allure-results.zip" \
  -F "runName=Rerun" \
  -F "parentRunId=42" \
  -F "projectId=my-project"
```

Ключевой момент: **`parentRunId`** сообщает эндпоинту загрузки, что нужно импортировать результаты в существующий запуск, а не создавать новый. Старые результаты для перезапущенных тестов (сопоставленные по имени теста) автоматически заменяются.

### Пример для GitHub Actions

```yaml
name: Test Rerun
on:
  repository_dispatch:
    types: [test-rerun]

jobs:
  rerun:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: ${{ github.event.client_payload.command }}
        continue-on-error: true

      - name: Upload results to platform
        run: |
          cd allure-results && zip -r ../allure-results.zip . && cd ..
          curl -X POST "${{ secrets.QA_PLATFORM_URL }}/upload/ci/allure-results?projectId=${{ github.event.client_payload.projectId }}" \
            -H "Cookie: access_token=${{ secrets.QA_PLATFORM_TOKEN }}" \
            -F "file=@allure-results.zip" \
            -F "runName=Rerun" \
            -F "parentRunId=${{ github.event.client_payload.parentRunId }}" \
            -F "projectId=${{ github.event.client_payload.projectId }}"
```

Для этого примера укажите **CI trigger URL** в профиле:
```
https://api.github.com/repos/OWNER/REPO/dispatches
```
И добавьте заголовки авторизации в поле CI Headers или используйте `ciHeaders` в API настроек.

---

## Шаг 4 — Перезапуск тестов из интерфейса

1. Откройте страницу деталей запуска (**Launches** > нажмите на запуск).
2. Переключитесь на вкладку **Tests**.
3. Выберите тесты для перезапуска:
   - **Один тест**: нажмите значок перезапуска рядом с результатом теста.
   - **Выбранные тесты**: отметьте несколько тестов чекбоксами, затем нажмите «Rerun selected».
   - **Все упавшие/сломанные**: нажмите «Rerun failed & broken».
4. В верхней части страницы появляется баннер прогресса с отображением статуса задания перезапуска.
5. Когда CI загрузит результаты с `parentRunId`, результаты тестов в текущем запуске **автоматически обновятся** — страница обновится и покажет новые результаты.

---

## Как это работает (поток данных)

```
 UI: click "Rerun"
       |
       v
 Backend: create rerun job (status: queued)
       |
       v
 Backend: POST webhook to CI trigger URL
       |  (payload includes parentRunId, command, selectors)
       v
 CI: runs the command, produces allure-results
       |
       v
 CI: uploads ZIP to /upload/ci/allure-results
       |  with parentRunId in the form data
       v
 Backend: deletes old results (by test name) from parent run
 Backend: imports new results into the same run
       |
       v
 UI: polls rerun job status, refreshes page on completion
```

---

## Режимы выполнения

### ci-webhook (рекомендуемый)

Платформа отправляет POST-запрос на URL триггера вашей CI-системы. CI запускает тесты и загружает результаты. Это наиболее распространённая настройка для команд с существующими CI-пайплайнами.

### agent

Платформа отправляет команду локальному агенту перезапуска тестов (настраивается через переменную окружения `TEST_RERUN_AGENT_ENDPOINT` на backend). Агент выполняет команду локально и загружает результаты. Полезно для локальной разработки или on-premise установок без CI с поддержкой вебхуков.

Задайте переменную окружения на backend:
```
TEST_RERUN_AGENT_ENDPOINT=http://localhost:4000/execute
```

---

## Устранение неполадок

| Симптом | Причина | Решение |
|---------|---------|---------|
| Ошибка «Failed to start rerun job» в интерфейсе | Таблица `test_rerun_job` не существует | Перезапустите backend — миграции выполняются автоматически при запуске |
| Задание перезапуска остаётся в статусе «queued» | Профиль выполнения не настроен или CI trigger URL пуст | Перейдите в Settings > Test Rerun и настройте профиль с CI trigger URL |
| Статус задания «failed» с сообщением «CI webhook returned HTTP 4xx» | CI отклонил вебхук | Проверьте CI trigger URL, заголовки авторизации и конфигурацию CI-пайплайна |
| Новые результаты появляются в отдельном запуске | CI загрузил без `parentRunId` | Обновите CI-скрипт, добавив `-F "parentRunId=..."` в вызов загрузки |
| «Agent endpoint is not configured» | Используется режим `agent` без переменной окружения `TEST_RERUN_AGENT_ENDPOINT` | Задайте переменную окружения или переключитесь на режим `ci-webhook` |

---

## Справочник API (для скриптов CI-интеграции)

### Загрузка с объединением в родительский запуск

```
POST /upload/ci/allure-results?projectId=<projectId>
Content-Type: multipart/form-data

Form fields:
  file          - ZIP-файл с allure-results
  runName       - Отображаемое имя (используется только при создании нового запуска)
  parentRunId   - (необязательно) ID существующего запуска для объединения
  projectId     - ID проекта
  environment   - (необязательно) Метка окружения
  branch        - (необязательно) Название ветки
  tags          - (необязательно) JSON-массив тегов
```

При указании `parentRunId`:
- Новый запуск не создаётся.
- Старые результаты тестов с совпадающими именами удаляются из родительского запуска.
- Новые результаты импортируются в родительский запуск.

При отсутствии `parentRunId`:
- Создаётся новый запуск (стандартное поведение загрузки).
