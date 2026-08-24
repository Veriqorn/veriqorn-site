# Активация Enterprise-лицензии Veriqorn

Enterprise использует авторизованные Enterprise-образы приложения и offline
лицензию, привязанную к установке. Лицензия не добавляет закрытые модули в
Community image, а копирование JSON на другой сервер его не активирует.

## Выберите сценарий

### Новая Enterprise-установка

1. Один раз выполните [Quick Start](quick-start-installation.md), чтобы создать
   развёртывание, учётную запись администратора и identity установки.
2. Войдите как администратор и откройте **Settings → Plan & license**.
3. Нажмите **Download activation request** и передайте скачанный JSON в
   Veriqorn согласованным каналом.
4. После получения лицензии выполните раздел **Подготовьте Enterprise overlay**,
   прежде чем начинать работу с установкой.

### Уже работающая Community-установка

1. Войдите как администратор и откройте **Settings → Plan & license**.
2. Нажмите **Download activation request** и передайте этот JSON в Veriqorn.
3. После получения лицензии выполните раздел **Подготовьте Enterprise overlay**.

Это переход на месте: overlay заменяет только `backend` и `frontend`.
PostgreSQL, MinIO, именованные volume, проекты, пользователи и история прогонов
сохраняются. Не выполняйте `docker compose down -v` и не переустанавливайте
систему.

## Доступ к приватным Enterprise-образам

Enterprise-образы хранятся в приватных пакетах GitHub Container Registry
(GHCR). Этот доступ нужен только для доставки образов: он не активирует
Enterprise-лицензию, привязанную к установке, и не даёт доступа к исходным
репозиториям Veriqorn.

1. Сообщите Veriqorn имя отдельного GitHub-аккаунта для развёртывания,
   например `acme-veriqorn-deploy`. Рекомендуется использовать выделенный
   технический аккаунт.
2. Veriqorn выдаёт этому аккаунту доступ **Read** только к пакетам
   `veriqorn-enterprise-backend` и `veriqorn-enterprise-frontend`.
3. Создайте для этого аккаунта **classic** personal access token только с
   областью `read:packages`. Если в организации требуется SSO, авторизуйте
   токен для неё.
4. На сервере один раз войдите Docker в GHCR и добавьте те же значения в
   локальный файл развёртывания `.env`:

   ```bash
   echo "$GHCR_TOKEN" | docker login ghcr.io -u acme-veriqorn-deploy --password-stdin
   ```

   ```dotenv
   UPDATE_REGISTRY_USERNAME=acme-veriqorn-deploy
   UPDATE_REGISTRY_TOKEN=<GitHub PAT с read:packages>
   ```

   Не коммитьте этот токен и не добавляйте его в `.env.enterprise`. Агент
   обновления использует его только на время загрузки новых Enterprise-образов.
5. После добавления или замены токена пересоздайте агента обновления:

   ```bash
   docker compose --env-file .env --env-file .env.enterprise \
     -f docker-compose.yml -f compose.enterprise.yml up -d --force-recreate update-agent
   ```

После завершения подписки Veriqorn отзывает у технического аккаунта доступ к
пакетам. Срок действия и отзыв лицензии отдельно определяют, может ли работать
уже установленный Enterprise-продукт.

## Подготовьте Enterprise overlay

Этот шаг выполняет доверенный оператор сервера с доступом к папке развёртывания
и Docker. Его нельзя безопасно выполнить только из UI, потому что он меняет
образы, которые запускает Docker.

Скачайте overlay-файлы рядом с существующими `docker-compose.yml` и `.env`:

```bash
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/compose.enterprise.yml
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/.env.enterprise.example
cp .env.enterprise.example .env.enterprise
```

Сохраните выданный license JSON вне Git, например в
`./licenses/veriqorn-license.json`. В `.env.enterprise` укажите:

```env
VERIQORN_LICENSE_FILE=./licenses/veriqorn-license.json
# Создайте один раз, храните безопасно и не используйте повторно на другой установке.
VERIQORN_INSTALLATION_KEY_ENCRYPTION_KEY=<32-byte-base64url-secret>
```

Оставьте авторизованные immutable значения `ENTERPRISE_BACKEND_IMAGE` и
`ENTERPRISE_FRONTEND_IMAGE`, выданные вместе с Enterprise-релизом. В Enterprise
image уже встроен публичный ключ Veriqorn; закрытый issuer key клиенту не
передаётся.

Примените overlay:

```bash
docker compose --env-file .env --env-file .env.enterprise \
  -f docker-compose.yml -f compose.enterprise.yml up -d
```

## Активируйте лицензию через UI

Когда overlay запущен, вернитесь в **Settings → Plan & license**. Нажмите
**Activate license**, загрузите выданный JSON или вставьте его точное содержимое
и подтвердите действие. На странице появятся лицензия, заказчик, срок действия
и entitlements.

Для продления этой же установки используйте **Replace license**. JSON всё равно
нужно хранить и монтировать с сервера: этого требует Enterprise Compose overlay.

## Альтернатива: консоль и API

Для автоматизации или air-gapped сценария администратор экспортирует тот же
request и активирует тот же JSON через API:

```bash
curl http://localhost:3001/api/v1/ai/license-activation-request \
  -b "auth_token=<ваша-сессия>" \
  -o veriqorn-activation-request.json

curl -X POST http://localhost:3001/api/v1/ai/license-activations \
  -H "Content-Type: application/json" \
  -b "auth_token=<ваша-сессия>" \
  --data-binary @veriqorn-license.json
```

## Проверьте состояние entitlements

```bash
curl http://localhost:3001/api/v1/edition \
  -b "auth_token=<ваша-сессия>"
```

Для production, staging и air-gapped установок нужны отдельные activation
request и лицензия. Проверка лицензии локальная: постоянный Интернет не нужен.

## Устранение неполадок

| Симптом | Что делать |
|---|---|
| `not_configured` | Проверьте, что запущен Enterprise image и license file смонтирован только для чтения. |
| `invalid` | Получите лицензию заново и убедитесь, что она выдана для этой установки и не менялась. |
| `expired` | Запросите продление. Community-функции останутся доступны. |
| Возможность недоступна | Проверьте entitlement и что Enterprise overlay запущен. |
