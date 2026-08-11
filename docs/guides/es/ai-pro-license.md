# Activación de una licencia Enterprise de Veriqorn

Veriqorn Community funciona sin licencia de producto. Las capacidades de
Enterprise AI funcionan offline con una licencia firmada y vinculada a una sola
instalación. Copiar el JSON a otro servidor no activa Enterprise allí.

## Antes de comenzar

Use el overlay Enterprise del repositorio público de instalación. Monta la
licencia como solo lectura y la imagen Enterprise ya contiene la clave pública
de Veriqorn para verificar firmas. El cliente nunca recibe la clave privada
emisora de Veriqorn.

Una licencia Enterprise no agrega módulos privados a una imagen Community ya
ejecutándose. Para pasar una instalación Community existente a Enterprise,
aplique `compose.enterprise.yml`: solo reemplaza los contenedores `backend` y
`frontend` por las imágenes Enterprise autorizadas. PostgreSQL, MinIO, los
volúmenes, proyectos e historial de ejecuciones se conservan; no es necesario
reinstalar.

Genere y conserve `VERIQORN_INSTALLATION_KEY_ENCRYPTION_KEY`: un secreto
base64url de 32 bytes que cifra la identidad privada local de la instalación.

## 1. Exporte una solicitud de activación

Inicie una vez la instalación Enterprise. Un administrador descarga la
solicitud en **Settings → Plan** o llama a:

```bash
curl http://localhost:3001/api/v1/edition/license-activation-request \
  -b "auth_token=<su-sesión>" \
  -o veriqorn-activation-request.json
```

Envíe este JSON a Veriqorn por el canal acordado. Contiene el ID, la clave
pública y el fingerprint de la instalación; no contiene resultados de pruebas,
proyectos, claves privadas de instalación ni claves de firma de Veriqorn.

Cada instalación de producción, staging o aislada necesita su propia solicitud
y licencia.

## 2. Reciba y monte la licencia

Veriqorn firma una licencia schema-v3 con su clave privada emisora. Incluye el
payload, firma Ed25519 con `keyId`, vencimiento, vínculo de instalación y los
entitlements concedidos, como `ai.analysis` o `ai.rag`.

Guarde el JSON fuera de Git y configure su ruta:

```env
VERIQORN_LICENSE_FILE=./licenses/veriqorn-license.json
```

```bash
docker compose --env-file .env --env-file .env.enterprise \
  -f docker-compose.yml -f compose.enterprise.yml up -d
```

También puede activarlo mediante API administrativa:

```bash
curl -X POST http://localhost:3001/api/v1/edition/license-activations \
  -H "Content-Type: application/json" \
  -b "auth_token=<su-sesión>" \
  --data-binary @veriqorn-license.json
```

## 3. Verifique el estado

```bash
curl http://localhost:3001/api/v1/edition -b "auth_token=<su-sesión>"
```

La respuesta muestra el estado y solo los entitlements emitidos para esta
instalación. La licencia no sustituye los permisos normales de usuario.

## Offline, renovación y recuperación

- La verificación es local; no requiere conexión permanente.
- Para renovar, Veriqorn emite un nuevo JSON para la misma instalación.
- Para reemplazar un host o recuperar una identidad perdida, exporte una nueva
  solicitud y pida una licencia de reemplazo.
- Respalde juntos la base de datos, el JSON de licencia y el secreto de cifrado
  de identidad. Nunca respalde ni distribuya la clave privada emisora de
  Veriqorn.

## Solución de problemas

| Síntoma | Resolución |
|---|---|
| `not_configured` | Verifique la imagen Enterprise y el montaje de licencia. |
| `invalid` | Solicite de nuevo el JSON a Veriqorn y confirme que pertenece a esta instalación. |
| `expired` | Solicite una renovación; Community sigue disponible. |
| Capacidad no disponible | Confirme el entitlement y que la extensión Enterprise esté instalada. |
