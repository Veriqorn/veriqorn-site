# Activating Pro License

The AI module operates in two modes:

- **`oss_stub`** (default) — all AI features are disabled, platform works as a standard reporting tool
- **`pro_self_hosted`** — AI features are enabled after license verification

## Step 1. Set the edition mode

Add to your backend `.env` file:

```env
AI_ANALYSIS_DEFAULT_MODE=pro_self_hosted
```

Or configure at runtime via the Settings API:

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisMode \
  -H "Content-Type: application/json" \
  -b "auth_token=<your-jwt>" \
  -d '{ "value": "pro_self_hosted" }'
```

## Step 2. Set the license verification key

The platform verifies licenses using Ed25519/RSA public key cryptography. Set the public key as an environment variable:

```env
AI_ANALYSIS_LICENSE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
-----END PUBLIC KEY-----"
```

The key can be provided in PEM format or as a base64-encoded SPKI (DER) blob.

## Step 3. Install the license

A license is a JSON object with a signed payload:

```json
{
  "payload": {
    "licenseId": "lic_abc123",
    "customer": "Your Company",
    "issuedAt": "2025-01-01T00:00:00Z",
    "expiresAt": "2026-12-31T23:59:59Z",
    "features": ["*"]
  },
  "signature": "base64-encoded-signature"
}
```

### Via Settings UI (recommended)

1. Open **Settings > General**
2. In the **Plan** section, click **Activate License**
3. Paste the full license JSON into the textarea
4. Click **Activate**
5. On success, the license status updates immediately — the "Pro is locked" banner disappears and all AI features become available

### Via API

```bash
# Using the activation endpoint (auto-sets mode to pro_self_hosted)
curl -X POST http://localhost:3001/ai-analysis/license/activate \
  -H "Content-Type: application/json" \
  -b "auth_token=<your-jwt>" \
  -d '{ "license": "{ \"payload\": {...}, \"signature\": \"...\" }" }'

# Or directly via Settings API
curl -X POST http://localhost:3001/settings/aiAnalysisLicense \
  -H "Content-Type: application/json" \
  -b "auth_token=<your-jwt>" \
  -d '{ "value": { "payload": {...}, "signature": "..." } }'
```

The activation endpoint automatically sets the edition mode to `pro_self_hosted`.

## Step 4. Verify

```bash
curl http://localhost:3001/ai-analysis/capabilities \
  -b "auth_token=<your-jwt>"
```

Expected response:

```json
{
  "mode": "pro_self_hosted",
  "status": "licensed",
  "licensed": true,
  "features": {
    "analysis": { "enabled": true },
    "indexing": { "enabled": true },
    "retrieval": { "enabled": true },
    "kibanaConnector": { "enabled": true },
    "sentryConnector": { "enabled": true },
    "grafanaConnector": { "enabled": true }
  }
}
```

## Feature tokens

The `features` array in the license payload controls which capabilities are enabled:

| Token | Effect |
|-------|--------|
| `*` or `all` | Enables everything |
| `analysis` | AI failure analysis |
| `indexing` | Repository indexing |
| `retrieval` | Semantic evidence retrieval |
| `connector:all` | All evidence connectors |
| `connector:kibana` | Kibana connector only |
| `connector:sentry` | Sentry connector only |
| `connector:grafana` | Grafana connector only |

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `status: "stub"` | Mode is `oss_stub` | Set `AI_ANALYSIS_DEFAULT_MODE=pro_self_hosted` |
| `status: "invalid"` | License not configured | Install license via Settings API |
| `status: "invalid"`, signature fail | Wrong public key | Verify `AI_ANALYSIS_LICENSE_PUBLIC_KEY` matches the signing key |
| `status: "expired"` | License expired | Install a new license with a future `expiresAt` |
| Feature shows `enabled: false` | Token missing from license | Add the required feature token to `payload.features` |

## Upgrade URL (optional)

To display a custom upgrade link in the UI when features are locked:

```env
AI_ANALYSIS_UPGRADE_URL=https://your-company.com/upgrade
```
