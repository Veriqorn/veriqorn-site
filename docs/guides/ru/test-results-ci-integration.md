# Передача результатов автотестов в Veriqorn

Эта инструкция поможет отображать в Veriqorn каждый прогон автотестов. Задача тестирования создаёт каталог `allure-results`, а финальный шаг CI упаковывает его и отправляет на платформу.

## Выберите вариант интеграции

| Вариант | Когда подходит | Как работает |
|---|---|---|
| Прямая загрузка из CI | Для большинства команд | Добавьте шаг загрузки после команды запуска тестов. |
| Существующий скрипт или runner | Для команд со своими инструментами | Выполните ту же команду `curl` после создания результатов. |
| Pipeline Test Rerun | Для повторного запуска выбранных тестов из Veriqorn | Настройте [Test Rerun](test-rerun-setup.md): CI вернёт результат в исходный прогон. |

Первые два варианта создают новый прогон для каждого запуска. Для повторного запуска используйте `parentRunId`, как описано в инструкции Test Rerun.

## Перед началом

- Платформа запущена и доступна из CI runner.
- Тестовый фреймворк сохраняет Allure-результаты в `allure-results/`.
- Учётные данные для загрузки хранятся только в хранилище секретов CI. Не добавляйте в репозиторий пароли, cookie или архивы с результатами.

## Загружайте результаты после запуска тестов

Нормализованный endpoint импорта принимает один файл Allure или ZIP-архив. Выполняйте этот шаг после тестов; `if: always()` или аналогичное условие важно, чтобы передавать и упавшие тесты.

```bash
zip -r allure-results.zip allure-results/

curl --fail-with-body -X POST "$VERIQORN_URL/api/v1/projects/default/imports/allure-jobs" \
  -b "$VERIQORN_COOKIE_FILE" \
  -F "file=@allure-results.zip" \
  -F "runName=$CI_RUN_NAME" \
  -F "sourceKind=ci_archive" \
  -F "branch=$CI_BRANCH" \
  -F "environment=$CI_ENVIRONMENT"
```

Замените `default` на идентификатор своего проекта. `runName` — название прогона, которое увидит команда в Veriqorn.

При первоначальной настройке получите файл cookie запросом на создание сессии:

```bash
curl --fail-with-body -c "$VERIQORN_COOKIE_FILE" \
  -X POST "$VERIQORN_URL/api/v1/auth/session" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$VERIQORN_EMAIL\",\"password\":\"$VERIQORN_PASSWORD\"}"
```

Используйте отдельную неперсональную учётную запись и храните её пароль в секретах CI.

## Пример GitHub Actions

Добавьте в настройки репозитория или организации секреты `VERIQORN_URL`, `VERIQORN_EMAIL` и `VERIQORN_PASSWORD`.

```yaml
- name: Run tests
  run: npm test
  continue-on-error: true

- name: Upload Allure results to Veriqorn
  if: always()
  env:
    VERIQORN_URL: ${{ secrets.VERIQORN_URL }}
    VERIQORN_EMAIL: ${{ secrets.VERIQORN_EMAIL }}
    VERIQORN_PASSWORD: ${{ secrets.VERIQORN_PASSWORD }}
  run: |
    curl --fail-with-body -c veriqorn.cookies \
      -X POST "$VERIQORN_URL/api/v1/auth/session" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$VERIQORN_EMAIL\",\"password\":\"$VERIQORN_PASSWORD\"}"
    zip -r allure-results.zip allure-results/
    curl --fail-with-body -X POST "$VERIQORN_URL/api/v1/projects/default/imports/allure-jobs" \
      -b veriqorn.cookies \
      -F "file=@allure-results.zip" \
      -F "runName=${{ github.workflow }} #${{ github.run_number }}" \
      -F "sourceKind=ci_archive" \
      -F "branch=${{ github.ref_name }}"
```

В GitLab CI, Jenkins, Azure Pipelines или self-hosted runner добавьте те же команды в `after_script`, post-build action или последний шаг pipeline.

## Проверьте результат и устраните неполадки

После завершения CI откройте **Запуски**. Должен появиться новый прогон с названием, веткой и импортированными тестами.

| Симптом | Что проверить |
|---|---|
| Загрузка пропущена после падения теста | Сделайте шаг безусловным: `if: always()`, `after_script` или аналог. |
| Нет каталога `allure-results` | Настройте reporter и убедитесь, что каталог создан до архивации. |
| Ответ 401 или 403 | Проверьте учётные данные CI и доступность URL платформы из runner. |
| Прогон появился не в том проекте | Замените `default` в endpoint на правильный ID проекта. |
