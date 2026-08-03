# Быстрый старт - Руководство по установке

QA Report Platform поставляется в виде готовых Docker-образов в GitHub Container Registry (GHCR). Полную платформу можно запустить менее чем за пять минут одной командой `docker compose`.

---

## Предварительные требования

- **Docker** 20.10+ и **Docker Compose** v2.
- Свободные порты **3000**, **3001**, **5432**, **9000**, **9001** на хосте.
- Минимум **2 ГБ** свободной оперативной памяти для всех сервисов.

Дополнительные зависимости не требуются: compose-файл уже включает PostgreSQL, MinIO и автоматическую инициализацию бакетов.

---

## Шаг 1 - Скачайте установочные файлы

Скачайте установочный compose-файл и пример файла окружения из репозитория:

```bash
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/docker-compose.yml
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/.env.example
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/preflight.ps1
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/preflight.sh
```

Либо скопируйте их вручную из корня репозитория `veriqorn-install`: `docker-compose.yml` и `.env.example`.

---

## Шаг 2 - Подготовьте файл окружения

Создайте `.env` рядом с compose-файлом на основе опубликованного примера:

```bash
cp .env.example .env
```

Обязательно задайте безопасные значения как минимум для:

- `JWT_SECRET`
- `POSTGRES_PASSWORD`
- `MINIO_ROOT_PASSWORD`
- `BACKEND_BOOTSTRAP_ADMIN_EMAIL`
- `BACKEND_BOOTSTRAP_ADMIN_PASSWORD`

### Основные переменные окружения

| Переменная | По умолчанию | Назначение |
|----------|---------|-------------|
| `JWT_SECRET` | *(обязательна)* | Секрет для подписи JWT-токенов |
| `BACKEND_BOOTSTRAP_ADMIN_EMAIL` | *(нужна при первом запуске)* | Email первого администратора для пустой БД |
| `BACKEND_BOOTSTRAP_ADMIN_PASSWORD` | *(нужен при первом запуске)* | Уникальный пароль первого администратора длиной от 12 символов |
| `PLATFORM_VERSION` | `latest` | Тег Docker-образов |
| `POSTGRES_USER` | `postgres` | Пользователь PostgreSQL |
| `POSTGRES_PASSWORD` | *(обязательна)* | Пароль PostgreSQL |
| `POSTGRES_DB` | `test_ops` | Имя базы данных |
| `POSTGRES_HOST_PORT` | `5432` | Порт PostgreSQL на хосте |
| `VERIQORN_POSTGRES_VOLUME` | `veriqorn-postgres-data` | Имя Docker volume для данных PostgreSQL |
| `MINIO_ROOT_USER` | `minioadmin` | Администратор MinIO |
| `MINIO_ROOT_PASSWORD` | *(обязательна)* | Пароль администратора MinIO |
| `MINIO_SERVICE_ACCESS_KEY` | `veriqorn-app` | Внутренняя учётная запись MinIO только для backend |
| `MINIO_SERVICE_SECRET_KEY` | *(обязательна)* | Секрет сервисной учётной записи backend с минимальными правами |
| `MINIO_API_PORT` | `9000` | Порт API MinIO на хосте |
| `MINIO_CONSOLE_PORT` | `9001` | Порт консоли MinIO на хосте |
| `VERIQORN_MINIO_VOLUME` | `veriqorn-minio-data` | Имя Docker volume для артефактов MinIO |
| `FRONTEND_PORT` | `3000` | Порт frontend на хосте |
| `BACKEND_PORT` | `3001` | Порт backend на хосте |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | URL backend, доступный из браузера |
| `NEXT_PUBLIC_KB_URL` | `http://localhost:5174` | URL standalone Knowledge Base, если он развёрнут отдельно |
| `FRONTEND_URL` | `http://localhost:3000` | URL frontend для CORS |
| `CORS_ORIGINS` | `http://localhost:3000` | Разрешённые browser origins для backend |
| `AI_ANALYSIS_LICENSE_PUBLIC_KEY` | *(пусто)* | Публичный ключ для проверки AI Pro лицензии |

---

### Проверка доступа к образам

Перед передачей инструкции заказчику проверьте, что опубликованные образы
доступны из целевой среды:

```bash
docker pull ghcr.io/veriqorn/veriqorn-backend:latest
docker pull ghcr.io/veriqorn/veriqorn-frontend:latest
```

Если любая команда возвращает `unauthorized`, GHCR package не открыт публично
или на хосте нужен `docker login ghcr.io` с токеном, у которого есть доступ на
чтение package.

### Проверка конфигурации

Перед запуском проверьте секреты и Compose-конфигурацию, не выводя значения
секретов:

```powershell
powershell -ExecutionPolicy Bypass -File .\preflight.ps1
```

На Linux выполните:

```bash
chmod +x ./preflight.sh
./preflight.sh
```

