# Активация Pro-лицензии

AI-модуль работает в двух режимах:

- **`oss_stub`** (по умолчанию) — все AI-функции отключены, платформа работает как стандартный инструмент отчётности
- **`pro_self_hosted`** — AI-функции включены после верификации лицензии

## Шаг 1. Установите режим редакции

Добавьте в файл `.env` бэкенда:

```env
AI_ANALYSIS_DEFAULT_MODE=pro_self_hosted
```

Или настройте в рантайме через Settings API:

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisMode \
  -H "Content-Type: application/json" \
  -b "auth_token=<your-jwt>" \
  -d '{ "value": "pro_self_hosted" }'
```

## Шаг 2. Установите ключ верификации лицензии

Платформа проверяет лицензии с помощью криптографии на основе открытых ключей Ed25519/RSA. Укажите публичный ключ в переменной окружения:

```env
AI_ANALYSIS_LICENSE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
-----END PUBLIC KEY-----"
```

Ключ может быть предоставлен в формате PEM или как base64-закодированный SPKI (DER) блоб.

## Шаг 3. Установите лицензию

Лицензия представляет собой JSON-объект с подписанным содержимым:

```json
{
  "payload": {
    "licenseId": "lic_abc123",
    "customer": "Your Company",
    "issuedAt": "2025-01-01T00:00:00Z",
    "expiresAt": "2026-12-31T23:59:59Z",
    "features": ["*"]
  },
  "signature": "base64-encoded-signature"
}
```

### Через Settings UI (рекомендуется)

1. Откройте **Settings > General**
2. В разделе **Plan** нажмите **Activate License**
3. Вставьте полный JSON лицензии в текстовое поле
4. Нажмите **Activate**
5. При успешной активации статус лицензии обновится немедленно — баннер "Pro is locked" исчезнет и все AI-функции станут доступны

### Через API

```bash
# Using the activation endpoint (auto-sets mode to pro_self_hosted)
curl -X POST http://localhost:3001/ai-analysis/license/activate \
  -H "Content-Type: application/json" \
  -b "auth_token=<your-jwt>" \
  -d '{ "license": "{ \"payload\": {...}, \"signature\": \"...\" }" }'

# Or directly via Settings API
curl -X POST http://localhost:3001/settings/aiAnalysisLicense \
  -H "Content-Type: application/json" \
  -b "auth_token=<your-jwt>" \
  -d '{ "value": { "payload": {...}, "signature": "..." } }'
```

Эндпоинт активации автоматически устанавливает режим редакции в `pro_self_hosted`.

## Шаг 4. Проверка

```bash
curl http://localhost:3001/ai-analysis/capabilities \
  -b "auth_token=<your-jwt>"
```

Ожидаемый ответ:

```json
{
  "mode": "pro_self_hosted",
  "status": "licensed",
  "licensed": true,
  "features": {
    "analysis": { "enabled": true },
    "indexing": { "enabled": true },
    "retrieval": { "enabled": true },
    "kibanaConnector": { "enabled": true },
    "sentryConnector": { "enabled": true },
    "grafanaConnector": { "enabled": true }
  }
}
```

## Токены функций

Массив `features` в содержимом лицензии управляет тем, какие возможности включены:

| Токен | Эффект |
|-------|--------|
| `*` или `all` | Включает всё |
| `analysis` | AI-анализ сбоев |
| `indexing` | Индексация репозитория |
| `retrieval` | Семантический поиск доказательств |
| `connector:all` | Все коннекторы доказательств |
| `connector:kibana` | Только коннектор Kibana |
| `connector:sentry` | Только коннектор Sentry |
| `connector:grafana` | Только коннектор Grafana |

## Устранение неполадок

| Симптом | Причина | Решение |
|---------|-------|-----|
| `status: "stub"` | Режим `oss_stub` | Установите `AI_ANALYSIS_DEFAULT_MODE=pro_self_hosted` |
| `status: "invalid"` | Лицензия не настроена | Установите лицензию через Settings API |
| `status: "invalid"`, ошибка подписи | Неверный публичный ключ | Убедитесь, что `AI_ANALYSIS_LICENSE_PUBLIC_KEY` соответствует ключу подписи |
| `status: "expired"` | Лицензия истекла | Установите новую лицензию с будущей датой `expiresAt` |
| Функция показывает `enabled: false` | Токен отсутствует в лицензии | Добавьте необходимый токен функции в `payload.features` |

## URL для обновления (необязательно)

Чтобы отображать пользовательскую ссылку на обновление в UI, когда функции заблокированы:

```env
AI_ANALYSIS_UPGRADE_URL=https://your-company.com/upgrade
```
