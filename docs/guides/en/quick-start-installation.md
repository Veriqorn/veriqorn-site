# Quick Start — Installation Guide

QA Report Platform ships as pre-built Docker images on GitHub Container Registry (GHCR). You can have the full platform running in under five minutes with a single `docker compose` command.

---

## Prerequisites

- **Docker** 20.10+ and **Docker Compose** v2 (or the `docker-compose` plugin).
- Ports **3000**, **3001**, **5432**, **9000**, **9001** available on the host.
- At least **2 GB** of free RAM for all services.

No other dependencies are required — the compose file includes PostgreSQL, MinIO (S3-compatible storage), and automatic bucket initialization.

---

## Step 1 — Download the Compose File

Download the installation compose file from the repository:

```bash
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/docker-compose.yml
```

Or copy it manually from the `veriqorn-install` repository root: `docker-compose.yml`.

---

## Step 2 — Create the Environment File

Create a `.env` file next to the compose file:

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

> **Important:** Replace `JWT_SECRET` with a strong random value for production use.

### Environment variables reference

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | *(required)* | Secret key for signing JWT tokens |
| `PLATFORM_VERSION` | `latest` | Docker image tag (`latest`, `v1.0.0`, etc.) |
| `POSTGRES_USER` | `postgres` | PostgreSQL user |
| `POSTGRES_PASSWORD` | *(required)* | PostgreSQL password |
| `POSTGRES_DB` | `test_ops` | Database name |
| `MINIO_ROOT_USER` | `minioadmin` | MinIO admin user |
| `MINIO_ROOT_PASSWORD` | *(required)* | MinIO admin password |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend URL visible to the browser |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend URL for CORS |
| `AI_ANALYSIS_LICENSE_PUBLIC_KEY` | *(empty)* | Public key for AI Pro license verification (optional) |

---

## Step 3 — Start the Platform

```bash
docker compose -f docker-compose.yml up -d
```

Docker will pull the images from GHCR and start all services. First startup may take 1-2 minutes while images download and the database initializes.

Check that all containers are running:

```bash
docker compose -f docker-compose.yml ps
```

You should see five services: `frontend`, `backend`, `postgres`, `minio`, and `minio-init` (exits after creating buckets).

---

## Step 4 — Open the Platform

| Service | URL |
|---------|-----|
| **Frontend** (UI) | [http://localhost:3000](http://localhost:3000) |
| **Backend** (API) | [http://localhost:3001](http://localhost:3001) |
| **MinIO Console** | [http://localhost:9001](http://localhost:9001) |

### Default credentials

| User | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `admin123` |
| User | `user@example.com` | `user123` |

> Change default passwords after the first login in production deployments.

---

## Step 5 — Upload Your First Results

Authenticate and upload Allure results to verify the installation:

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

Open [http://localhost:3000](http://localhost:3000) — your launch should appear on the Launches page.

---

## Upgrading

To upgrade to a newer version:

```bash
# Pull new images
docker compose -f docker-compose.yml pull

# Restart with zero downtime
docker compose -f docker-compose.yml up -d
```

Or pin a specific version in `.env`:

```bash
PLATFORM_VERSION=v1.2.0
```

---

## Pinning a Version

By default, `PLATFORM_VERSION=latest` pulls the most recent build. For production, pin to a release tag:

```bash
PLATFORM_VERSION=v1.0.0
```

Available tags are listed on the [Veriqorn packages page](https://github.com/orgs/veriqorn/packages).

---

## Stopping and Cleanup

```bash
# Stop all services (data is preserved in volumes)
docker compose -f docker-compose.yml down

# Stop and remove all data (database, files)
docker compose -f docker-compose.yml down -v
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `JWT_SECRET is required` error on startup | Missing `.env` file or empty `JWT_SECRET` | Create `.env` with a `JWT_SECRET` value |
| Backend exits with database connection error | PostgreSQL not ready yet | Wait 10-15 seconds and check again — the healthcheck ensures ordered startup |
| Frontend shows "Network Error" | Backend is not reachable from the browser | Verify `NEXT_PUBLIC_API_URL` matches the backend's public address |
| Cannot pull images from GHCR | Images are private or rate-limited | Check that images are public, or `docker login ghcr.io` with a GitHub token |
| Port 3000/3001 already in use | Another service occupies the port | Stop the conflicting service or remap ports in the compose file |

---

## Next Steps

- **CI/CD integration**: See the upload examples above or configure a [Test Rerun pipeline](test-rerun-setup.md).
- **AI Pro features**: Install an AI Pro license to enable failure analysis, repository indexing, and coverage intelligence. See [AI Pro License](ai-pro-license.md).
- **LLM connection**: Connect a local or cloud LLM provider for AI analysis. See [LLM Connection](ai-llm-connection.md).
