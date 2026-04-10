# Multi-Source Repository Setup

QA Report Platform supports indexing code from multiple sources for AI-powered failure analysis. You can connect local paths, network shares, or remote Git repositories (GitHub, GitLab, Bitbucket, Azure DevOps).

---

## 1) Supported Source Types

| Source Type | Description | Auth Required |
|---|---|---|
| **Local Path** | Relative path on the server filesystem | No |
| **Network Path** | UNC or mounted network share path | No |
| **GitHub** | Public or private GitHub repository | Token for private |
| **GitLab** | Public or private GitLab repository | Token for private |
| **Bitbucket** | Public or private Bitbucket repository | Token for private |
| **Azure DevOps** | Azure DevOps Git repository | Token required |

---

## 2) Prerequisites

1. The platform backend is running (`http://localhost:3001`).
2. An AI Pro license with `indexing` feature is activated.
3. Git is installed on the server (required for remote repository cloning).

See also:
- [AI Module Overview](./ai-module-overview.md)
- [Repository Indexing](./ai-repository-indexing.md)
- [Activating Pro License](./ai-pro-license.md)

---

## 3) Configuration via UI

1. Open **Settings > AI Analysis > Repository context**.
2. Click **Add repository**.
3. Select the **Source type** from the dropdown.
4. Fill in the fields:

### Local Path

| Field | Example |
|---|---|
| Repository name | Backend |
| Local path | `backend/src` |

The path is resolved relative to `AI_ANALYSIS_MONOREPO_ROOT` environment variable.

### GitHub / GitLab / Bitbucket / Azure DevOps

| Field | Example |
|---|---|
| Repository name | Backend Service |
| Repository URL | `https://github.com/myorg/backend` |
| Access Token | `ghp_xxxxxxxxxxxx` |
| Branch | `main` |
| Subfolder (optional) | `src` |

5. Click **Save Changes**.
6. Navigate to AI Analysis and run **Index Repositories**.

---

## 4) Configuration via API

### Set repositories

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisRepositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": [
      {
        "id": "local-backend",
        "name": "Backend (local)",
        "sourceType": "local",
        "url": "backend/src"
      },
      {
        "id": "github-frontend",
        "name": "Frontend (GitHub)",
        "sourceType": "github",
        "url": "https://github.com/myorg/frontend",
        "authToken": "ghp_xxxxxxxxxxxx",
        "branch": "main",
        "subfolder": "src"
      }
    ]
  }'
```

### Test connection to a remote repository

```bash
curl -X POST http://localhost:3001/ai-analysis/repositories/test-connection \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "sourceType": "github",
    "url": "https://github.com/myorg/frontend",
    "authToken": "ghp_xxxxxxxxxxxx",
    "branch": "main"
  }'
```

Expected response:

```json
{
  "status": "ok",
  "message": "Connection successful. Repository is accessible.",
  "responseTimeMs": 342
}
```

---

## 5) How Remote Cloning Works

When a remote repository is configured:

1. **First indexing** — the platform performs a shallow clone (`--depth 1`) of the specified branch into a managed directory (`data/repos/` by default).
2. **Subsequent indexing** — only fetches the latest changes from the remote (`git fetch --depth 1`), keeping the local copy up-to-date.
3. **Indexing pipeline** — once the code is locally available, the standard chunking, embedding, and vector storage pipeline runs identically to local paths.

### Clone directory

Cloned repositories are stored in:

```
<AI_ANALYSIS_CLONE_DIR>/
  <repo-id>_<hash>/
    .git/
    ...source files...
```

Configure the clone directory via environment variable:

```env
AI_ANALYSIS_CLONE_DIR=/var/data/qa-repos
```

Default: `<backend-cwd>/data/repos/`.

---

## 6) Access Token Setup Per Provider

### GitHub

1. Go to **Settings > Developer settings > Personal access tokens > Tokens (classic)**.
2. Generate a token with `repo` scope (for private repos) or no scope (for public).
3. Copy the token (`ghp_...`) into the **Access Token** field.

### GitLab

1. Go to **User Settings > Access Tokens**.
2. Create a token with `read_repository` scope.
3. Copy the token (`glpat-...`) into the **Access Token** field.

### Bitbucket

1. Go to **Personal settings > App passwords**.
2. Create a password with `Repositories: Read` permission.
3. Copy the generated password into the **Access Token** field.

### Azure DevOps

1. Go to **User settings > Personal access tokens**.
2. Create a token with `Code: Read` scope.
3. Copy the token into the **Access Token** field.

---

## 7) Security

- Access tokens are **encrypted at rest** in the database using AES-256-GCM.
- Tokens are only injected into clone URLs in memory during git operations.
- No credentials are written to disk or logged.
- The `SETTINGS_ENCRYPTION_KEY` environment variable must be set for encryption to be active.

---

## 8) Troubleshooting

| Issue | Resolution |
|---|---|
| `Authentication failed` | Verify token has correct scopes and is not expired |
| `Could not resolve host` | Check repository URL for typos |
| `Repository path does not exist` | For local paths, ensure `AI_ANALYSIS_MONOREPO_ROOT` is set correctly |
| `Subfolder not found` | The subfolder path is relative to the repository root |
| `Connection timed out` | Check network access to the Git provider from the server |

---

## 9) Backward Compatibility

Existing configurations without `sourceType` are automatically treated as `local`. No migration is required.

---

## Related Guides

- [AI Module Overview](./ai-module-overview.md)
- [Repository Indexing](./ai-repository-indexing.md)
- [Vector DB Setup](./ai-vector-db-setup.md)
- [AI Pro License](./ai-pro-license.md)
