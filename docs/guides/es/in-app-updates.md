# Actualizaciones desde la interfaz para instalaciones self-hosted

Las actualizaciones desde la interfaz permiten que un administrador vea una version publicada e inicie la actualizacion normal desde **Configuracion → Actualizaciones de la plataforma**. La configuracion inicial sigue requiriendo un operador de servidor de confianza; las actualizaciones habituales ya no requieren CLI en el servidor.

## Antes de empezar

- Instale la plataforma con el `docker-compose.yml` compatible de `veriqorn-install`.
- Utilice un host Docker controlado por su organizacion.
- Mantenga copias de seguridad de PostgreSQL y MinIO. Una migracion de base de datos puede hacer que el rollback no sea seguro.

## Configuracion unica

Copie `.env.example` a `.env` y establezca un secreto unico para update-agent:

```env
PLATFORM_UPDATE_AGENT_TOKEN=reemplace-por-un-secreto-aleatorio-de-al-menos-32-caracteres
```

Genere este valor con la herramienta de gestion de secretos de su organizacion. No reutilice `JWT_SECRET`, contrasenas de base de datos ni un secreto de otra instalacion.

Inicie o recree la instalacion una vez para que Docker cree el servicio local `update-agent`:

```bash
docker compose --env-file .env -f docker-compose.yml up -d
```

El agente no publica un puerto en el host. El backend solo puede acceder a el mediante la red privada de Docker Compose.

## Actualizar la plataforma

1. Inicie sesion como administrador de plataforma.
2. Abra **Configuracion → Actualizaciones de la plataforma**.
3. Revise la version disponible y las notas de la version.
4. Seleccione **Instalar actualizacion** y espere el estado del trabajo.

El agente selecciona la ultima GitHub Release estable, descarga solo las imagenes backend y frontend de Veriqorn, registra sus digests inmutables, actualiza `PLATFORM_VERSION`, recrea esos servicios y espera el health check del backend. Los volumes de PostgreSQL y MinIO se conservan.

## Seguridad y recuperacion

Solo update-agent tiene acceso al Docker socket. Ese acceso equivale a acceso root al servidor: no exponga el agente mediante un puerto del host ni un reverse proxy. Mantenga `.env` disponible solo para operadores de confianza y rote `PLATFORM_UPDATE_AGENT_TOKEN` si puede haberse expuesto.

El agente no realiza rollback automatico cuando falla un health check porque una version podria haber aplicado una migracion irreversible. Use sus copias de seguridad y el [manual de actualizacion](./system-update-guide.md) para la recuperacion manual.
