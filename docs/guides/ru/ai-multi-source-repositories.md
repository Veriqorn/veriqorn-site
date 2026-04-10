# Настройка источников кода (Multi-Source)

QA Report Platform поддерживает индексацию кода из нескольких источников для AI-анализа: локальные пути, сетевые папки и удалённые Git-репозитории (GitHub, GitLab, Bitbucket, Azure DevOps).

---

## 1) Поддерживаемые типы источников

| Тип | Описание | Авторизация |
|---|---|---|
| **Local Path** | Относительный путь на сервере | Нет |
| **Network Path** | UNC или сетевая папка | Нет |
| **GitHub** | Публичный или приватный репозиторий | Токен для приватных |
| **GitLab** | Публичный или приватный репозиторий | Токен для приватных |
| **Bitbucket** | Публичный или приватный репозиторий | Токен для приватных |
| **Azure DevOps** | Git-репозиторий Azure DevOps | Токен обязателен |

---

## 2) Предварительные требования

1. Бэкенд платформы запущен (`http://localhost:3001`).
2. Активирована AI Pro лицензия с фичей `indexing`.
3. На сервере установлен Git (для клонирования удалённых репозиториев).

---

## 3) Настройка через UI

1. Откройте **Settings > AI Analysis > Repository context**.
2. Нажмите **Add repository**.
3. Выберите **Source type** из выпадающего списка.
4. Заполните поля:

### Для GitHub / GitLab / Bitbucket / Azure DevOps

| Поле | Пример |
|---|---|
| Repository name | Backend Service |
| Repository URL | `https://github.com/myorg/backend` |
| Access Token | `ghp_xxxxxxxxxxxx` |
| Branch | `main` |
| Subfolder | `src` (необязательно) |

5. Нажмите **Save Changes**.
6. Запустите **Index Repositories** в разделе AI Analysis.

---

## 4) Настройка через API

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisRepositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": [
      {
        "id": "github-backend",
        "name": "Backend (GitHub)",
        "sourceType": "github",
        "url": "https://github.com/myorg/backend",
        "authToken": "ghp_xxxxxxxxxxxx",
        "branch": "main"
      }
    ]
  }'
```

### Проверка подключения

```bash
curl -X POST http://localhost:3001/ai-analysis/repositories/test-connection \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "sourceType": "github",
    "url": "https://github.com/myorg/backend",
    "authToken": "ghp_xxxxxxxxxxxx"
  }'
```

---

## 5) Как работает клонирование

- **Первая индексация** — shallow clone (`--depth 1`) указанной ветки.
- **Последующие** — только fetch последних изменений.
- Клоны хранятся в `AI_ANALYSIS_CLONE_DIR` (по умолчанию `data/repos/`).

---

## 6) Получение токенов

- **GitHub:** Settings > Developer settings > Personal access tokens (`repo` scope)
- **GitLab:** User Settings > Access Tokens (`read_repository` scope)
- **Bitbucket:** Personal settings > App passwords (`Repositories: Read`)
- **Azure DevOps:** User settings > Personal access tokens (`Code: Read`)

---

## 7) Безопасность

- Токены **шифруются в БД** (AES-256-GCM).
- Токены инжектятся в URL клонирования только в памяти.
- На диск и в логи учётные данные не попадают.

---

## Связанные гайды

- [Обзор AI модуля](./ai-module-overview.md)
- [Индексация репозиториев](./ai-repository-indexing.md)
- [Настройка Qdrant](./ai-vector-db-setup.md)
