# Activating a Veriqorn Enterprise license

Enterprise uses authorized Enterprise application images and an offline,
installation-bound license. A license does not put private modules into a
Community image, and copying its JSON to another server does not activate it.

## Choose your path

### New Enterprise installation

1. Complete the [Quick Start](quick-start-installation.md) once to create the
   deployment, administrator account, and installation identity.
2. Sign in as an administrator and open **Settings → Plan & license**.
3. Select **Download activation request** and send the downloaded JSON to
   Veriqorn through the agreed channel.
4. After receiving the issued license, follow **Prepare the Enterprise overlay**
   below before putting the installation into use.

### Existing Community installation

1. Sign in as an administrator and open **Settings → Plan & license**.
2. Select **Download activation request**, then send that JSON to Veriqorn.
3. After receiving the license, follow **Prepare the Enterprise overlay**.

This is an in-place transition: the overlay replaces only `backend` and
`frontend`. PostgreSQL, MinIO, named volumes, projects, users, and test history
remain intact. Do not run `docker compose down -v` and do not reinstall.

## Prepare the Enterprise overlay

This step requires a trusted server operator with access to the deployment
directory and Docker. It cannot be performed from the browser UI because it
changes which application images Docker runs.

Download the overlay files next to your existing `docker-compose.yml` and `.env`:

```bash
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/compose.enterprise.yml
curl -fsSLO https://raw.githubusercontent.com/veriqorn/veriqorn-install/master/.env.enterprise.example
cp .env.enterprise.example .env.enterprise
```

Store the issued license JSON outside Git, for example at
`./licenses/veriqorn-license.json`. In `.env.enterprise`, set:

```env
VERIQORN_LICENSE_FILE=./licenses/veriqorn-license.json
# Generate once, retain securely, and never reuse between installations.
VERIQORN_INSTALLATION_KEY_ENCRYPTION_KEY=<32-byte-base64url-secret>
```

Keep the authorized immutable `ENTERPRISE_BACKEND_IMAGE` and
`ENTERPRISE_FRONTEND_IMAGE` values supplied with the Enterprise release. The
Enterprise image already contains Veriqorn's public verification key; customers
never receive the issuer private key.

Apply the overlay:

```bash
docker compose --env-file .env --env-file .env.enterprise \
  -f docker-compose.yml -f compose.enterprise.yml up -d
```

## Activate through the UI

After the overlay is running, return to **Settings → Plan & license**. Select
**Activate license**, upload the issued JSON (or paste its exact contents), and
confirm. The page shows the active license, customer, expiry, and entitlements.

The UI also supports **Replace license** for a renewal issued for the same
installation. Mounting the JSON remains required by the Enterprise Compose
overlay, so keep the original file protected and available on the server.

## Console and API alternative

For automation or air-gapped procedures, an administrator can export the same
request and activate the same JSON through the API:

```bash
curl http://localhost:3001/api/v1/ai/license-activation-request \
  -b "auth_token=<your-session>" \
  -o veriqorn-activation-request.json

curl -X POST http://localhost:3001/api/v1/ai/license-activations \
  -H "Content-Type: application/json" \
  -b "auth_token=<your-session>" \
  --data-binary @veriqorn-license.json
```

## Verify the entitlement state

```bash
curl http://localhost:3001/api/v1/edition \
  -b "auth_token=<your-session>"
```

Every production, staging, and air-gapped installation needs its own activation
request and license. License verification is local; no permanent Internet
connection is required.

## Troubleshooting

| Symptom | Resolution |
|---|---|
| `not_configured` | Check that the Enterprise image is running and the license file is mounted read-only. |
| `invalid` | Obtain the license again; confirm it belongs to this installation and was not altered. |
| `expired` | Request a renewal. Community functionality remains available. |
| Capability unavailable | Confirm the entitlement and that the Enterprise overlay is running. |
