# Руководство по обновлению системы (Self-hosted)

Этот гайд описывает, как обновлять QA Report Platform в self-hosted Docker-окружении без потери данных.

Используйте этот сценарий, если платформа уже запущена через `docker-compose.yml`.

---

## Что меняется при обновлении

При обновлении Docker заменяет контейнеры приложения (`backend`, `frontend`) новыми образами.

При этом данные не удаляются, потому что они живут в Docker volumes:

- данные PostgreSQL: volume из `VERIQORN_POSTGRES_VOLUME` (по умолчанию `veriqorn-postgres-data`)
- данные MinIO: volume из `VERIQORN_MINIO_VOLUME` (по умолчанию `veriqorn-minio-data`)

Данные удаляются только если вы явно удалите volumes, например через `docker compose down -v`.

---

## Предварительные требования

- Развёрнутая платформа на основе `docker-compose.yml`
- Доступ к `.env`
- Достаточно свободного места для резервных копий

Для канонического набора переменных окружения ориентируйтесь на `veriqorn-install/.env.example`.

---

## Шаг 1 - Создайте резервные копии

Создайте локальную директорию под backup:

```bash
mkdir -p backups
```

### 1.1 Резервная копия PostgreSQL

```bash
docker compose --env-file .env -f docker-compose.yml exec -T postgres \
  pg_dump -U postgres test_ops > backups/postgres_pre_update.sql
```

Если у вас в `.env` используются другие имя БД или пользователь, подставьте их вместо `postgres` и `test_ops`.

### 1.2 Резервная копия MinIO

```bash
docker compose --env-file .env -f docker-compose.yml cp \
  minio:/data backups/minio_data_pre_update
```

---

## Шаг 2 - Выберите целевую версию

Укажите версию платформы в `.env`:

```env
PLATFORM_VERSION=v1.2.0
```

Если оставить `latest`, при обновлении будет скачиваться последний опубликованный образ.

---

## Шаг 3 - Загрузите и примените обновление

```bash
docker compose --env-file .env -f docker-compose.yml pull
docker compose --env-file .env -f docker-compose.yml up -d
```

Что произойдёт:

- новые образы будут скачаны из GHCR
- контейнеры будут пересозданы с новой версией
- существующие volumes PostgreSQL и MinIO будут переиспользованы
- backend выполнит миграции БД при старте

---

## Шаг 4 - Проверьте результат

```bash
docker compose --env-file .env -f docker-compose.yml ps
docker compose --env-file .env -f docker-compose.yml logs backend --tail 200
```

После этого проверьте в UI:

- вход в систему работает
- исторические прогоны на месте
- вложения и артефакты открываются
- статус AI Pro сохранился, если он используется

---

## Откат

Если что-то пошло не так:

1. Верните предыдущую версию в `.env`, например `PLATFORM_VERSION=v1.1.0`.
2. Выполните:

```bash
docker compose --env-file .env -f docker-compose.yml pull
docker compose --env-file .env -f docker-compose.yml up -d
```

Если для отката требуется восстановление данных, используйте резервные копии из шага 1.

---

## Восстановление

### Восстановить PostgreSQL из SQL-дампа

```bash
cat backups/postgres_pre_update.sql | \
docker compose --env-file .env -f docker-compose.yml exec -T postgres \
  psql -U postgres test_ops
```

### Восстановить данные MinIO

```bash
docker compose --env-file .env -f docker-compose.yml cp \
  backups/minio_data_pre_update/. minio:/data
```

---

## AI Pro лицензия при обновлении

Состояние лицензии не “зашито” в Docker-образ.

- ключ проверки читается из `AI_ANALYSIS_LICENSE_PUBLIC_KEY` в `.env`
- подписанный license envelope хранится в базе данных в настройках приложения

Пока база данных сохраняется, состояние лицензии тоже сохраняется.

---

## Чеклист безопасности

- Не запускайте `docker compose down -v`, если не хотите намеренно стереть все данные.
- Не переименовывайте и не удаляйте `VERIQORN_POSTGRES_VOLUME` / `VERIQORN_MINIO_VOLUME`, если специально не делаете миграцию хранилища.
- Храните `.env` в системе резервного копирования и управления секретами.
- Делайте регулярные backup PostgreSQL и MinIO перед production-обновлениями.
- Для production лучше использовать фиксированные release tags, а не `latest`.
