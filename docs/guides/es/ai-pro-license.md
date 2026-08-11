# Activación de una licencia Enterprise de Veriqorn

Enterprise utiliza imágenes Enterprise autorizadas y una licencia offline
vinculada a la instalación. Una licencia no añade módulos privados a una imagen
Community y copiar su JSON a otro servidor no la activa.

## Elija su escenario

### Nueva instalación Enterprise

1. Complete una vez el [Quick Start](quick-start-installation.md) para crear el
   despliegue, la cuenta administradora y la identidad de la instalación.
2. Inicie sesión como administrador y abra **Settings → Plan & license**.
3. Seleccione **Download activation request** y envíe el JSON a Veriqorn.
4. Tras recibir la licencia, continúe con **Preparar el overlay Enterprise**.

### Instalación Community existente

1. Inicie sesión como administrador y abra **Settings → Plan & license**.
2. Seleccione **Download activation request** y envíe el JSON a Veriqorn.
3. Tras recibir la licencia, continúe con **Preparar el overlay Enterprise**.

Es una transición en el mismo lugar: el overlay sustituye solo `backend` y
`frontend`. PostgreSQL, MinIO, volúmenes, proyectos, usuarios e historial de
ejecuciones se conservan. No ejecute `docker compose down -v` ni reinstale.

## Preparar el overlay Enterprise

Este paso requiere un operador de servidor de confianza con acceso al directorio
de despliegue y a Docker. No puede realizarse solo desde la UI porque cambia las
imágenes que ejecuta Docker.

Descargue los archivos junto a `docker-compose.yml` y `.env`:

```bash
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/compose.enterprise.yml
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/.env.enterprise.example
cp .env.enterprise.example .env.enterprise
```

Guarde el JSON emitido fuera de Git, por ejemplo
`./licenses/veriqorn-license.json`. En `.env.enterprise` establezca:

```env
VERIQORN_LICENSE_FILE=./licenses/veriqorn-license.json
VERIQORN_INSTALLATION_KEY_ENCRYPTION_KEY=<secreto-base64url-de-32-bytes>
```

Conserve los valores immutable autorizados de `ENTERPRISE_BACKEND_IMAGE` y
`ENTERPRISE_FRONTEND_IMAGE`. Aplique el overlay:

```bash
docker compose --env-file .env --env-file .env.enterprise \
  -f docker-compose.yml -f compose.enterprise.yml up -d
```

## Activar mediante la UI

Con el overlay en ejecución, vuelva a **Settings → Plan & license**. Seleccione
**Activate license**, cargue o pegue el JSON emitido y confirme. Para una
renovación de la misma instalación, use **Replace license**. El archivo debe
seguir montado en el servidor, como requiere el overlay.

## Alternativa de consola y API

Para automatización o entornos aislados:

```bash
curl http://localhost:3001/api/v1/ai/license-activation-request \
  -b "auth_token=<su-sesion>" \
  -o veriqorn-activation-request.json

curl -X POST http://localhost:3001/api/v1/ai/license-activations \
  -H "Content-Type: application/json" \
  -b "auth_token=<su-sesion>" \
  --data-binary @veriqorn-license.json
```

Cada instalación production, staging o air-gapped necesita su propia solicitud
y licencia. La verificación es local y no necesita Internet permanente.

## Solución de problemas

| Síntoma | Resolución |
|---|---|
| `not_configured` | Verifique la imagen Enterprise y el montaje de solo lectura del archivo. |
| `invalid` | Obtenga la licencia de nuevo y confirme que pertenece a esta instalación. |
| `expired` | Solicite una renovación; Community continúa disponible. |
| Capacidad no disponible | Verifique el entitlement y que el overlay Enterprise esté en ejecución. |
