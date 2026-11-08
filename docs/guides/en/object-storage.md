# Amazon S3 and MinIO storage

Starting with v0.2.35, platform administrators can manage storage under **Settings → Storage** in Community and Enterprise.

## Configure a connection

1. Generate an encryption key on the server:

   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

2. Add it as `VERIQORN_STORAGE_ENCRYPTION_KEY` in `.env`, recreate the backend, and apply backend migrations. Keep the key with your backups, separately from the database.
3. Create a private AWS S3 bucket in the intended region. In Storage settings enter a connection name, region, bucket, optional prefix, access key, and secret key. Temporary credentials also need a session token and must be kept valid manually.
4. Select **Check connection** to verify writing, reading, and deleting a test object.
5. Select **Activate**. The application repeats the check and directs subsequent uploads to this connection without a restart.

For MinIO, select that provider and enter its HTTP(S) server URL and an existing bucket. Saved credentials are encrypted and never returned by the settings API.

Grant object read/write/delete permissions beneath the chosen prefix, including `.veriqorn-check/`. Multipart uploads and KMS-encrypted buckets need the corresponding additional permissions. Check representative large attachments with your actual AWS policy before production use. Downloads and previews continue through authenticated application endpoints; keep the bucket private.

## Existing files

Activation affects new uploads. Existing files keep their original connection, and small text/JSON attachments retain the database storage policy. Keep previous connections, credentials, and the original MinIO service available while they contain referenced files. Automatic migration and IAM role credential refresh are separate follow-ups.

## Fresh installation without MinIO

Use Docker Compose 2.24.4 or later and the standard installation `.env`. Retain its MinIO variables for base-file interpolation, even though the overlay disables those services. Download the overlay and start:

```bash
curl -fsSLO https://raw.githubusercontent.com/Veriqorn/veriqorn/main/deploy/compose.s3.yml
docker compose -f docker-compose.yml -f compose.s3.yml up -d
```

Before a connection is activated, attachments are stored in PostgreSQL. Apply this overlay to an existing installation only after all files referencing its bundled MinIO have been migrated. For Enterprise, apply `compose.enterprise.yml` before `compose.s3.yml` and set `UPDATE_COMPOSE_FILES=/install/docker-compose.yml,/install/compose.enterprise.yml,/install/compose.s3.yml`.

See the [complete storage reference](https://github.com/Veriqorn/veriqorn/blob/main/docs/object-storage.md) for API and upgrade details.
