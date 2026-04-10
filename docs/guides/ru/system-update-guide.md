# Руководство по обновлению системы (Self-hosted)

Данное руководство описывает, как обновить QA Report Platform в self-hosted Docker-окружении без потери данных.

Используйте этот процесс, если вы уже запустили платформу с помощью `docker-compose.install.yml`.

---

## Что изменяется при обновлении

При обновлении Docker заменяет контейнеры приложений (`backend`, `frontend`) новыми образами.

Ваши данные хранятся в Docker-томах и не удаляются при обычном обновлении:

- Данные PostgreSQL: `postgres_data`
- Данные MinIO: `minio_data`

Данные удаляются только при явном удалении томов (например, `docker compose down -v`).

---

## Предварительные требования

- Работающее развёртывание на основе `docker-compose.install.yml`
- Доступ к `.env.install`
- Достаточно свободного дискового пространства для архивов резервных копий

---

## Шаг 1 — Создайте резервные копии (рекомендуется)

Создайте локальную директорию для резервных копий:

```bash
mkdir -p backups
```

### 1.1 Резервная копия PostgreSQL

```bash
docker compose --env-file .env.install -f docker-compose.install.yml exec -T postgres \
  pg_dump -U postgres test_ops > backups/postgres_pre_update.sql
```

Если вы используете пользовательские учётные данные или имя базы данных, замените `postgres` и `test_ops` на ваши значения из `.env.install`.

### 1.2 Резервная копия файлов MinIO

```bash
docker compose --env-file .env.install -f docker-compose.install.yml cp \
  minio:/data backups/minio_data_pre_update
```

---

## Шаг 2 — Выберите целевую версию

Укажите версию платформы в `.env.install`:

```env
PLATFORM_VERSION=v1.2.0
```

Если вы оставите `latest`, при каждом обновлении будет загружаться последний опубликованный образ.

---

## Шаг 3 — Загрузите и примените обновление

```bash
docker compose --env-file .env.install -f docker-compose.install.yml pull
docker compose --env-file .env.install -f docker-compose.install.yml up -d
```

Что происходит:

- новые образы загружаются из GHCR
- контейнеры пересоздаются с новой версией образа
- существующие тома переиспользуются
- бэкенд выполняет миграции БД при запуске (`migrationsRun: true`)

---

## Шаг 4 — Проверка после обновления

Выполните проверки:

```bash
docker compose --env-file .env.install -f docker-compose.install.yml ps
docker compose --env-file .env.install -f docker-compose.install.yml logs backend --tail 200
```

Затем проверьте в UI:

- вы можете войти в систему
- исторические запуски по-прежнему отображаются
- вложения и артефакты по-прежнему доступны
- статус AI Pro корректен (если используется)

---

## Процедура отката

Если что-то пошло не так:

1. Укажите предыдущую версию в `.env.install` (например, `PLATFORM_VERSION=v1.1.0`).
2. Выполните:

```bash
docker compose --env-file .env.install -f docker-compose.install.yml pull
docker compose --env-file .env.install -f docker-compose.install.yml up -d
```

Если откат требует восстановления данных, используйте резервные копии из Шага 1.

---

## Примечания по восстановлению

### Восстановление PostgreSQL (из SQL-дампа)

```bash
cat backups/postgres_pre_update.sql | \
docker compose --env-file .env.install -f docker-compose.install.yml exec -T postgres \
  psql -U postgres test_ops
```

### Восстановление файлов MinIO

```bash
docker compose --env-file .env.install -f docker-compose.install.yml cp \
  backups/minio_data_pre_update/. minio:/data
```

---

## Pro-лицензия при обновлении

Активация Pro-лицензии не встроена в Docker-образы.

- Ключ верификации считывается из `AI_ANALYSIS_LICENSE_PUBLIC_KEY` в `.env.install`
- Подписанный конверт лицензии хранится в настройках приложения (в базе данных)

Пока ваша база данных сохранена, состояние лицензии также сохраняется.

---

## Чек-лист безопасности

- Не выполняйте `docker compose down -v`, если вы не хотите полностью удалить все данные.
- Храните `.env.install` в резервной копии и системе управления секретами.
- Регулярно создавайте резервные копии БД и MinIO перед каждым обновлением в продакшене.
- В продакшене используйте фиксированные релизные теги вместо `latest`.
