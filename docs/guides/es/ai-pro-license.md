# Activacion de la licencia Pro

El modulo de IA opera en dos modos:

- **`oss_stub`** (por defecto) — todas las funcionalidades de IA estan deshabilitadas, la plataforma funciona como una herramienta de reportes estandar
- **`pro_self_hosted`** — las funcionalidades de IA se habilitan tras la verificacion de licencia

## Paso 1. Establecer el modo de edicion

Agregue a su archivo `.env` del backend:

```env
AI_ANALYSIS_DEFAULT_MODE=pro_self_hosted
```

O configure en tiempo de ejecucion mediante la Settings API:

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisMode \
  -H "Content-Type: application/json" \
  -b "auth_token=<your-jwt>" \
  -d '{ "value": "pro_self_hosted" }'
```

## Paso 2. Establecer la clave de verificacion de licencia

La plataforma verifica las licencias utilizando criptografia de clave publica Ed25519/RSA. Establezca la clave publica como variable de entorno:

```env
AI_ANALYSIS_LICENSE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
-----END PUBLIC KEY-----"
```

La clave puede proporcionarse en formato PEM o como un blob SPKI (DER) codificado en base64.

## Paso 3. Instalar la licencia

Una licencia es un objeto JSON con un payload firmado:

```json
{
  "payload": {
    "licenseId": "lic_abc123",
    "customer": "Your Company",
    "issuedAt": "2025-01-01T00:00:00Z",
    "expiresAt": "2026-12-31T23:59:59Z",
    "features": ["*"]
  },
  "signature": "base64-encoded-signature"
}
```

### Mediante la interfaz de Settings (recomendado)

1. Abra **Settings > General**
2. En la seccion **Plan**, haga clic en **Activate License**
3. Pegue el JSON completo de la licencia en el area de texto
4. Haga clic en **Activate**
5. Si tiene exito, el estado de la licencia se actualiza inmediatamente — el banner "Pro is locked" desaparece y todas las funcionalidades de IA quedan disponibles

### Mediante API

```bash
# Using the activation endpoint (auto-sets mode to pro_self_hosted)
curl -X POST http://localhost:3001/ai-analysis/license/activate \
  -H "Content-Type: application/json" \
  -b "auth_token=<your-jwt>" \
  -d '{ "license": "{ \"payload\": {...}, \"signature\": \"...\" }" }'

# Or directly via Settings API
curl -X POST http://localhost:3001/settings/aiAnalysisLicense \
  -H "Content-Type: application/json" \
  -b "auth_token=<your-jwt>" \
  -d '{ "value": { "payload": {...}, "signature": "..." } }'
```

El endpoint de activacion establece automaticamente el modo de edicion a `pro_self_hosted`.

## Paso 4. Verificar

```bash
curl http://localhost:3001/ai-analysis/capabilities \
  -b "auth_token=<your-jwt>"
```

Respuesta esperada:

```json
{
  "mode": "pro_self_hosted",
  "status": "licensed",
  "licensed": true,
  "features": {
    "analysis": { "enabled": true },
    "indexing": { "enabled": true },
    "retrieval": { "enabled": true },
    "kibanaConnector": { "enabled": true },
    "sentryConnector": { "enabled": true },
    "grafanaConnector": { "enabled": true }
  }
}
```

## Tokens de funcionalidades

El array `features` en el payload de la licencia controla que capacidades se habilitan:

| Token | Efecto |
|-------|--------|
| `*` o `all` | Habilita todo |
| `analysis` | Analisis de fallos con IA |
| `indexing` | Indexacion de repositorios |
| `retrieval` | Recuperacion semantica de evidencia |
| `connector:all` | Todos los conectores de evidencia |
| `connector:kibana` | Solo conector de Kibana |
| `connector:sentry` | Solo conector de Sentry |
| `connector:grafana` | Solo conector de Grafana |

## Solucion de problemas

| Sintoma | Causa | Solucion |
|---------|-------|----------|
| `status: "stub"` | El modo es `oss_stub` | Establezca `AI_ANALYSIS_DEFAULT_MODE=pro_self_hosted` |
| `status: "invalid"` | Licencia no configurada | Instale la licencia mediante la Settings API |
| `status: "invalid"`, fallo de firma | Clave publica incorrecta | Verifique que `AI_ANALYSIS_LICENSE_PUBLIC_KEY` coincida con la clave de firma |
| `status: "expired"` | Licencia expirada | Instale una nueva licencia con un `expiresAt` futuro |
| La funcionalidad muestra `enabled: false` | Falta el token en la licencia | Agregue el token de funcionalidad requerido a `payload.features` |

## URL de actualizacion (opcional)

Para mostrar un enlace personalizado de actualizacion en la interfaz cuando las funcionalidades estan bloqueadas:

```env
AI_ANALYSIS_UPGRADE_URL=https://your-company.com/upgrade
```
