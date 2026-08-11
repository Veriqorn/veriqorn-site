# Actualizaciones de la plataforma (Self-hosted)

Esta guia describe como actualizar Veriqorn en una configuracion Docker self-hosted sin perder datos.

Para actualizaciones rutinarias, use **Configuracion → Actualizaciones de la
plataforma** despues de configurar una vez el agente indicado abajo. El flujo
manual de esta guia es para mantenimiento controlado, fijar una version
Community especifica o recuperacion.

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

## Paso 2 - Elegir una version para actualizacion manual (avanzado)

Establezca la version de la plataforma en `.env`:

```env
PLATFORM_VERSION=v1.2.0
```

Si mantiene `latest`, cada actualizacion descargara la imagen publicada mas reciente.

---

## Paso 3 - Descargar y aplicar una actualizacion manual

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
- el estado de la licencia Enterprise AI sigue siendo correcto (si la utiliza)

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

## Licencia Enterprise AI durante la actualizacion

El documento de licencia Enterprise AI no esta incorporado en las imagenes Docker.

- la clave publica de verificacion de Veriqorn esta incorporada en la imagen Enterprise
- el sobre de licencia firmado se carga desde el montaje de solo lectura `VERIQORN_LICENSE_FILE` o se almacena mediante el endpoint administrativo de activacion

Mientras su base de datos se conserve, el estado de la licencia tambien se conserva.

---

## Lista de verificacion de seguridad

- No ejecute `docker compose down -v` a menos que desee intencionalmente una limpieza total de datos.
- No cambie ni elimine `VERIQORN_POSTGRES_VOLUME` / `VERIQORN_MINIO_VOLUME` a menos que este migrando el almacenamiento de forma intencional.
- Mantenga `.env` en respaldo y gestion de secretos.
- Realice respaldos regulares de la BD y MinIO antes de cada actualizacion en produccion.
- Prefiera etiquetas de release fijas en lugar de `latest` en produccion.

---

## Ruta recomendada: actualizar desde la interfaz

Un administrador de la plataforma puede iniciar actualizaciones habituales en **Configuracion → Actualizaciones de la plataforma**. La configuracion inicial debe hacerla un operador de servidor de confianza.

Agregue un secreto unico a `.env`; no reutilice `JWT_SECRET`, contrasenas de base de datos ni secretos de otra instalacion:

```env
PLATFORM_UPDATE_AGENT_TOKEN=reemplace-por-un-secreto-aleatorio-de-al-menos-32-caracteres
```

Despues recree la instalacion una vez para que Docker cree el servicio privado `update-agent`:

```bash
docker compose --env-file .env -f docker-compose.yml up -d
```

El agente no se publica en un puerto del host. Selecciona la ultima version estable, descarga las imagenes de Veriqorn, registra sus digests inmutables, actualiza `PLATFORM_VERSION`, recrea los servicios de aplicacion y espera el health check del backend. Los volumenes de PostgreSQL y MinIO se conservan.

1. Abra **Configuracion → Actualizaciones de la plataforma**.
2. Revise la version disponible y sus notas.
3. Seleccione **Instalar actualizacion** y espere el estado informado por el trabajo.

Solo el agente de actualizacion tiene acceso al Docker socket, equivalente a acceso root al servidor. No exponga el agente mediante un reverse proxy o puerto del host, limite el acceso a `.env` y rote `PLATFORM_UPDATE_AGENT_TOKEN` si puede haberse expuesto. No hay rollback automatico si falla el health check, porque la version puede haber aplicado una migracion irreversible. Use las copias de seguridad y el procedimiento de recuperacion anterior.
