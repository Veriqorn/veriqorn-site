# Repository Indexing

Repository indexing scans your project source code, applies AST-aware (heuristic) chunking for code files, and builds a searchable catalog. This catalog is used for:

- **Failure analysis** — finding relevant code when a test fails
- **Coverage intelligence** — mapping tests to code-aware coverage units

## Prerequisites

- AI Pro license active ([see activation guide](./ai-pro-license.md))
- `indexing` feature token in your license

## Step 1. Set the monorepo root

Tell the platform where your source code lives:

```env
AI_ANALYSIS_MONOREPO_ROOT=/path/to/your/project
```

This is the base directory from which relative repository paths are resolved. If not set, defaults to the backend process working directory.

In a self-hosted Docker install, set this in the deployment environment for the backend container. It should point to the directory on the server where the source repositories are available for indexing.

## Step 2. Register repositories

Repositories define the scope of what gets indexed. Register them via the Settings UI or API:

### Via Settings UI

1. Open **Settings > AI Analysis**
2. In the **Repository Context** section, click **Add Repository**
3. Fill in:
   - **ID** — unique identifier (e.g. `backend`, `frontend`)
   - **Name** — human-readable name
   - **Path/URL** — relative path from monorepo root (e.g. `backend/src`)
4. Save

### Via API

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisRepositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": [
      { "id": "backend", "name": "Backend", "url": "backend/src" },
      { "id": "frontend", "name": "Frontend", "url": "frontend" },
      { "id": "tests", "name": "E2E Tests", "url": "test" }
    ]
  }'
```

## Step 3. Run indexing

### Via API

```bash
curl -X POST http://localhost:3001/ai-analysis/index/repositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{}'
```

With custom parameters:

```bash
curl -X POST http://localhost:3001/ai-analysis/index/repositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "repositoryIds": ["backend"],
    "chunkSizeChars": 1500,
    "chunkOverlapChars": 200,
    "maxFileSizeBytes": 500000
  }'
```

### Response

```json
{
  "status": "ready",
  "generatedAt": "2025-06-15T10:30:00Z",
  "repositories": [
    {
      "repositoryId": "backend",
      "repositoryName": "Backend",
      "status": "indexed",
      "indexedFiles": 87,
      "skippedFiles": 3,
      "chunkCount": 142,
      "errors": []
    }
  ],
  "totalChunks": 142,
  "totalIndexedFiles": 87,
  "totalSkippedFiles": 3,
  "catalogKey": "aiAnalysisIndexCatalog"
}
```

## Indexing parameters

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `chunkSizeChars` | 1200 | 200–4000 | Characters per chunk |
| `chunkOverlapChars` | 180 | 0–(chunkSize-1) | Overlap between adjacent chunks |
| `maxFileSizeBytes` | 200,000 | 1,024–2,000,000 | Skip files larger than this |

## What gets indexed

**Included file extensions:**
`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.json`, `.yml`, `.yaml`, `.md`, `.sql`, `.ps1`, `.sh`

**Ignored directories:**
`node_modules`, `.git`, `.next`, `.turbo`, `dist`, `build`, `coverage`, `artifacts`, `allure-results`, `uploads`, `temp`

**Per-repository limit:** 2,000 files maximum.

## Viewing the index catalog

```bash
curl http://localhost:3001/ai-analysis/index/catalog \
  -b "auth_token=<jwt>"
```

Returns the full catalog with per-file chunk metadata, useful for debugging.

From EPIC-603, catalog metadata also includes:

- `schemaVersion`
- `chunkingMode` (`char-window` or `ast-heuristic`)
- semantic summary fields (`summary`, `summaryVersion`)
- symbol graph (`symbolGraph.nodes`, `symbolGraph.edges`)

## Re-indexing

Run `POST /ai-analysis/index/repositories` again at any time. The catalog is fully replaced on each run. There is no incremental indexing — each run re-scans the entire scope.

**When to re-index:**
- After significant code changes
- After adding new repositories
- After changing chunking parameters

## Retrieval

Once indexed, the catalog is used automatically by:

- `POST /ai-analysis/failures/analyze` — finds relevant code for failure context
- `POST /ai-analysis/retrieve/evidence` — direct evidence search

### Testing retrieval

```bash
curl -X POST http://localhost:3001/ai-analysis/retrieve/evidence \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "query": "upload allure results timeout",
    "topK": 5,
    "minScore": 0.1
  }'
```

### Retrieval parameters

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `topK` | 5 | 25 | Number of results to return |
| `minScore` | 0.08 | - | Minimum relevance threshold (0–1) |
| `repositoryIds` | all | - | Filter to specific repositories |
| `filePathPrefixes` | none | - | Filter to specific directories |
| `stageOverrides` | none | - | Per-request toggles for `bm25`, `vector`, `graphExpansion`, `rerank`, `summaries` |

Retrieval response now includes:

- `stageFlags` — resolved runtime flags for retrieval stages
- `stageTimingsMs` — per-stage runtime timing diagnostics

## Vector provider

By default, retrieval uses a **lexical fallback** (token-based matching).

Currently available runtime providers:
- `memory`
- `in-memory`
- `local-ann`
- `qdrant`

Configure provider via setting/API:

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisVectorProvider \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "value": "memory" }'
```

For production planning with Qdrant and PostgreSQL topology, see:
- [AI Vector DB Setup (PostgreSQL + Qdrant)](./ai-vector-db-setup.md)

Staged-rollout example (with safe fallback behavior):

```env
AI_ANALYSIS_VECTOR_PROVIDER=qdrant
```

When a configured provider is unavailable, the system automatically falls back to lexical matching and adds a warning to the response.
