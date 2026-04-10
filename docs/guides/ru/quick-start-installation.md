# Быстрый старт — Руководство по установке

QA Report Platform поставляется в виде готовых Docker-образов в GitHub Container Registry (GHCR). Вы можете запустить платформу целиком менее чем за пять минут одной командой `docker compose`.

---

## Предварительные требования

- **Docker** 20.10+ и **Docker Compose** v2 (или плагин `docker-compose`).
- Порты **3000**, **3001**, **5432**, **9000**, **9001** должны быть свободны на хосте.
- Минимум **2 ГБ** свободной оперативной памяти для всех сервисов.

Других зависимостей не требуется — compose-файл уже включает PostgreSQL, MinIO (S3-совместимое хранилище) и автоматическую инициализацию бакетов.

---

## Шаг 1 — Скачайте Compose-файл

Загрузите установочный compose-файл из репозитория:

```bash
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/docker-compose.yml
```

Или скопируйте его вручную из корня репозитория: `docker-compose.yml`.

---

## Шаг 2 — Создайте файл окружения

Создайте файл `.env` рядом с compose-файлом:

```bash
cat > .env <<'EOF'
# Required
JWT_SECRET=replace-with-a-long-random-secret
POSTGRES_PASSWORD=replace-with-a-strong-postgres-password
MINIO_ROOT_PASSWORD=replace-with-a-strong-minio-password

# Optional — override defaults if needed
# PLATFORM_VERSION=latest
# POSTGRES_USER=postgres
# POSTGRES_DB=test_ops
# MINIO_ROOT_USER=minioadmin
# NEXT_PUBLIC_API_URL=http://localhost:3001
# FRONTEND_URL=http://localhost:3000
EOF
```

> **Важно:** Замените `JWT_SECRET` на надёжное случайное значение для продакшен-среды.

### Справочник переменных окружения

| Переменная | По умолчанию | Описание |
|----------|---------|-------------|
| `JWT_SECRET` | *(обязательна)* | Секретный ключ для подписи JWT-токенов |
| `PLATFORM_VERSION` | `latest` | Тег Docker-образа (`latest`, `v1.0.0` и т.д.) |
| `POSTGRES_USER` | `postgres` | Пользователь PostgreSQL |
| `POSTGRES_PASSWORD` | *(обязательна)* | Пароль PostgreSQL |
| `POSTGRES_DB` | `test_ops` | Имя базы данных |
| `MINIO_ROOT_USER` | `minioadmin` | Пользователь-администратор MinIO |
| `MINIO_ROOT_PASSWORD` | *(обязательна)* | Пароль администратора MinIO |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | URL бэкенда, доступный из браузера |
| `FRONTEND_URL` | `http://localhost:3000` | URL фронтенда для CORS |
| `AI_ANALYSIS_LICENSE_PUBLIC_KEY` | *(пусто)* | Публичный ключ для проверки лицензии AI Pro (необязательно) |

---

## Шаг 3 — Запустите платформу

```bash
docker compose -f docker-compose.yml up -d
```

Docker загрузит образы из GHCR и запустит все сервисы. Первый запуск может занять 1–2 минуты, пока скачиваются образы и инициализируется база данных.

Убедитесь, что все контейнеры запущены:

```bash
docker compose -f docker-compose.yml ps
```

Вы должны увидеть пять сервисов: `frontend`, `backend`, `postgres`, `minio` и `minio-init` (завершается после создания бакетов).

---

## Шаг 4 — Откройте платформу

| Сервис | URL |
|---------|-----|
| **Frontend** (UI) | [http://localhost:3000](http://localhost:3000) |
| **Backend** (API) | [http://localhost:3001](http://localhost:3001) |
| **MinIO Console** | [http://localhost:9001](http://localhost:9001) |

### Учётные данные по умолчанию

| Пользователь | Email | Пароль |
|------|-------|----------|
| Администратор | `admin@example.com` | `admin123` |
| Пользователь | `user@example.com` | `user123` |

> Смените пароли по умолчанию после первого входа в продакшен-среде.

---

## Шаг 5 — Загрузите первые результаты

Авторизуйтесь и загрузите результаты Allure для проверки установки:

```bash
# 1. Login and get a JWT token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# 2. Upload a single result file
curl -X POST http://localhost:3001/upload/allure-results \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your-result.json" \
  -F "runName=First Run" \
  -F "environment=local"

# 3. Or upload a ZIP from CI
curl -X POST http://localhost:3001/upload/ci/allure-results \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@allure-results.zip" \
  -F "runName=CI Run" \
  -F "project=my-project"
```

Откройте [http://localhost:3000](http://localhost:3000) — ваш запуск должен появиться на странице Launches.

---

## Обновление

Чтобы обновиться до новой версии:

```bash
# Pull new images
docker compose -f docker-compose.yml pull

# Restart with zero downtime
docker compose -f docker-compose.yml up -d
```

Или укажите конкретную версию в `.env`:

```bash
PLATFORM_VERSION=v1.2.0
```

---

## Фиксация версии

По умолчанию `PLATFORM_VERSION=latest` загружает последнюю сборку. Для продакшена рекомендуется зафиксировать конкретный релизный тег:

```bash
PLATFORM_VERSION=v1.0.0
```

Доступные теги перечислены на [странице GitHub Packages](https://github.com/orgs/veriqorn/packages).

---

## Остановка и очистка

```bash
# Stop all services (data is preserved in volumes)
docker compose -f docker-compose.yml down

# Stop and remove all data (database, files)
docker compose -f docker-compose.yml down -v
```

---

## Устранение неполадок

| Симптом | Причина | Решение |
|---------|-------|-----|
| Ошибка `JWT_SECRET is required` при запуске | Отсутствует файл `.env` или пустой `JWT_SECRET` | Создайте `.env` со значением `JWT_SECRET` |
| Бэкенд завершается с ошибкой подключения к базе данных | PostgreSQL ещё не готов | Подождите 10–15 секунд и проверьте снова — healthcheck обеспечивает порядок запуска |
| Фронтенд показывает "Network Error" | Бэкенд недоступен из браузера | Проверьте, что `NEXT_PUBLIC_API_URL` соответствует публичному адресу бэкенда |
| Не удаётся загрузить образы из GHCR | Образы приватные или действует ограничение запросов | Убедитесь, что образы публичные, или выполните `docker login ghcr.io` с токеном GitHub |
| Порт 3000/3001 уже занят | Другой сервис использует этот порт | Остановите конфликтующий сервис или переназначьте порты в compose-файле |

---

## Дальнейшие шаги

- **Интеграция с CI/CD**: См. примеры загрузки выше или настройте [пайплайн повторного запуска тестов](test-rerun-setup.md).
- **Функции AI Pro**: Установите лицензию AI Pro для доступа к анализу сбоев, индексации репозитория и интеллектуальному покрытию. См. [Лицензия AI Pro](ai-pro-license.md).
- **Подключение LLM**: Подключите локальный или облачный LLM-провайдер для AI-анализа. См. [Подключение LLM](ai-llm-connection.md).
