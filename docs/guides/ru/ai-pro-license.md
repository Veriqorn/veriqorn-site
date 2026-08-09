# Активация лицензии AI Pro

AI Pro работает без постоянного доступа к интернету. Каждая лицензия выдаётся
для одной установки Veriqorn: если скопировать её JSON-файл в другую компанию
или среду, AI Pro там не активируется.

## 1. Настройте ключ проверки

Контакт Veriqorn передаст публичный ключ проверки Ed25519. Укажите его в
окружении backend до активации лицензии:

```env
AI_ANALYSIS_LICENSE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...публичный ключ от Veriqorn...
-----END PUBLIC KEY-----"
```

После изменения переменных окружения перезапустите backend. Приватный ключ
подписи остаётся у Veriqorn и никогда не должен попадать в контур заказчика.

## 2. Экспортируйте запрос активации

Администратор открывает **Settings → General → Plan** и нажимает **Download
activation request**. Браузер скачивает файл
`veriqorn-activation-request.json` из установки, которая будет использовать AI
Pro.

Для автоматизированных сценариев доступен эквивалентный API-вызов:

```bash
curl http://localhost:3001/api/v1/ai/license-activation-request \
  -b "auth_token=<ваш-jwt>" \
  -o veriqorn-activation-request.json
```

Передайте этот JSON в Veriqorn по согласованному каналу поддержки. В нём есть
идентификатор установки и публичный ключ для привязки лицензии; в нём нет
результатов тестов, проектов или приватных ключей подписи.

Для другой production-, staging- или закрытой установки нужен отдельный
activation request и отдельная лицензия.

## 3. Получите и установите лицензию

Veriqorn возвращает подписанный envelope примерно такого вида:

```json
{
  "payload": {
    "version": 2,
    "licenseId": "lic_abc123",
    "customerId": "your-company",
    "customer": "Your Company",
    "issuedAt": "2026-08-09T00:00:00.000Z",
    "expiresAt": "2030-12-31T23:59:59.999Z",
    "features": ["analysis", "indexing", "retrieval", "connector:all"],
    "installationId": "installation-id",
    "installationKeyFingerprint": "installation-key-fingerprint"
  },
  "signature": "base64-signature"
}
```

В **Settings → General → Plan** нажмите **Activate License**, выберите JSON-файл
лицензии от Veriqorn и ещё раз нажмите **Activate License**. Вместо файла можно
вставить полный JSON в диалог. Для автоматизированных сценариев администратор
также может активировать лицензию через API:

```bash
curl -X POST http://localhost:3001/api/v1/ai/license-activations \
  -H "Content-Type: application/json" \
  -b "auth_token=<ваш-jwt>" \
  --data-binary @veriqorn-license.json
```

Активация автоматически включает режим `pro_self_hosted`.

## 4. Проверьте статус

```bash
curl http://localhost:3001/api/v1/ai/capabilities \
  -b "auth_token=<ваш-jwt>"
```

В ответе должны быть `"status": "licensed"` и функции, включённые в вашу
лицензию.

## Устранение неполадок

| Симптом | Что сделать |
|---|---|
| `status: "invalid"` и ошибка ключа проверки | Убедитесь, что `AI_ANALYSIS_LICENSE_PUBLIC_KEY` содержит ключ от Veriqorn, затем перезапустите backend. |
| `status: "invalid"` и сообщение о другой установке | Экспортируйте новый activation request из этой установки и запросите отдельную лицензию. |
| `status: "expired"` | Обратитесь в Veriqorn за продлением. |
| Функция выключена | Она не входит в лицензию. Обратитесь в Veriqorn, чтобы изменить набор прав. |
