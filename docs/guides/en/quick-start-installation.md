# Quick Start — Installation Guide

QA Report Platform ships as pre-built Docker images on GitHub Container Registry (GHCR). You can have the full platform running in under five minutes with a single `docker compose` command.

---

## Prerequisites

- **Docker** 20.10+ and **Docker Compose** v2 (or the `docker-compose` plugin).
- Ports **3000**, **3001**, **5432**, **9000**, **9001** available on the host.
- At least **2 GB** of free RAM for all services.

No other dependencies are required — the compose file includes PostgreSQL, MinIO (S3-compatible storage), and automatic bucket initialization.

---

## Step 1 — Download the Install Files

Download the installation compose file and environment example from the repository:

```bash
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/docker-compose.yml
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/.env.example
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/Caddyfile
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/preflight.ps1
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/preflight.sh
```

Or copy them manually from the `veriqorn-install` repository root: `docker-compose.yml` and `.env.example`.

---

## Step 2 — Create the Environment File

Create `.env` next to the compose file, starting from the published example:

```bash
cp .env.example .env
```

> **Important:** Replace `JWT_SECRET` with a strong random value and set a unique
> `BACKEND_BOOTSTRAP_ADMIN_EMAIL` / `BACKEND_BOOTSTRAP_ADMIN_PASSWORD` pair for
> the first administrator. The platform does not create default application users.

### Environment variables reference

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | *(required)* | Secret key for signing JWT tokens |
| `BACKEND_BOOTSTRAP_ADMIN_EMAIL` | *(required on first start)* | First administrator email for an empty database |
| `BACKEND_BOOTSTRAP_ADMIN_PASSWORD` | *(required on first start)* | Unique 12+ character password for that administrator |
| `PLATFORM_VERSION` | `latest` | Docker image tag (`latest`, `v1.0.0`, etc.) |
| `POSTGRES_USER` | `postgres` | PostgreSQL user |
| `POSTGRES_PASSWORD` | *(required)* | PostgreSQL password |
| `POSTGRES_DB` | `test_ops` | Database name |
| `POSTGRES_HOST_PORT` | `5432` | PostgreSQL port exposed on the host |
| `VERIQORN_POSTGRES_VOLUME` | `veriqorn-postgres-data` | Docker volume name for PostgreSQL data |
| `MINIO_ROOT_USER` | `minioadmin` | MinIO admin user |
| `MINIO_ROOT_PASSWORD` | *(required)* | MinIO admin password |
| `MINIO_SERVICE_ACCESS_KEY` | `veriqorn-app` | Internal backend-only MinIO account |
| `MINIO_SERVICE_SECRET_KEY` | *(required)* | Secret for the least-privilege backend MinIO account |
| `MINIO_API_PORT` | `9000` | MinIO API port exposed on the host |
| `MINIO_CONSOLE_PORT` | `9001` | MinIO console port exposed on the host |
| `VERIQORN_MINIO_VOLUME` | `veriqorn-minio-data` | Docker volume name for MinIO object storage |
| `FRONTEND_PORT` | `3000` | Frontend port exposed on the host |
| `BACKEND_PORT` | `3001` | Backend port exposed on the host |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend URL visible to the browser |
| `NEXT_PUBLIC_KB_URL` | `http://localhost:5174` | Standalone Knowledge Base site URL, if deployed |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend URL for CORS |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed browser origins for the backend |
| `VERIQORN_PUBLIC_HOST` | *(empty)* | Public DNS name used by the optional TLS profile |
| `BACKEND_SECURE_COOKIES` | `false` | Set to `true` when terminating TLS |

---

### Image access preflight

Before handing the install to a customer, verify that the published images are
readable from the target environment:

```bash
docker pull ghcr.io/veriqorn/veriqorn-backend:latest
docker pull ghcr.io/veriqorn/veriqorn-frontend:latest
```

If either pull returns `unauthorized`, the GHCR package is not public or the
host needs `docker login ghcr.io` with a token that can read the package.

### Configuration preflight

Before starting, validate secrets and Compose configuration without printing any
secret values:

