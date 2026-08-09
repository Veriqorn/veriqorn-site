# Activating an AI Pro license

AI Pro works without a permanent Internet connection. Each license is issued
for one Veriqorn installation, so copying its JSON file to another company or
environment does not activate AI Pro there.

## 1. Configure the verification key

Your Veriqorn contact provides an Ed25519 public verification key. Set it in
the backend environment before activating a license:

```env
AI_ANALYSIS_LICENSE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...provided public key...
-----END PUBLIC KEY-----"
```

Restart the backend after changing environment variables. The private signing
key stays with Veriqorn and must never be placed in a customer environment.

## 2. Export an activation request

An administrator opens **Settings → General → Plan** and selects **Download
activation request**. The browser downloads
`veriqorn-activation-request.json` from the installation that will use AI Pro.

The equivalent API call is available for automated workflows:

```bash
curl http://localhost:3001/api/v1/ai/license-activation-request \
  -b "auth_token=<your-jwt>" \
  -o veriqorn-activation-request.json
```

Send this JSON file to Veriqorn through your approved support channel. It
contains the installation identifier and public key needed to bind a license;
it does not contain your test results, projects, or private signing secrets.

For another production, staging, or air-gapped installation, export a separate
request and obtain a separate license.

## 3. Receive and install the license

Veriqorn returns a signed license envelope similar to this:

```json
{
  "payload": {
    "version": 2,
    "licenseId": "lic_abc123",
    "customerId": "your-company",
    "customer": "Your Company",
    "issuedAt": "2026-08-09T00:00:00.000Z",
    "expiresAt": "2030-12-31T23:59:59.999Z",
    "features": ["analysis", "indexing", "retrieval", "connector:all"],
    "installationId": "installation-id",
    "installationKeyFingerprint": "installation-key-fingerprint"
  },
  "signature": "base64-signature"
}
```

In **Settings → General → Plan**, select **Activate License**, choose the JSON
file issued by Veriqorn, and select **Activate License** again. You may also
paste the complete JSON into the dialog. An administrator can activate it
through the API for automated workflows:

```bash
curl -X POST http://localhost:3001/api/v1/ai/license-activations \
  -H "Content-Type: application/json" \
  -b "auth_token=<your-jwt>" \
  --data-binary @veriqorn-license.json
```

Activation automatically switches the installation to `pro_self_hosted` mode.

## 4. Verify

```bash
curl http://localhost:3001/api/v1/ai/capabilities \
  -b "auth_token=<your-jwt>"
```

The response should show `"status": "licensed"` and the features included in
your license.

## Troubleshooting

| Symptom | Resolution |
|---|---|
| `status: "invalid"` and verification-key error | Ensure `AI_ANALYSIS_LICENSE_PUBLIC_KEY` is the public key supplied by Veriqorn, then restart the backend. |
| `status: "invalid"` and “different installation” | Request a license for this installation by exporting a new activation request. |
| `status: "expired"` | Contact Veriqorn for a renewal. |
| A feature is disabled | The feature is not included in the license. Contact Veriqorn to change the entitlement. |