`MINIO_SERVICE_ACCESS_KEY` — внутренний сервисный пользователь backend для
артефактов, трасс и скриншотов. Пользователи Veriqorn не входят в MinIO: backend
сначала проверяет их доступ к проекту, а затем обращается к хранилищу от имени
сервисной учётной записи.

## Шаг 3 - Запустите платформу

```bash
docker compose -f docker-compose.yml up -d
```

Docker скачает образы из GHCR и поднимет все сервисы. Первый запуск может занять 1-2 минуты, пока инициализируются контейнеры и база данных.

Проверьте состояние:

```bash
docker compose -f docker-compose.yml ps
```

Вы должны увидеть сервисы `frontend`, `backend`, `postgres`, `minio` и `minio-init`. Контейнер `minio-init` завершится после создания бакетов.

---

## Шаг 4 - Откройте платформу

| Сервис | URL |
|---------|-----|
| Frontend | [http://localhost:3000](http://localhost:3000) |
| Backend API | [http://localhost:3001](http://localhost:3001) |
| MinIO Console | [http://localhost:9001](http://localhost:9001) |

### Первый вход

Войдите с email и паролем администратора из переменных bootstrap. Платформа не
создаёт учётные записи и пароли по умолчанию. После первого успешного входа
удалите `BACKEND_BOOTSTRAP_ADMIN_PASSWORD` из `.env`.

---

## Шаг 5 - Загрузите первые результаты

Для проверки установки можно авторизоваться и загрузить Allure-результаты:

```bash
# 1. Создать сессионную cookie
curl -s -c veriqorn.cookies -X POST http://localhost:3001/api/v1/auth/session \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_BOOTSTRAP_ADMIN_EMAIL","password":"YOUR_BOOTSTRAP_ADMIN_PASSWORD"}'

# 2. Загрузить одиночный result-файл
curl -X POST http://localhost:3001/api/v1/projects/default/imports/allure-jobs \
  -b veriqorn.cookies \
  -F "file=@/path/to/your-result.json" \
  -F "runName=First Run" \
  -F "sourceKind=uploaded_file" \
  -F "environment=local"

# 3. Или загрузить ZIP-архив из CI
curl -X POST http://localhost:3001/api/v1/projects/default/imports/allure-jobs \
  -b veriqorn.cookies \
  -F "file=@allure-results.zip" \
  -F "runName=CI Run" \
  -F "sourceKind=ci_archive" \
  -F "branch=main"
```

После этого откройте [http://localhost:3000](http://localhost:3000) - новый прогон должен появиться в интерфейсе.

---

## Сохранность данных

Обычные обновления приложения не удаляют ваши данные.

- Данные PostgreSQL хранятся в Docker volume, заданном через `VERIQORN_POSTGRES_VOLUME`.
- Артефакты MinIO хранятся в Docker volume, заданном через `VERIQORN_MINIO_VOLUME`.
- Команды `docker compose pull` и `docker compose up -d` пересоздают контейнеры, но переиспользуют те же volume.

Данные удаляются только при явном `docker compose down -v`.

---

## Обновление

Чтобы обновиться до более новой версии:

```bash
docker compose -f docker-compose.yml pull
docker compose -f docker-compose.yml up -d
```

Для фиксации конкретной версии укажите её в `.env`:

```env
PLATFORM_VERSION=v1.2.0
```

Встроенный агент обновления перед активацией новой версии проверяет keyless
Cosign-подписи обоих image digest. Не меняйте `UPDATE_COSIGN_IDENTITY`, если не
публикуете собственные образы из другого подписанного workflow.

---

## Остановка и очистка

```bash
# Остановить сервисы, сохранив данные
docker compose -f docker-compose.yml down

# Остановить сервисы и удалить все persisted data
docker compose -f docker-compose.yml down -v
```

---

## Диагностика

| Симптом | Причина | Что делать |
|---------|---------|------------|
| `JWT_SECRET is required` при старте | Не создан `.env` или переменная пуста | Заполните `.env` |
| Backend падает с ошибкой подключения к БД | PostgreSQL ещё не готов | Подождите 10-15 секунд и проверьте снова |
| Frontend показывает `Network Error` | Браузер не может достучаться до backend | Проверьте `NEXT_PUBLIC_API_URL` |
| Не скачиваются образы из GHCR | Ограничения доступа или rate limit | Проверьте доступность образов или выполните `docker login ghcr.io` |
| Порты 3000/3001 заняты | Их использует другой процесс | Освободите порты или переназначьте их в `.env` |

---

## Что дальше

- **Передача результатов автотестов**: настройте CI, чтобы после каждого прогона он загружал Allure-результаты. См. [Передача результатов автотестов в Veriqorn](test-results-ci-integration.md).
- **Повторный запуск тестов**: настройте [pipeline Test Rerun](test-rerun-setup.md), чтобы запускать выбранные тесты из прогона.
- Для AI-функций см. [AI Pro License](ai-pro-license.md).
- Для подключения LLM см. [LLM Connection](ai-llm-connection.md).
