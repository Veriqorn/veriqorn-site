# Evidence Connectors

Evidence connectors allow the AI module to pull additional context from external observability tools when analyzing test failures.

## Supported connectors

| Connector | Use case | License token |
|-----------|----------|---------------|
| **Kibana** | Application logs, log discovery | `connector:kibana` |
| **Sentry** | Error events, stack traces, issue tracking | `connector:sentry` |
| **Grafana** | Metrics, dashboards, alerting telemetry | `connector:grafana` |
| **Logs** | Generic log endpoint for custom providers | `retrieval` |

## Configuration via Settings UI

1. Open **Settings > AI Analysis**
2. Scroll to the **Connector Settings** section
3. For each connector (Kibana, Sentry, Grafana, Logs):
   - Toggle the **enable switch** on the right side of the connector card
   - When enabled, input fields appear:
     - **Endpoint URL** — the base URL of your service (e.g. `https://kibana.internal.company.com`)
     - **API Key** — optional authentication key for the service
   - Click **Test Connection** to verify connectivity — shows status (success/error) and latency
4. Click **Save Connectors** to persist all connector settings

## Configuration via API

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisEvidenceConnectors \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": [
      {
        "id": "kibana-prod",
        "type": "kibana",
        "name": "Production Kibana",
        "endpointUrl": "https://kibana.internal.company.com",
        "enabled": true
      },
      {
        "id": "sentry-main",
        "type": "sentry",
        "name": "Sentry",
        "endpointUrl": "https://sentry.io/api/0",
        "enabled": true
      },
      {
        "id": "grafana-prod",
        "type": "grafana",
        "name": "Grafana",
        "endpointUrl": "https://grafana.internal.company.com",
        "enabled": false
      }
    ]
  }'
```

## Testing a connector

```bash
curl -X POST http://localhost:3001/ai-analysis/connectors/test \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "type": "kibana",
    "endpointUrl": "https://kibana.internal.company.com",
    "enabled": true
  }'
```

Response:

```json
{
  "connectorType": "kibana",
  "status": "ok",
  "checkedAt": "2025-06-15T10:30:00Z",
  "message": "Endpoint is reachable and returned a valid response.",
  "normalizedEndpoint": "https://kibana.internal.company.com",
  "warnings": []
}
```

Possible statuses:
- `ok` — endpoint is reachable
- `invalid` — endpoint is unreachable or returned an error
- `disabled` — connector is disabled in configuration

## How connectors are used

When `POST /ai-analysis/failures/analyze` is called:

1. The system collects failure context (error message, stack trace, test history)
2. It queries the code index for relevant source files
3. If connectors are enabled, it queries them for additional evidence:
   - **Kibana** — searches for log entries around the failure timestamp
   - **Sentry** — looks for matching error events
   - **Grafana** — checks for anomalies in metrics dashboards
4. All evidence is merged, ranked by relevance, and returned in the response

## Connector requirements

Each connector requires its respective license feature token. Without the token, the connector endpoint returns `403 AI_PRO_REQUIRED`.

| Connector | Required license token |
|-----------|----------------------|
| Kibana | `connector:kibana` or `connector:all` or `*` |
| Sentry | `connector:sentry` or `connector:all` or `*` |
| Grafana | `connector:grafana` or `connector:all` or `*` |
| Logs | `retrieval` or `*` |
