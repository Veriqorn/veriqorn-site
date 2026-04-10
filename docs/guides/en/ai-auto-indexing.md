# Automatic Code Re-Indexing

Automatic re-indexing keeps your code index fresh by detecting new commits on the main branch and triggering incremental indexing. Two mechanisms are available: **webhooks** for Git providers and **polling** for local or network repositories.

## Prerequisites

- AI Pro license active ([see activation guide](./ai-pro-license.md))
- At least one repository configured ([see indexing guide](./ai-repository-indexing.md))
- For webhooks: your platform instance must be accessible from the Git provider

## Step 1. Enable auto-indexing

### Via Settings UI

1. Open **Settings > Auto-Indexing**
2. Toggle **Enable automatic re-indexing**
3. Select a mode:
   - **Webhook** — receive push events from Git providers
   - **Polling** — periodically check for new commits
   - **Both** — use webhooks where possible, polling as fallback
4. Set the **main branch** name (default: `main`)
5. If using polling, set the **poll interval** in minutes (default: 5)
6. Click **Save Configuration**

### Via API

```bash
curl -X PUT http://localhost:3001/ai-analysis/auto-index/config \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "enabled": true,
    "mode": "both",
    "pollIntervalMinutes": 5,
    "mainBranch": "main"
  }'
```

## Step 2. Set up webhooks

### GitHub

1. In your GitHub repository, go to **Settings > Webhooks > Add webhook**
2. Set the Payload URL to: `https://your-server/webhooks/github`
3. Set Content type to `application/json`
4. Generate a webhook secret in the platform (Settings > Auto-Indexing > Regenerate)
5. Paste the secret in GitHub
6. Select **Just the push event**
7. Save

### GitLab

1. In your GitLab project, go to **Settings > Webhooks**
2. Set the URL to: `https://your-server/webhooks/gitlab`
3. Generate a secret token in the platform and paste it
4. Check **Push events**
5. Save

### Bitbucket

1. In your Bitbucket repository, go to **Settings > Webhooks > Add webhook**
2. Set the URL to: `https://your-server/webhooks/bitbucket`
3. Select **Repository push** trigger
4. Save

### Azure DevOps

1. In your Azure DevOps project, go to **Project Settings > Service Hooks > Create subscription**
2. Select **Web Hooks** service
3. Set the trigger to **Code pushed**
4. Set the URL to: `https://your-server/webhooks/azure-devops`
5. Save

## Step 3. CI/CD integration (alternative)

If webhooks are not possible, you can trigger re-indexing from your CI/CD pipeline using the generic webhook endpoint with an API key:

```bash
curl -X POST https://your-server/webhooks/generic \
  -H "Authorization: Bearer qarp_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "branch": "main",
    "commitSha": "'$GITHUB_SHA'"
  }'
```

### GitHub Actions example

```yaml
- name: Trigger re-indexing
  if: github.ref == 'refs/heads/main'
  run: |
    curl -s -X POST ${{ secrets.QA_PLATFORM_URL }}/webhooks/generic \
      -H "Authorization: Bearer ${{ secrets.QA_PLATFORM_API_KEY }}" \
      -H "Content-Type: application/json" \
      -d '{"branch": "main", "commitSha": "${{ github.sha }}"}'
```

## How it works

### Webhooks

1. Git provider sends a push event to the platform
2. Platform verifies the webhook signature/secret
3. Parses the payload to extract repository URL, branch, and commit SHA
4. Checks if the branch matches the configured main branch
5. Finds the matching repository in the platform configuration
6. Enqueues an indexing job

### Polling

1. Every N minutes (configurable), the platform checks each configured repository
2. Runs `git ls-remote` to get the HEAD commit SHA of the main branch
3. Compares with the last indexed commit SHA
4. If different, enqueues an indexing job

### Queue behavior

- Only one indexing job runs at a time
- Duplicate requests for the same repository are deduplicated
- Failed jobs are logged but do not block the queue
- After successful indexing, the last indexed commit SHA is stored

## Monitoring

### Check status

```bash
curl http://localhost:3001/ai-analysis/auto-index/status \
  -b "auth_token=<jwt>"
```

Response:

```json
{
  "config": {
    "enabled": true,
    "mode": "both",
    "pollIntervalMinutes": 5,
    "mainBranch": "main"
  },
  "lastIndexedCommits": {
    "backend": {
      "sha": "a1b2c3d4e5f6...",
      "indexedAt": "2026-04-08T10:30:00Z"
    }
  },
  "queueStatus": {
    "currentJob": null,
    "queueDepth": 0,
    "lastResult": {
      "repositoryId": "backend",
      "status": "completed",
      "durationMs": 4523,
      "completedAt": "2026-04-08T10:30:04Z"
    }
  }
}
```

### Regenerate webhook secret

```bash
curl -X POST http://localhost:3001/ai-analysis/auto-index/webhook-secret/regenerate \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "provider": "github" }'
```

## Webhook signature verification

| Provider | Method | Header |
|----------|--------|--------|
| GitHub | HMAC-SHA256 | `X-Hub-Signature-256` |
| GitLab | Token comparison | `X-Gitlab-Token` |
| Bitbucket | No signature (IP-based or secret) | — |
| Azure DevOps | Basic auth or secret | `Authorization` |

Timing-safe comparison is used to prevent timing attacks.

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Webhook not received | Platform not accessible from provider | Check firewall, DNS, and HTTPS setup |
| "Invalid webhook signature" | Secret mismatch | Regenerate secret and update in Git provider |
| Polling not triggering | Mode not set to "poll" or "both" | Check auto-index config |
| "Repository not configured" | URL mismatch | Verify repository URL in Settings > AI Analysis |
| Indexing stuck | Long-running job | Check platform logs, re-index manually |

## Related guides

- [Repository Indexing](./ai-repository-indexing.md) — manual indexing and parameters
- [Multi-Source Repositories](./ai-multi-source-repositories.md) — configure remote repositories
- [MCP Server](./ai-mcp-server.md) — query indexed code from your IDE
