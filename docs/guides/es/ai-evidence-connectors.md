# Conectores de Evidencia

Los conectores de evidencia permiten al modulo de IA obtener contexto adicional de herramientas externas de observabilidad al analizar fallos en los tests.

## Conectores compatibles

| Conector | Caso de uso | Token de licencia |
|----------|-------------|-------------------|
| **Kibana** | Logs de aplicacion, descubrimiento de logs | `connector:kibana` |
| **Sentry** | Eventos de error, stack traces, seguimiento de incidencias | `connector:sentry` |
| **Grafana** | Metricas, dashboards, telemetria de alertas | `connector:grafana` |
| **Logs** | Endpoint generico de logs para proveedores personalizados | `retrieval` |

## Configuracion a traves de la interfaz de Settings

1. Abre **Settings > AI Analysis**
2. Desplazate hasta la seccion **Connector Settings**
3. Para cada conector (Kibana, Sentry, Grafana, Logs):
   - Activa el **interruptor de habilitacion** en el lado derecho de la tarjeta del conector
   - Al habilitarlo, aparecen los campos de entrada:
     - **Endpoint URL** — la URL base de tu servicio (por ejemplo, `https://kibana.internal.company.com`)
     - **API Key** — clave de autenticacion opcional para el servicio
   - Haz clic en **Test Connection** para verificar la conectividad — muestra el estado (exito/error) y la latencia
4. Haz clic en **Save Connectors** para guardar todos los ajustes de conectores

## Configuracion a traves de la API

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

## Probar un conector

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

Respuesta:

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

Estados posibles:
- `ok` — el endpoint es accesible
- `invalid` — el endpoint es inaccesible o devolvio un error
- `disabled` — el conector esta deshabilitado en la configuracion

## Como se utilizan los conectores

Cuando se invoca `POST /ai-analysis/failures/analyze`:

1. El sistema recopila el contexto del fallo (mensaje de error, stack trace, historial del test)
2. Consulta el indice de codigo en busca de archivos fuente relevantes
3. Si los conectores estan habilitados, los consulta para obtener evidencia adicional:
   - **Kibana** — busca entradas de log alrededor de la marca de tiempo del fallo
   - **Sentry** — busca eventos de error coincidentes
   - **Grafana** — verifica anomalias en los dashboards de metricas
4. Toda la evidencia se fusiona, se ordena por relevancia y se devuelve en la respuesta

## Requisitos de los conectores

Cada conector requiere su token de funcionalidad de licencia correspondiente. Sin el token, el endpoint del conector devuelve `403 AI_PRO_REQUIRED`.

| Conector | Token de licencia requerido |
|----------|----------------------------|
| Kibana | `connector:kibana` o `connector:all` o `*` |
| Sentry | `connector:sentry` o `connector:all` o `*` |
| Grafana | `connector:grafana` o `connector:all` o `*` |
| Logs | `retrieval` o `*` |
