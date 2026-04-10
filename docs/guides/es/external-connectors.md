# Conectores de Sistemas Externos

QA Report Platform permite consultar sistemas externos (Sentry, Kibana, Grafana, etc.) para obtener evidencia adicional durante el analisis de fallos con IA. Esta guia explica la arquitectura de plugins y como agregar nuevos tipos de conectores.

## Arquitectura

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

### Componentes principales

| Componente | Archivo | Proposito |
|------------|---------|-----------|
| `ConnectorPlugin` | `connectors/connector-plugin.interface.ts` | Interfaz que todo conector debe implementar |
| `ConnectorRegistry` | `connectors/connector-registry.ts` | Registro central de plugins disponibles |
| `connectorFetch` | `connectors/base-http-connector.ts` | Cliente HTTP compartido con reintentos/timeout |
| `AiAnalysisConnectorsService` | `services/ai-analysis-connectors.service.ts` | Orquesta configuracion + ejecucion de plugins |

## Interfaz ConnectorPlugin

Cada conector debe implementar dos metodos:

```typescript
interface ConnectorPlugin {
  readonly type: string;
  healthCheck(config: ConnectorConfigResolved): Promise<ConnectorHealthResult>;
  fetchEvidence(config: ConnectorConfigResolved, context: ConnectorQueryContext): Promise<ConnectorEvidenceItem[]>;
}
```

### `healthCheck(config)`

Se invoca cuando el usuario hace clic en "Test Connection" en la interfaz. Debe realizar una solicitud HTTP real al endpoint de salud/estado del sistema externo y devolver:

- `ok` — el sistema es accesible y esta autenticado
- `auth_failed` — respuesta 401/403
- `timeout` — la solicitud expiro
- `error` — cualquier otro fallo

Incluye `responseTimeMs` para que la interfaz muestre la latencia.

### `fetchEvidence(config, context)`

Se invoca durante el analisis de fallos con IA. Recibe:

- `config` — URL del endpoint, API key, timeout, etc.
- `context` — mensaje de fallo, stack trace, nombre del test, marcas de tiempo, ventana de tiempo

Devuelve un array de objetos `ConnectorEvidenceItem` que se fusionan en el pipeline de analisis junto con la evidencia de codigo.

## Agregar un nuevo conector

### Paso 1: Crear el archivo del plugin

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

### Paso 2: Registrar en AppModule

```typescript
// backend/src/app.module.ts
import { PagerDutyConnectorPlugin } from "./connectors/pagerduty-connector.plugin";

// Add to providers array:
providers: [
  // ...existing providers
  PagerDutyConnectorPlugin,
]
```

El plugin se auto-registra en el `ConnectorRegistry` a traves de su constructor — no se necesita ninguna otra configuracion.

### Paso 3: Agregar token de licencia (opcional)

Si el conector debe estar restringido por licencia, agrega una verificacion de funcionalidad en `ai-analysis-edition.service.ts`:

```typescript
pagerdutyConnector: toAvailability(
  isFeatureEnabled(["connector:pagerduty", "pagerduty"], true),
),
```

### Paso 4: Escribir tests

Crea `pagerduty-connector.plugin.spec.ts` con respuestas HTTP simuladas:

```typescript
// Mock connectorFetch to avoid real HTTP calls
jest.mock("./base-http-connector", () => ({
  connectorFetch: jest.fn(),
}));
```

Prueba las respuestas del health check (200, 401, 500, timeout) y la obtencion de evidencia con respuestas de API de ejemplo.

## Conectores integrados

### Sentry (`sentry`)

Consulta la API de busqueda de incidencias de Sentry para encontrar errores que coincidan con el mensaje de fallo dentro de una ventana de tiempo. Obtiene los eventos mas recientes de cada incidencia para extraer frames del stack.

**Configuracion**: URL del endpoint (por ejemplo, `https://sentry.io`), token de autenticacion de la API.

### Kibana / Elasticsearch (`kibana`)

Busca en los logs de la aplicacion a traves de la API `_search` de Elasticsearch. Soporta tanto endpoints directos de ES como solicitudes a traves del proxy de Kibana. Extrae palabras clave significativas de los mensajes de fallo.

**Configuracion**: URL del endpoint, API key. Opcional: patron de indice a traves del nombre/headers del conector.

### Grafana (`grafana`)

Consulta anotaciones e historial de alertas alrededor de la ventana de tiempo del fallo. Las alertas en estado `firing` reciben puntuaciones de relevancia mas altas.

**Configuracion**: URL del endpoint (por ejemplo, `https://grafana.example.com`), token de cuenta de servicio.

## Puntuacion de evidencia

Cada conector asigna un `relevanceScore` (0–1) a sus elementos de evidencia. El pipeline de analisis fusiona toda la evidencia (codigo + externa) y la ordena por puntuacion. Directrices:

- **0.80–0.90**: Coincidencia fuerte (mensaje de error exacto encontrado en Sentry, alerta activa en el momento del fallo)
- **0.50–0.79**: Coincidencia moderada (logs relacionados encontrados, patrones de error similares)
- **0.30–0.49**: Contextual (anotaciones, alertas resueltas, logs tangencialmente relacionados)
- Limitar los elementos individuales a **0.90** para evitar que la evidencia externa domine sobre la evidencia de codigo

## Configuracion

Los usuarios configuran los conectores a traves de Settings > AI Analysis > Connector Settings. Cada instancia de conector tiene:

- **Type** — que plugin lo gestiona (sentry, kibana, grafana, etc.)
- **Name** — etiqueta legible
- **Endpoint URL** — URL base del sistema externo
- **API Key** — token de autenticacion (cifrado en reposo)
- **Timeout** — tiempo limite de solicitud en milisegundos (por defecto 10s)
- **Enabled** — activar/desactivar sin eliminar la configuracion

Se admiten multiples instancias del mismo tipo (por ejemplo, dos conectores Kibana para diferentes clusters).
