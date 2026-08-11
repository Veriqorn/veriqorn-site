# Активация Enterprise-лицензии Veriqorn

Community-версия Veriqorn работает без продуктовой лицензии. Enterprise AI
возможности работают offline по подписанной лицензии, привязанной к конкретной
установке. Копирование license JSON на другой сервер её не активирует.

## Перед началом

Используйте Enterprise overlay из публичного репозитория установки. Он
монтирует лицензию в backend только для чтения, а Enterprise image уже содержит
публичный ключ Veriqorn для проверки подписи. Клиент не получает и не настраивает
закрытый ключ Veriqorn.

Одна лицензия не добавляет закрытые модули в уже запущенный Community image.
Чтобы перевести существующую Community-установку на Enterprise, примените
`compose.enterprise.yml`: он заменяет только контейнеры `backend` и `frontend`
на авторизованные Enterprise images. PostgreSQL, MinIO, именованные volume,
проекты и история прогонов остаются на месте, поэтому переустановка не нужна.

Для установки один раз создайте и сохраните
`VERIQORN_INSTALLATION_KEY_ENCRYPTION_KEY` — base64url-секрет длиной 32 байта.
Он шифрует локальный private key identity; при его утрате потребуется безопасная
повторная активация.

## 1. Экспортируйте activation request

Один раз запустите Enterprise-установку. Затем администратор скачивает запрос
в **Settings → Plan** или вызывает API:

```bash
curl http://localhost:3001/api/v1/edition/license-activation-request \
  -b "auth_token=<ваша-сессия>" \
  -o veriqorn-activation-request.json
```

Передайте этот JSON в Veriqorn согласованным каналом. В нём есть installation
ID, public key и fingerprint для привязки лицензии. В нём нет результатов
тестов, проектов, private key установки или закрытого ключа Veriqorn.

Для production, staging и air-gapped установок нужны отдельные request и
отдельная лицензия.

## 2. Получите и смонтируйте лицензию

Veriqorn подписывает лицензию schema-v3 закрытым issuer key. Она содержит
payload, Ed25519-подпись с `keyId`, срок действия, привязку к установке и
entitlements, например `ai.analysis` и `ai.rag`.

Храните полученный JSON вне Git и укажите путь к нему в `.env.enterprise`:

```env
VERIQORN_LICENSE_FILE=./licenses/veriqorn-license.json
```

Запускайте Community compose вместе с Enterprise overlay:

```bash
docker compose --env-file .env --env-file .env.enterprise \
  -f docker-compose.yml -f compose.enterprise.yml up -d
```

Администратор также может активировать тот же JSON через API:

```bash
curl -X POST http://localhost:3001/api/v1/edition/license-activations \
  -H "Content-Type: application/json" \
  -b "auth_token=<ваша-сессия>" \
  --data-binary @veriqorn-license.json
```

## 3. Проверьте состояние

```bash
curl http://localhost:3001/api/v1/edition \
  -b "auth_token=<ваша-сессия>"
```

Ответ содержит статус лицензии и только выданные этой установке entitlements.
Лицензия не отменяет обычные права пользователя на проекты или admin-действия.

## Offline, продление и восстановление

- Проверка подписи локальная — постоянный доступ к Интернету не нужен.
- Для продления Veriqorn выдаёт новый подписанный JSON для той же установки.
- Для замены сервера или утраты installation identity экспортируйте новый
  request и запросите replacement license. Не копируйте лицензию или identity
  с другой машины.
- Храните вместе защищённую резервную копию БД, license JSON и секрет шифрования
  installation identity. Закрытый issuer key Veriqorn не является частью такой
  резервной копии.

## Устранение неполадок

| Симптом | Что делать |
|---|---|
| `not_configured` | Проверьте Enterprise image и read-only mount license file. |
| `invalid` | Получите license JSON от Veriqorn заново; убедитесь, что он не изменён и предназначен этой установке. |
| `expired` | Запросите продление у Veriqorn. Community-функции остаются доступны. |
| Возможность недоступна | Проверьте entitlement в лицензии и наличие Enterprise extension. |
