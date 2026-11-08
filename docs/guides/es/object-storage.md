# Almacenamiento Amazon S3 y MinIO

Desde v0.2.35, los administradores pueden gestionar el almacenamiento en **Settings → Storage**, tanto en Community como en Enterprise.

## Configurar una conexión

1. Genere una clave de cifrado en el servidor:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

2. Añádala a `.env` como `VERIQORN_STORAGE_ENCRYPTION_KEY`, vuelva a crear el backend y aplique las migraciones. Guarde una copia de la clave por separado de la base de datos.
3. Cree un bucket privado de AWS S3 en la región deseada. Indique nombre, región, bucket, prefijo opcional, Access Key y Secret Key en la configuración. Las credenciales temporales también necesitan Session Token; su vigencia debe mantenerse manualmente.
4. Pulse **Check connection** para comprobar la escritura, lectura y eliminación de un objeto de prueba.
5. Pulse **Activate**. La aplicación repetirá la comprobación y enviará las siguientes cargas a esta conexión sin reiniciar.

Para MinIO, seleccione ese proveedor e indique la URL HTTP(S) del servidor y un bucket existente. Las credenciales guardadas se cifran y nunca se devuelven mediante la API de configuración.

Conceda permisos de lectura, escritura y eliminación bajo el prefijo elegido, incluido `.veriqorn-check/`. Las cargas multipart y los buckets cifrados con KMS necesitan permisos adicionales. Antes de usarlo en producción, compruebe archivos grandes con su política real de AWS. Las descargas y vistas previas siguen pasando por los endpoints autenticados de la aplicación; mantenga el bucket privado.

## Archivos existentes

La activación afecta a nuevas cargas. Los archivos existentes conservan su conexión original y los adjuntos pequeños de texto/JSON mantienen la política de almacenamiento en la base de datos. Conserve las conexiones, credenciales y el MinIO original mientras existan archivos que los referencien. La migración automática y la renovación de credenciales de roles IAM quedan para etapas posteriores.

## Instalación nueva sin MinIO

Use Docker Compose 2.24.4 o posterior y el `.env` estándar de instalación. Mantenga las variables de MinIO para interpolar el archivo base, aunque el overlay desactive sus servicios. Descargue el overlay e inicie:

```bash
curl -fsSLO https://raw.githubusercontent.com/Veriqorn/veriqorn/main/deploy/compose.s3.yml
docker compose -f docker-compose.yml -f compose.s3.yml up -d
```

Hasta activar una conexión, los adjuntos se guardan en PostgreSQL. Aplique este overlay a una instalación existente solo después de migrar todos los archivos que referencien su MinIO. En Enterprise, aplique `compose.enterprise.yml` antes de `compose.s3.yml` y configure `UPDATE_COMPOSE_FILES=/install/docker-compose.yml,/install/compose.enterprise.yml,/install/compose.s3.yml`.

Consulte la [referencia completa](https://github.com/Veriqorn/veriqorn/blob/main/docs/object-storage.md) para la API y la actualización.
