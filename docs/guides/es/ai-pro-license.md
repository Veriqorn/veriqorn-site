# Activacion de la licencia AI Pro

AI Pro funciona sin una conexion permanente a Internet. Cada licencia se emite
para una instalacion de Veriqorn: copiar el JSON a otra empresa o entorno no
activa AI Pro alli.

## 1. Configure la clave de verificacion

Su contacto de Veriqorn le proporcionara una clave publica Ed25519. Configurela
en el entorno del backend antes de activar la licencia:

```env
AI_ANALYSIS_LICENSE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...clave publica proporcionada por Veriqorn...
-----END PUBLIC KEY-----"
```

Reinicie el backend despues de cambiar las variables de entorno. La clave
privada de firma permanece en Veriqorn y nunca debe entrar al entorno del
cliente.

## 2. Exporte una solicitud de activacion

Un administrador abre **Settings → General → Plan** y selecciona **Download
activation request**. El navegador descarga
`veriqorn-activation-request.json` desde la instalacion que usara AI Pro.

La llamada API equivalente esta disponible para flujos automatizados:

```bash
curl http://localhost:3001/api/v1/ai/license-activation-request \
  -b "auth_token=<su-jwt>" \
  -o veriqorn-activation-request.json
```

Envie este JSON a Veriqorn por el canal de soporte acordado. Contiene el
identificador de la instalacion y la clave publica necesaria para vincular la
licencia; no contiene resultados de pruebas, proyectos ni secretos de firma.

Cada instalacion de produccion, staging o red aislada necesita su propia
solicitud y licencia.

## 3. Reciba e instale la licencia

Veriqorn devolvera un envelope firmado similar al siguiente:

```json
{
  "payload": {
    "version": 2,
    "licenseId": "lic_abc123",
    "customerId": "your-company",
    "customer": "Your Company",
    "issuedAt": "2026-08-09T00:00:00.000Z",
    "expiresAt": "2030-12-31T23:59:59.999Z",
    "features": ["analysis", "indexing", "retrieval", "connector:all"],
    "installationId": "installation-id",
    "installationKeyFingerprint": "installation-key-fingerprint"
  },
  "signature": "base64-signature"
}
```

En **Settings → General → Plan**, seleccione **Activate License**, elija el
archivo JSON emitido por Veriqorn y seleccione **Activate License** de nuevo.
Tambien puede pegar el JSON completo en el dialogo. Un administrador puede
activarlo mediante la API para flujos automatizados:

```bash
curl -X POST http://localhost:3001/api/v1/ai/license-activations \
  -H "Content-Type: application/json" \
  -b "auth_token=<su-jwt>" \
  --data-binary @veriqorn-license.json
```

La activacion cambia automaticamente la instalacion al modo `pro_self_hosted`.

## 4. Verifique el estado

```bash
curl http://localhost:3001/api/v1/ai/capabilities \
  -b "auth_token=<su-jwt>"
```

La respuesta debe mostrar `"status": "licensed"` y las funcionalidades de la
licencia.

## Solucion de problemas

| Sintoma | Solucion |
|---|---|
| `status: "invalid"` y error de clave de verificacion | Compruebe que `AI_ANALYSIS_LICENSE_PUBLIC_KEY` contiene la clave de Veriqorn y reinicie el backend. |
| `status: "invalid"` y mensaje de otra instalacion | Exporte una solicitud nueva desde esta instalacion y solicite una licencia propia. |
| `status: "expired"` | Contacte con Veriqorn para renovar. |
| Una funcionalidad esta deshabilitada | No esta incluida en la licencia. Contacte con Veriqorn para cambiar los permisos. |
