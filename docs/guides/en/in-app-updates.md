# In-app updates for self-hosted installations

With in-app updates, a platform administrator can see a new published version and start the normal application update from **Settings → Platform Updates**. The first setup still requires a trusted server operator; everyday updates do not require server CLI access.

## Before you start

- Install the platform with the supported `veriqorn-install/docker-compose.yml`.
- Use a Docker host controlled by your organization.
- Keep regular PostgreSQL and MinIO backups. A database migration can make a rollback unsafe.

## One-time setup

Copy the current installation `.env.example` to `.env` and set a unique update-agent secret:

```env
PLATFORM_UPDATE_AGENT_TOKEN=replace-with-a-random-secret-of-at-least-32-characters
```

Generate the value with your organization’s secret-management tool. Do not reuse `JWT_SECRET`, database passwords, or a secret from another installation.

Start or recreate the installation once so Docker creates the local `update-agent` service:

```bash
docker compose --env-file .env -f docker-compose.yml up -d
```

The agent is not published on a host port. The backend can reach it only through the private Docker Compose network.

## Use an update

1. Sign in as a platform administrator.
2. Open **Settings → Platform Updates**.
3. Review the available release and release notes.
4. Select **Install update** and wait for the reported job status.

The agent selects the latest stable GitHub Release itself, pulls only Veriqorn backend and frontend images, records their immutable digests, updates `PLATFORM_VERSION`, recreates those application services, and waits for the backend health check. Existing PostgreSQL and MinIO volumes are preserved.

## Security and recovery

The update agent is the only service with Docker socket access. A Docker socket is root-equivalent access to the server, so never expose the agent through a host port or reverse proxy. Keep `.env` readable only by trusted operators and rotate `PLATFORM_UPDATE_AGENT_TOKEN` if it may have been exposed.

The agent does not automatically roll back when a health check fails: a release could already have applied an irreversible database migration. Use your backup and recovery procedure from the [system update guide](./system-update-guide.md) when manual recovery is required.
