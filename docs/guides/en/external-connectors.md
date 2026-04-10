# External System Connectors

The QA Report Platform supports querying external systems (Sentry, Kibana, Grafana, etc.) for additional evidence during AI failure analysis. This guide explains the plugin architecture and how to add new connector types.

## Architecture

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

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `ConnectorPlugin` | `connectors/connector-plugin.interface.ts` | Interface every connector implements |
| `ConnectorRegistry` | `connectors/connector-registry.ts` | Central registry of available plugins |
| `connectorFetch` | `connectors/base-http-connector.ts` | Shared HTTP client with retry/timeout |
| `AiAnalysisConnectorsService` | `services/ai-analysis-connectors.service.ts` | Orchestrates config + plugin execution |

## ConnectorPlugin Interface

Every connector must implement two methods:

```typescript
interface ConnectorPlugin {
  readonly type: string;
  healthCheck(config: ConnectorConfigResolved): Promise<ConnectorHealthResult>;
  fetchEvidence(config: ConnectorConfigResolved, context: ConnectorQueryContext): Promise<ConnectorEvidenceItem[]>;
}
```

### `healthCheck(config)`

Called when the user clicks "Test Connection" in the UI. Should make a real HTTP request to the external system's health/status endpoint and return:

- `ok` — system is reachable and authenticated
- `auth_failed` — 401/403 response
- `timeout` — request timed out
- `error` — any other failure

Include `responseTimeMs` for the UI to display latency.

### `fetchEvidence(config, context)`

Called during AI failure analysis. Receives:

- `config` — endpoint URL, API key, timeout, etc.
- `context` — failure message, stack trace, test name, timestamps, time window

Returns an array of `ConnectorEvidenceItem` objects that get merged into the analysis pipeline alongside code evidence.

## Adding a New Connector

### Step 1: Create the plugin file

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

### Step 2: Register in AppModule

```typescript
// backend/src/app.module.ts
import { PagerDutyConnectorPlugin } from "./connectors/pagerduty-connector.plugin";

// Add to providers array:
providers: [
  // ...existing providers
  PagerDutyConnectorPlugin,
]
```

The plugin self-registers in the `ConnectorRegistry` via its constructor — no other wiring needed.

### Step 3: Add license token (optional)

If the connector should be gated behind a license, add a feature check in `ai-analysis-edition.service.ts`:

```typescript
pagerdutyConnector: toAvailability(
  isFeatureEnabled(["connector:pagerduty", "pagerduty"], true),
),
```

### Step 4: Write tests

Create `pagerduty-connector.plugin.spec.ts` with mocked HTTP responses:

```typescript
// Mock connectorFetch to avoid real HTTP calls
jest.mock("./base-http-connector", () => ({
  connectorFetch: jest.fn(),
}));
```

Test health check responses (200, 401, 500, timeout) and evidence fetching with sample API responses.

## Built-in Connectors

### Sentry (`sentry`)

Queries Sentry's Issue Search API for errors matching the failure message within a time window. Fetches latest events for each issue to extract stack frames.

**Config**: endpoint URL (e.g. `https://sentry.io`), API auth token.

### Kibana / Elasticsearch (`kibana`)

Searches application logs via Elasticsearch `_search` API. Supports both direct ES endpoints and Kibana-proxied requests. Extracts meaningful keywords from failure messages.

**Config**: endpoint URL, API key. Optional: index pattern via connector name/headers.

### Grafana (`grafana`)

Queries annotations and alert history around the failure time window. Alerts in `firing` state get higher relevance scores.

**Config**: endpoint URL (e.g. `https://grafana.example.com`), service account token.

## Evidence Scoring

Each connector assigns a `relevanceScore` (0–1) to its evidence items. The analysis pipeline merges all evidence (code + external) and sorts by score. Guidelines:

- **0.80–0.90**: Strong match (exact error message found in Sentry, alert firing at failure time)
- **0.50–0.79**: Moderate match (related logs found, similar error patterns)
- **0.30–0.49**: Contextual (annotations, resolved alerts, tangentially related logs)
- Cap individual items at **0.90** to avoid external evidence dominating code evidence

## Configuration

Users configure connectors via Settings → AI Analysis → Connector Settings. Each connector instance has:

- **Type** — which plugin handles it (sentry, kibana, grafana, etc.)
- **Name** — human-readable label
- **Endpoint URL** — base URL of the external system
- **API Key** — authentication token (encrypted at rest)
- **Timeout** — request timeout in milliseconds (default 10s)
- **Enabled** — toggle on/off without deleting config

Multiple instances of the same type are supported (e.g., two Kibana connectors for different clusters).