```powershell
powershell -ExecutionPolicy Bypass -File .\preflight.ps1
```

On Linux, run:

```bash
chmod +x ./preflight.sh
./preflight.sh
```

`MINIO_SERVICE_ACCESS_KEY` is an internal account used only by the backend to
store artifacts, traces, and screenshots. Veriqorn users never sign in to
MinIO: their project permissions are checked by the backend before it uses this
service account.

## Step 3 — Start the Platform

```bash
docker compose -f docker-compose.yml up -d
```

### Production TLS

For an Internet-facing installation, point a public DNS record to the host and
set these values in `.env` before starting the TLS profile:

```env
VERIQORN_PUBLIC_HOST=veriqorn.example.com
FRONTEND_URL=https://veriqorn.example.com
CORS_ORIGINS=https://veriqorn.example.com
NEXT_PUBLIC_API_URL=https://veriqorn.example.com
BACKEND_SECURE_COOKIES=true
```

Then start Caddy, which obtains and renews the HTTPS certificate automatically:

```bash
docker compose --profile tls -f docker-compose.yml up -d
```

The application, PostgreSQL, and MinIO ports are bound to loopback only; expose
only ports 80 and 443 through the host firewall or load balancer.

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

### First sign-in

Sign in with the administrator email and password set in the bootstrap variables.
After confirming access, remove both `BACKEND_BOOTSTRAP_ADMIN_EMAIL` and
`BACKEND_BOOTSTRAP_ADMIN_PASSWORD` from `.env`; bootstrap credentials must be
configured as a pair and are used only when the database is empty.

---

## Step 5 — Upload Your First Results

Authenticate and upload Allure results to verify the installation:

```bash
# 1. Create a session cookie
curl -s -c veriqorn.cookies -X POST http://localhost:3001/api/v1/auth/session \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_BOOTSTRAP_ADMIN_EMAIL","password":"YOUR_BOOTSTRAP_ADMIN_PASSWORD"}'

# 2. Upload a single result file through the normalized import route
curl -X POST http://localhost:3001/api/v1/projects/default/imports/allure-jobs \
  -b veriqorn.cookies \
  -F "file=@/path/to/your-result.json" \
  -F "runName=First Run" \
  -F "sourceKind=uploaded_file" \
  -F "environment=local"

# 3. Or upload a ZIP from CI
curl -X POST http://localhost:3001/api/v1/projects/default/imports/allure-jobs \
  -b veriqorn.cookies \
  -F "file=@allure-results.zip" \
  -F "runName=CI Run" \
  -F "sourceKind=ci_archive" \
  -F "branch=main"
```

Open [http://localhost:3000](http://localhost:3000) — your launch should appear on the Launches page.

---

## Data Persistence

Normal application updates do not remove your data.

- PostgreSQL data is stored in the Docker volume named by `VERIQORN_POSTGRES_VOLUME`.
- MinIO artifacts are stored in the Docker volume named by `VERIQORN_MINIO_VOLUME`.
- `docker compose pull` plus `docker compose up -d` recreates containers, but reuses those volumes.

Only `docker compose down -v` removes persisted application data.

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
PLATFORM_VERSION=v0.1.0
```

The bundled update agent verifies the keyless Cosign signature of both image
digests before activating an update. Do not loosen `UPDATE_COSIGN_IDENTITY`
unless you intentionally publish images from a different signed workflow.

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

# Stop and remove all persisted data (database, files, artifacts)
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

- **Send results from automated tests**: Configure your CI to upload Allure results after every run. See [Send automated test results to Veriqorn](test-results-ci-integration.md).
- **Test reruns**: Configure a [Test Rerun pipeline](test-rerun-setup.md) to trigger selected tests from a launch.
- **Enterprise AI features**: Deploy the Enterprise overlay and activate its offline license to enable failure analysis, repository indexing, and coverage intelligence. The Enterprise image already includes Veriqorn's public verification key. See [Enterprise AI License](ai-pro-license.md).
- **LLM connection**: Connect a local or cloud LLM provider for AI analysis. See [LLM Connection](ai-llm-connection.md).

