# Inicio Rapido — Guia de Instalacion

QA Report Platform se distribuye como imagenes Docker preconstruidas en GitHub Container Registry (GHCR). Puede tener la plataforma completa funcionando en menos de cinco minutos con un solo comando `docker compose`.

---

## Requisitos previos

- **Docker** 20.10+ y **Docker Compose** v2 (o el plugin `docker-compose`).
- Puertos **3000**, **3001**, **5432**, **9000**, **9001** disponibles en el host.
- Al menos **2 GB** de RAM libre para todos los servicios.

No se requieren otras dependencias — el archivo compose incluye PostgreSQL, MinIO (almacenamiento compatible con S3) e inicializacion automatica de buckets.

---

## Paso 1 — Descargar el archivo Compose

Descargue el archivo compose de instalacion desde el repositorio:

```bash
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/docker-compose.yml
```

O copielo manualmente desde la raiz del repositorio `veriqorn-install`: `docker-compose.yml`.

---

## Paso 2 — Crear el archivo de entorno

Cree un archivo `.env` junto al archivo compose:

```bash
cat > .env <<'EOF'
# Required
JWT_SECRET=replace-with-a-long-random-secret
POSTGRES_PASSWORD=replace-with-a-strong-postgres-password
MINIO_ROOT_PASSWORD=replace-with-a-strong-minio-password

# Optional — override defaults if needed
# PLATFORM_VERSION=latest
# POSTGRES_USER=postgres
# POSTGRES_DB=test_ops
# MINIO_ROOT_USER=minioadmin
# NEXT_PUBLIC_API_URL=http://localhost:3001
# FRONTEND_URL=http://localhost:3000
EOF
```

> **Importante:** Reemplace `JWT_SECRET` con un valor aleatorio seguro para uso en produccion.

### Referencia de variables de entorno

| Variable | Valor por defecto | Descripcion |
|----------|-------------------|-------------|
| `JWT_SECRET` | *(obligatorio)* | Clave secreta para firmar tokens JWT |
| `PLATFORM_VERSION` | `latest` | Etiqueta de imagen Docker (`latest`, `v1.0.0`, etc.) |
| `POSTGRES_USER` | `postgres` | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | *(obligatorio)* | Contrasena de PostgreSQL |
| `POSTGRES_DB` | `test_ops` | Nombre de la base de datos |
| `MINIO_ROOT_USER` | `minioadmin` | Usuario administrador de MinIO |
| `MINIO_ROOT_PASSWORD` | *(obligatorio)* | Contrasena de administrador de MinIO |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | URL del backend visible para el navegador |
| `FRONTEND_URL` | `http://localhost:3000` | URL del frontend para CORS |
| `AI_ANALYSIS_LICENSE_PUBLIC_KEY` | *(vacio)* | Clave publica para verificacion de licencia AI Pro (opcional) |

---

## Paso 3 — Iniciar la plataforma

```bash
docker compose -f docker-compose.yml up -d
```

Docker descargara las imagenes desde GHCR e iniciara todos los servicios. El primer inicio puede tardar 1-2 minutos mientras se descargan las imagenes y se inicializa la base de datos.

Verifique que todos los contenedores esten en ejecucion:

```bash
docker compose -f docker-compose.yml ps
```

Deberia ver cinco servicios: `frontend`, `backend`, `postgres`, `minio` y `minio-init` (termina despues de crear los buckets).

---

## Paso 4 — Abrir la plataforma

| Servicio | URL |
|----------|-----|
| **Frontend** (UI) | [http://localhost:3000](http://localhost:3000) |
| **Backend** (API) | [http://localhost:3001](http://localhost:3001) |
| **Consola de MinIO** | [http://localhost:9001](http://localhost:9001) |

### Credenciales por defecto

| Usuario | Email | Contrasena |
|---------|-------|------------|
| Admin | `admin@example.com` | `admin123` |
| User | `user@example.com` | `user123` |

> Cambie las contrasenas por defecto despues del primer inicio de sesion en despliegues de produccion.

---

## Paso 5 — Subir sus primeros resultados

Autentiquese y suba resultados de Allure para verificar la instalacion:

```bash
# 1. Login and get a JWT token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# 2. Upload a single result file
curl -X POST http://localhost:3001/upload/allure-results \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your-result.json" \
  -F "runName=First Run" \
  -F "environment=local"

# 3. Or upload a ZIP from CI
curl -X POST http://localhost:3001/upload/ci/allure-results \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@allure-results.zip" \
  -F "runName=CI Run" \
  -F "project=my-project"
```

Abra [http://localhost:3000](http://localhost:3000) — su ejecucion deberia aparecer en la pagina de Lanzamientos.

---

## Actualizacion

Para actualizar a una version mas reciente:

```bash
# Pull new images
docker compose -f docker-compose.yml pull

# Restart with zero downtime
docker compose -f docker-compose.yml up -d
```

O fije una version especifica en `.env`:

```bash
PLATFORM_VERSION=v1.2.0
```

---

## Fijar una version

Por defecto, `PLATFORM_VERSION=latest` descarga la compilacion mas reciente. Para produccion, fije una etiqueta de release:

```bash
PLATFORM_VERSION=v1.0.0
```

Las etiquetas disponibles se listan en la [pagina de paquetes de Veriqorn](https://github.com/orgs/veriqorn/packages).

---

## Detencion y limpieza

```bash
# Stop all services (data is preserved in volumes)
docker compose -f docker-compose.yml down

# Stop and remove all data (database, files)
docker compose -f docker-compose.yml down -v
```

---

## Solucion de problemas

| Sintoma | Causa | Solucion |
|---------|-------|----------|
| Error `JWT_SECRET is required` al iniciar | Falta el archivo `.env` o `JWT_SECRET` esta vacio | Cree un archivo `.env` con un valor para `JWT_SECRET` |
| El backend se detiene con error de conexion a la base de datos | PostgreSQL aun no esta listo | Espere 10-15 segundos y verifique de nuevo — el healthcheck garantiza el inicio ordenado |
| El frontend muestra "Network Error" | El backend no es accesible desde el navegador | Verifique que `NEXT_PUBLIC_API_URL` coincida con la direccion publica del backend |
| No se pueden descargar imagenes de GHCR | Las imagenes son privadas o tienen limite de tasa | Verifique que las imagenes sean publicas, o ejecute `docker login ghcr.io` con un token de GitHub |
| El puerto 3000/3001 ya esta en uso | Otro servicio ocupa el puerto | Detenga el servicio en conflicto o reasigne los puertos en el archivo compose |

---

## Siguientes pasos

- **Integracion CI/CD**: Consulte los ejemplos de carga anteriores o configure un [pipeline de Test Rerun](test-rerun-setup.md).
- **Funcionalidades AI Pro**: Instale una licencia AI Pro para habilitar el analisis de fallos, la indexacion de repositorios y la inteligencia de cobertura. Consulte [Licencia AI Pro](ai-pro-license.md).
- **Conexion LLM**: Conecte un proveedor de LLM local o en la nube para el analisis con IA. Consulte [Conexion LLM](ai-llm-connection.md).
