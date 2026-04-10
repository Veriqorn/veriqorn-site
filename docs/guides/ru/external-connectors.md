# Коннекторы внешних систем

QA Report Platform поддерживает запросы к внешним системам (Sentry, Kibana, Grafana и др.) для получения дополнительных доказательств при AI-анализе сбоев. Данное руководство описывает плагинную архитектуру и процесс добавления новых типов коннекторов.

## Архитектура

```
┌─────────────────────┐
│  AI Failure Analysis │
│      Service         │
└─────────┬───────────┘
          │ fetchAllEvidence()
          ▼
┌─────────────────────┐
│ AiAnalysisConnectors│──► reads config from Settings DB
│      Service         │
└─────────┬───────────┘
          │ for each enabled connector
          ▼
┌─────────────────────┐
│  ConnectorRegistry   │──► looks up plugin by type
└─────────┬───────────┘
          │
    ┌─────┼──────┬──────────┐
    ▼     ▼      ▼          ▼
 Sentry Kibana Grafana  [Custom]
 Plugin Plugin  Plugin   Plugin
```

### Ключевые компоненты

| Компонент | Файл | Назначение |
|-----------|------|------------|
| `ConnectorPlugin` | `connectors/connector-plugin.interface.ts` | Интерфейс, который реализует каждый коннектор |
| `ConnectorRegistry` | `connectors/connector-registry.ts` | Центральный реестр доступных плагинов |
| `connectorFetch` | `connectors/base-http-connector.ts` | Общий HTTP-клиент с повторными попытками и таймаутом |
| `AiAnalysisConnectorsService` | `services/ai-analysis-connectors.service.ts` | Оркестрирует конфигурацию и выполнение плагинов |

## Интерфейс ConnectorPlugin

Каждый коннектор должен реализовать два метода:

```typescript
interface ConnectorPlugin {
  readonly type: string;
  healthCheck(config: ConnectorConfigResolved): Promise<ConnectorHealthResult>;
  fetchEvidence(config: ConnectorConfigResolved, context: ConnectorQueryContext): Promise<ConnectorEvidenceItem[]>;
}
```

### `healthCheck(config)`

Вызывается, когда пользователь нажимает «Test Connection» в интерфейсе. Должен выполнить реальный HTTP-запрос к эндпоинту состояния внешней системы и вернуть:

- `ok` — система доступна и аутентифицирована
- `auth_failed` — получен ответ 401/403
- `timeout` — истекло время ожидания запроса
- `error` — любой другой сбой

Включите `responseTimeMs` для отображения задержки в интерфейсе.

### `fetchEvidence(config, context)`

Вызывается во время AI-анализа сбоев. Получает:

- `config` — URL эндпоинта, API-ключ, таймаут и т.д.
- `context` — сообщение об ошибке, стек-трейс, имя теста, временные метки, временное окно

Возвращает массив объектов `ConnectorEvidenceItem`, которые объединяются в конвейере анализа вместе с доказательствами из кода.

## Добавление нового коннектора

### Шаг 1: Создайте файл плагина

```typescript
// backend/src/connectors/pagerduty-connector.plugin.ts
import { Injectable, Logger } from "@nestjs/common";
import type {
  ConnectorPlugin,
  ConnectorConfigResolved,
  ConnectorQueryContext,
  ConnectorEvidenceItem,
  ConnectorHealthResult,
} from "./connector-plugin.interface";
import { connectorFetch } from "./base-http-connector";
import { ConnectorRegistry } from "./connector-registry";

@Injectable()
export class PagerDutyConnectorPlugin implements ConnectorPlugin {
  readonly type = "pagerduty";
  private readonly logger = new Logger(PagerDutyConnectorPlugin.name);

  constructor(registry: ConnectorRegistry) {
    registry.register(this);
  }

  async healthCheck(config: ConnectorConfigResolved): Promise<ConnectorHealthResult> {
    const start = Date.now();
    const response = await connectorFetch(
      `${config.endpointUrl}/api/v1/abilities`,
      config.apiKey,
      { timeoutMs: config.timeoutMs },
    );
    return {
      status: response.ok ? "ok" : response.status === 401 ? "auth_failed" : "error",
      message: response.ok ? "PagerDuty is reachable" : `HTTP ${response.status}`,
      responseTimeMs: Date.now() - start,
    };
  }

  async fetchEvidence(
    config: ConnectorConfigResolved,
    context: ConnectorQueryContext,
  ): Promise<ConnectorEvidenceItem[]> {
    // Query PagerDuty incidents API within the time window
    // Map results to ConnectorEvidenceItem format
    return [];
  }
}
```

