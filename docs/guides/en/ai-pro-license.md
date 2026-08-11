# Activating a Veriqorn Enterprise license

Veriqorn Community works without a product license. Enterprise AI capabilities
work offline with a signed, installation-bound license. A license file copied
to another installation does not activate Enterprise there.

## Before you begin

Use the Enterprise overlay from the public installation repository. It mounts
the customer license read-only and uses Enterprise images that already contain
Veriqorn's public verification key. Customers never configure or receive
Veriqorn's issuer private key.

An Enterprise license does not add private modules to a running Community
image. To move an existing Community deployment to Enterprise, apply
`compose.enterprise.yml`: it replaces only the `backend` and `frontend`
containers with the authorized Enterprise images. PostgreSQL, MinIO, named
volumes, projects, and test history stay in place, so no reinstallation is
required.

Generate and retain `VERIQORN_INSTALLATION_KEY_ENCRYPTION_KEY` for the
installation. It is a 32-byte base64url secret that encrypts the local
installation identity; losing it requires a safe re-activation procedure.

## 1. Export an activation request

Start the Enterprise installation once. An administrator then downloads the
activation request from **Settings → Plan** or calls:

```bash
curl http://localhost:3001/api/v1/edition/license-activation-request \
  -b "auth_token=<your-session>" \
  -o veriqorn-activation-request.json
```

Send this JSON to Veriqorn through the agreed support channel. It contains the
installation ID, public key, and fingerprint needed to bind a license. It does
not contain test results, projects, the installation private key, or any
Veriqorn signing key.

Every production, staging, and air-gapped installation needs its own request
and its own license.

## 2. Receive and mount the license

Veriqorn signs a schema-v3 license using its issuer private key. Its envelope
contains a payload, an Ed25519 signature with a `keyId`, expiry dates, the
installation binding, and the granted entitlements such as `ai.analysis` or
`ai.rag`.

Store the returned JSON outside Git and mount it through
`VERIQORN_LICENSE_FILE` in `.env.enterprise`:

```env
VERIQORN_LICENSE_FILE=./licenses/veriqorn-license.json
```

Start with the Community compose file and the Enterprise overlay:

```bash
docker compose --env-file .env --env-file .env.enterprise \
  -f docker-compose.yml -f compose.enterprise.yml up -d
```

An administrator can alternatively activate the same JSON through the API:

```bash
curl -X POST http://localhost:3001/api/v1/edition/license-activations \
  -H "Content-Type: application/json" \
  -b "auth_token=<your-session>" \
  --data-binary @veriqorn-license.json
```

## 3. Verify the entitlement state

```bash
curl http://localhost:3001/api/v1/edition \
  -b "auth_token=<your-session>"
```

The response reports the license status and only the entitlements granted to
this installation. Enterprise routes also require normal user authorization;
a license never bypasses project or administrator permissions.

## Offline, renewal, and recovery

- License verification is local; no permanent Internet connection is needed.
- For renewal, Veriqorn issues a new signed JSON for the same installation.
- For a replacement host or lost installation identity, export a new request
  and ask Veriqorn for a replacement license. Do not copy another host's
  license or identity data.
- Keep a protected backup of the database, license JSON, and installation-key
  encryption secret together. Do not back up or distribute Veriqorn's issuer
  private key.

## Troubleshooting

| Symptom | Resolution |
|---|---|
| `not_configured` | Check that the Enterprise image is installed and the license file is mounted at the configured path. |
| `invalid` | Obtain the license from Veriqorn again; check that it belongs to this installation and was not altered. |
| `expired` | Request a renewal license from Veriqorn. Community functionality remains available. |
| Capability unavailable | Confirm that the relevant entitlement is included in the license and that the Enterprise extension is installed. |
