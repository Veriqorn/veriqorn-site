# Автоматическая переиндексация кода

Автоматическая переиндексация поддерживает индекс кода в актуальном состоянии, обнаруживая новые коммиты в основной ветке и запуская инкрементальную индексацию. Доступны два механизма: **вебхуки** для Git-провайдеров и **поллинг** для локальных или сетевых репозиториев.

## Предварительные требования

- Активная лицензия AI Pro ([см. руководство по активации](./ai-pro-license.md))
- Хотя бы один настроенный репозиторий ([см. руководство по индексации](./ai-repository-indexing.md))
- Для вебхуков: платформа должна быть доступна из Git-провайдера

## Шаг 1. Включение автоиндексации

### Через UI настроек

1. Откройте **Settings > Auto-Indexing**
2. Включите **Enable automatic re-indexing**
3. Выберите режим: **Webhook** / **Polling** / **Both**
4. Укажите имя **основной ветки** (по умолчанию: `main`)
5. Для поллинга установите **интервал** в минутах (по умолчанию: 5)
6. Нажмите **Save Configuration**

### Через API

```bash
curl -X PUT http://localhost:3001/ai-analysis/auto-index/config \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "enabled": true,
    "mode": "both",
    "pollIntervalMinutes": 5,
    "mainBranch": "main"
  }'
```

## Шаг 2. Настройка вебхуков

### GitHub

1. В репозитории GitHub: **Settings > Webhooks > Add webhook**
2. Payload URL: `https://your-server/webhooks/github`
3. Content type: `application/json`
4. Сгенерируйте секрет в платформе и вставьте его в GitHub
5. Выберите **Just the push event**

### GitLab

1. В проекте GitLab: **Settings > Webhooks**
2. URL: `https://your-server/webhooks/gitlab`
3. Вставьте секретный токен
4. Отметьте **Push events**

### Bitbucket

1. **Settings > Webhooks > Add webhook**
2. URL: `https://your-server/webhooks/bitbucket`
3. Триггер: **Repository push**

### Azure DevOps

1. **Project Settings > Service Hooks > Create subscription**
2. Сервис: **Web Hooks**
3. Триггер: **Code pushed**
4. URL: `https://your-server/webhooks/azure-devops`

## Шаг 3. Интеграция с CI/CD (альтернатива)

Для случаев, когда вебхуки невозможны, используйте generic-эндпоинт с API-ключом:

```bash
curl -X POST https://your-server/webhooks/generic \
  -H "Authorization: Bearer qarp_ваш_ключ" \
  -H "Content-Type: application/json" \
  -d '{"branch": "main", "commitSha": "'$GITHUB_SHA'"}'
```

### Пример для GitHub Actions

```yaml
- name: Trigger re-indexing
  if: github.ref == 'refs/heads/main'
  run: |
    curl -s -X POST ${{ secrets.QA_PLATFORM_URL }}/webhooks/generic \
      -H "Authorization: Bearer ${{ secrets.QA_PLATFORM_API_KEY }}" \
      -H "Content-Type: application/json" \
      -d '{"branch": "main", "commitSha": "${{ github.sha }}"}'
```

## Как это работает

### Очередь индексации

- Одновременно выполняется только одно задание
- Дублирующие запросы для того же репозитория игнорируются
- Ошибки логируются, но не блокируют очередь
- SHA последнего проиндексированного коммита сохраняется после успешной индексации

## Мониторинг

```bash
curl http://localhost:3001/ai-analysis/auto-index/status \
  -b "auth_token=<jwt>"
```

## Верификация вебхуков

| Провайдер | Метод | Заголовок |
|-----------|-------|-----------|
| GitHub | HMAC-SHA256 | `X-Hub-Signature-256` |
| GitLab | Сравнение токенов | `X-Gitlab-Token` |
| Bitbucket | Без подписи | — |
| Azure DevOps | Basic auth или секрет | `Authorization` |

## Устранение неполадок

| Проблема | Причина | Решение |
|----------|---------|---------|
| Вебхук не приходит | Платформа недоступна из провайдера | Проверьте файрвол, DNS и HTTPS |
| «Invalid webhook signature» | Несовпадение секрета | Перегенерируйте секрет |
| Поллинг не срабатывает | Режим не включает «poll» | Проверьте конфигурацию |
| «Repository not configured» | Несовпадение URL | Проверьте URL в Settings > AI Analysis |

## Связанные руководства

- [Индексация репозиториев](./ai-repository-indexing.md)
- [Мультиисточники репозиториев](./ai-multi-source-repositories.md)
- [MCP-сервер](./ai-mcp-server.md)