### Шаг 2: Зарегистрируйте в AppModule

```typescript
// backend/src/app.module.ts
import { PagerDutyConnectorPlugin } from "./connectors/pagerduty-connector.plugin";

// Add to providers array:
providers: [
  // ...existing providers
  PagerDutyConnectorPlugin,
]
```

Плагин самостоятельно регистрируется в `ConnectorRegistry` через свой конструктор — никакой дополнительной настройки не требуется.

### Шаг 3: Добавьте токен лицензии (необязательно)

Если коннектор должен быть ограничен лицензией, добавьте проверку функции в `ai-analysis-edition.service.ts`:

```typescript
pagerdutyConnector: toAvailability(
  isFeatureEnabled(["connector:pagerduty", "pagerduty"], true),
),
```

### Шаг 4: Напишите тесты

Создайте `pagerduty-connector.plugin.spec.ts` с замоканными HTTP-ответами:

```typescript
// Mock connectorFetch to avoid real HTTP calls
jest.mock("./base-http-connector", () => ({
  connectorFetch: jest.fn(),
}));
```

Протестируйте ответы health check (200, 401, 500, таймаут) и получение доказательств с примерами ответов API.

## Встроенные коннекторы

### Sentry (`sentry`)

Запрашивает API поиска проблем Sentry для ошибок, совпадающих с сообщением о сбое в заданном временном окне. Получает последние события для каждой проблемы для извлечения фреймов стека.

**Конфигурация**: URL эндпоинта (например, `https://sentry.io`), токен аутентификации API.

### Kibana / Elasticsearch (`kibana`)

Ищет логи приложения через API `_search` Elasticsearch. Поддерживает как прямые эндпоинты ES, так и запросы через прокси Kibana. Извлекает значимые ключевые слова из сообщений об ошибках.

**Конфигурация**: URL эндпоинта, API-ключ. Необязательно: шаблон индекса через имя коннектора/заголовки.

### Grafana (`grafana`)

Запрашивает аннотации и историю алертов вокруг временного окна сбоя. Алерты в состоянии `firing` получают более высокие оценки релевантности.

**Конфигурация**: URL эндпоинта (например, `https://grafana.example.com`), токен сервисного аккаунта.

## Оценка релевантности доказательств

Каждый коннектор присваивает `relevanceScore` (0–1) своим элементам доказательств. Конвейер анализа объединяет все доказательства (из кода + внешние) и сортирует по оценке. Рекомендации:

- **0.80–0.90**: Сильное совпадение (точное сообщение об ошибке найдено в Sentry, алерт сработал в момент сбоя)
- **0.50–0.79**: Умеренное совпадение (найдены связанные логи, похожие паттерны ошибок)
- **0.30–0.49**: Контекстное (аннотации, разрешённые алерты, косвенно связанные логи)
- Ограничивайте отдельные элементы значением **0.90**, чтобы внешние доказательства не доминировали над доказательствами из кода

## Конфигурация

Пользователи настраивают коннекторы через Settings -> AI Analysis -> Connector Settings. Каждый экземпляр коннектора имеет:

- **Type** — какой плагин его обрабатывает (sentry, kibana, grafana и т.д.)
- **Name** — человекочитаемое название
- **Endpoint URL** — базовый URL внешней системы
- **API Key** — токен аутентификации (зашифрован при хранении)
- **Timeout** — таймаут запроса в миллисекундах (по умолчанию 10 сек.)
- **Enabled** — включение/выключение без удаления конфигурации

Поддерживается несколько экземпляров одного типа (например, два коннектора Kibana для разных кластеров).
