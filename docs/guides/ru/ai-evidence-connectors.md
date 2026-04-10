# Коннекторы доказательств

Коннекторы доказательств позволяют AI-модулю получать дополнительный контекст из внешних инструментов мониторинга при анализе сбоев тестов.

## Поддерживаемые коннекторы

| Коннектор | Назначение | Токен лицензии |
|-----------|------------|----------------|
| **Kibana** | Логи приложения, обнаружение записей в логах | `connector:kibana` |
| **Sentry** | Ошибки, стек-трейсы, отслеживание проблем | `connector:sentry` |
| **Grafana** | Метрики, дашборды, телеметрия алертов | `connector:grafana` |
| **Logs** | Универсальный эндпоинт для логов от кастомных провайдеров | `retrieval` |

## Настройка через интерфейс

1. Откройте **Settings > AI Analysis**
2. Прокрутите до раздела **Connector Settings**
3. Для каждого коннектора (Kibana, Sentry, Grafana, Logs):
   - Переключите **тумблер включения** в правой части карточки коннектора
   - При включении появляются поля ввода:
     - **Endpoint URL** — базовый URL вашего сервиса (например, `https://kibana.internal.company.com`)
     - **API Key** — необязательный ключ аутентификации для сервиса
   - Нажмите **Test Connection** для проверки соединения — отображается статус (успех/ошибка) и задержка
4. Нажмите **Save Connectors** для сохранения всех настроек коннекторов

## Настройка через API

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisEvidenceConnectors \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": [
      {
        "id": "kibana-prod",
        "type": "kibana",
        "name": "Production Kibana",
        "endpointUrl": "https://kibana.internal.company.com",
        "enabled": true
      },
      {
        "id": "sentry-main",
        "type": "sentry",
        "name": "Sentry",
        "endpointUrl": "https://sentry.io/api/0",
        "enabled": true
      },
      {
        "id": "grafana-prod",
        "type": "grafana",
        "name": "Grafana",
        "endpointUrl": "https://grafana.internal.company.com",
        "enabled": false
      }
    ]
  }'
```

## Тестирование коннектора

```bash
curl -X POST http://localhost:3001/ai-analysis/connectors/test \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "type": "kibana",
    "endpointUrl": "https://kibana.internal.company.com",
    "enabled": true
  }'
```

Ответ:

```json
{
  "connectorType": "kibana",
  "status": "ok",
  "checkedAt": "2025-06-15T10:30:00Z",
  "message": "Endpoint is reachable and returned a valid response.",
  "normalizedEndpoint": "https://kibana.internal.company.com",
  "warnings": []
}
```

Возможные статусы:
- `ok` — эндпоинт доступен
- `invalid` — эндпоинт недоступен или вернул ошибку
- `disabled` — коннектор отключён в конфигурации

## Как используются коннекторы

При вызове `POST /ai-analysis/failures/analyze`:

1. Система собирает контекст сбоя (сообщение об ошибке, стек-трейс, история теста)
2. Выполняется поиск релевантных исходных файлов в индексе кода
3. Если коннекторы включены, система запрашивает у них дополнительные доказательства:
   - **Kibana** — поиск записей в логах вокруг временной метки сбоя
   - **Sentry** — поиск соответствующих событий ошибок
   - **Grafana** — проверка аномалий на дашбордах метрик
4. Все доказательства объединяются, ранжируются по релевантности и возвращаются в ответе

## Требования к коннекторам

Каждый коннектор требует соответствующий токен лицензии. Без токена эндпоинт коннектора возвращает `403 AI_PRO_REQUIRED`.

| Коннектор | Необходимый токен лицензии |
|-----------|---------------------------|
| Kibana | `connector:kibana` или `connector:all` или `*` |
| Sentry | `connector:sentry` или `connector:all` или `*` |
| Grafana | `connector:grafana` или `connector:all` или `*` |
| Logs | `retrieval` или `*` |
