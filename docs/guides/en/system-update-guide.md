# System Update Guide (Self-hosted)

This guide describes how to update QA Report Platform in a self-hosted Docker setup without losing data.

Use this flow when you already run the platform with `docker-compose.yml`.

---

## What Changes During Update

When you update, Docker replaces application containers (`backend`, `frontend`) with newer images.

Your data is persisted in Docker volumes and is not removed during a normal update:

- PostgreSQL data: `postgres_data`
- MinIO data: `minio_data`

Data is removed only if you explicitly delete volumes (for example `docker compose down -v`).

---

## Prerequisites

- A running deployment based on `docker-compose.yml`
- Access to `.env`
- Enough free disk space for backup archives

---

## Step 1 - Create Backups (Recommended)

Create a local backup directory:

```bash
mkdir -p backups
```

### 1.1 Backup PostgreSQL

```bash
docker compose --env-file .env -f docker-compose.yml exec -T postgres \
  pg_dump -U postgres test_ops > backups/postgres_pre_update.sql
```

If you use custom DB credentials or database name, replace `postgres` and `test_ops` with your values from `.env`.

### 1.2 Backup MinIO files

```bash
docker compose --env-file .env -f docker-compose.yml cp \
  minio:/data backups/minio_data_pre_update
```

---

## Step 2 - Choose Target Version

Set the platform version in `.env`:

```env
PLATFORM_VERSION=v1.2.0
```

If you keep `latest`, each update will pull the newest published image.

---

## Step 3 - Pull and Apply Update

```bash
docker compose --env-file .env -f docker-compose.yml pull
docker compose --env-file .env -f docker-compose.yml up -d
```

What happens:

- new images are downloaded from GHCR
- containers are recreated with the new image version
- existing volumes are reused
- backend runs DB migrations on startup (`migrationsRun: true`)

---

## Step 4 - Validate After Update

Run checks:

```bash
docker compose --env-file .env -f docker-compose.yml ps
docker compose --env-file .env -f docker-compose.yml logs backend --tail 200
```

Then verify in UI:

- you can sign in
- historical launches are still present
- attachments and artifacts are still accessible
- AI Pro status is still correct (if used)

---

## Rollback Procedure

If something goes wrong:

1. Set previous version in `.env` (for example `PLATFORM_VERSION=v1.1.0`).
2. Run:

```bash
docker compose --env-file .env -f docker-compose.yml pull
docker compose --env-file .env -f docker-compose.yml up -d
```

If rollback requires restoring data, use your backups from Step 1.

---

## Restore Notes

### Restore PostgreSQL (from SQL dump)

```bash
cat backups/postgres_pre_update.sql | \
docker compose --env-file .env -f docker-compose.yml exec -T postgres \
  psql -U postgres test_ops
```

### Restore MinIO files

```bash
docker compose --env-file .env -f docker-compose.yml cp \
  backups/minio_data_pre_update/. minio:/data
```

---

## Pro License During Update

Pro license activation is not baked into Docker images.

- verification key is read from `AI_ANALYSIS_LICENSE_PUBLIC_KEY` in `.env`
- signed license envelope is stored in application settings (database)

As long as your database is preserved, license state is preserved too.

---

## Safety Checklist

- Do not run `docker compose down -v` unless you intentionally want full data wipe.
- Keep `.env` in backup and secret management.
- Keep regular DB and MinIO backups before each production update.
- Prefer pinned release tags over `latest` in production.
