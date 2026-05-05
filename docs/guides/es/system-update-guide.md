# Guia de Actualizacion del Sistema (Self-hosted)

Esta guia describe como actualizar QA Report Platform en una configuracion Docker self-hosted sin perder datos.

Utilice este flujo cuando ya tenga la plataforma en ejecucion con `docker-compose.yml`.

---

## Que cambia durante la actualizacion

Al actualizar, Docker reemplaza los contenedores de aplicacion (`backend`, `frontend`) con imagenes mas recientes.

Sus datos se persisten en volumenes de Docker y no se eliminan durante una actualizacion normal:

- Datos de PostgreSQL: el volumen definido por `VERIQORN_POSTGRES_VOLUME` (por defecto `veriqorn-postgres-data`)
- Datos de MinIO: el volumen definido por `VERIQORN_MINIO_VOLUME` (por defecto `veriqorn-minio-data`)

Los datos se eliminan unicamente si usted borra explicitamente los volumenes (por ejemplo `docker compose down -v`).

---

## Requisitos previos

- Un despliegue en ejecucion basado en `docker-compose.yml`
- Acceso a `.env`
- Suficiente espacio libre en disco para los archivos de respaldo

Para el contrato canonico de variables de entorno, mantenga `.env` alineado con `veriqorn-install/.env.example`.

---

## Paso 1 - Crear respaldos (recomendado)

Cree un directorio local de respaldos:

```bash
mkdir -p backups
```

### 1.1 Respaldar PostgreSQL

```bash
docker compose --env-file .env -f docker-compose.yml exec -T postgres \
  pg_dump -U postgres test_ops > backups/postgres_pre_update.sql
```

Si utiliza credenciales o nombre de base de datos personalizados, reemplace `postgres` y `test_ops` con los valores de su `.env`.

### 1.2 Respaldar archivos de MinIO

```bash
docker compose --env-file .env -f docker-compose.yml cp \
  minio:/data backups/minio_data_pre_update
```

---

## Paso 2 - Elegir la version destino

Establezca la version de la plataforma en `.env`:

```env
PLATFORM_VERSION=v1.2.0
```

Si mantiene `latest`, cada actualizacion descargara la imagen publicada mas reciente.

---

## Paso 3 - Descargar y aplicar la actualizacion

```bash
docker compose --env-file .env -f docker-compose.yml pull
docker compose --env-file .env -f docker-compose.yml up -d
```

Lo que sucede:

- se descargan las nuevas imagenes desde GHCR
- los contenedores se recrean con la nueva version de imagen
- los volumenes existentes de PostgreSQL y MinIO se reutilizan
- el backend ejecuta las migraciones de BD al iniciar (`migrationsRun: true`)

---

## Paso 4 - Validar despues de la actualizacion

Ejecute las verificaciones:

```bash
docker compose --env-file .env -f docker-compose.yml ps
docker compose --env-file .env -f docker-compose.yml logs backend --tail 200
```

Luego verifique en la interfaz:

- puede iniciar sesion
- los lanzamientos historicos siguen presentes
- los adjuntos y artefactos siguen siendo accesibles
- el estado de AI Pro sigue siendo correcto (si lo utiliza)

---

## Procedimiento de rollback

Si algo sale mal:

1. Establezca la version anterior en `.env` (por ejemplo `PLATFORM_VERSION=v1.1.0`).
2. Ejecute:

```bash
docker compose --env-file .env -f docker-compose.yml pull
docker compose --env-file .env -f docker-compose.yml up -d
```

Si el rollback requiere restaurar datos, utilice sus respaldos del Paso 1.

---

## Notas de restauracion

### Restaurar PostgreSQL (desde volcado SQL)

```bash
cat backups/postgres_pre_update.sql | \
docker compose --env-file .env -f docker-compose.yml exec -T postgres \
  psql -U postgres test_ops
```

### Restaurar archivos de MinIO

```bash
docker compose --env-file .env -f docker-compose.yml cp \
  backups/minio_data_pre_update/. minio:/data
```

---

## Licencia Pro durante la actualizacion

La activacion de la licencia Pro no esta incorporada en las imagenes Docker.

- la clave de verificacion se lee desde `AI_ANALYSIS_LICENSE_PUBLIC_KEY` en `.env`
- el sobre de licencia firmado se almacena en la configuracion de la aplicacion (base de datos)

Mientras su base de datos se conserve, el estado de la licencia tambien se conserva.

---

## Lista de verificacion de seguridad

- No ejecute `docker compose down -v` a menos que desee intencionalmente una limpieza total de datos.
- No cambie ni elimine `VERIQORN_POSTGRES_VOLUME` / `VERIQORN_MINIO_VOLUME` a menos que este migrando el almacenamiento de forma intencional.
- Mantenga `.env` en respaldo y gestion de secretos.
- Realice respaldos regulares de la BD y MinIO antes de cada actualizacion en produccion.
- Prefiera etiquetas de release fijas en lugar de `latest` en produccion.
