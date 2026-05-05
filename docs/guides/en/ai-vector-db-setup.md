# AI Vector DB Setup (PostgreSQL + Qdrant)

This guide describes how to configure data storage for AI retrieval in QA Report Platform:

- **PostgreSQL** — the platform's primary database (settings, catalogs, metadata).
- **Qdrant** — a vector database for ANN/semantic retrieval (production-oriented choice).

---

## 1) What Is Stored Where

| Component | What It Stores | Where It Is Used |
|---|---|---|
| PostgreSQL | system settings, license, index catalog | `settings`, `index/repositories`, `index/catalog` |
| Qdrant | dense vectors of chunks and ANN index | `retrieve/evidence`, `failures/analyze` |

Key settings keys:
- `aiAnalysisRepositories`
- `aiAnalysisVectorProvider`
- `aiAnalysisIndexCatalog`
- `aiAnalysisLicense`

---

## 2) Prerequisites

1. The backend (`http://localhost:3001`) and frontend (`http://localhost:3000`) are up and running.
2. An AI Pro license has been activated (at minimum the `indexing` and `retrieval` features).
3. `AI_ANALYSIS_MONOREPO_ROOT` is set (the source code root for indexing).

See also:
- [AI Module Overview](./ai-module-overview.md)
- [Repository Indexing](./ai-repository-indexing.md)
- [Activating Pro License](./ai-pro-license.md)

---

## 3) PostgreSQL and Deployment Assumptions

This public guide assumes the platform is already deployed through the supported self-hosted install flow.

If you used `veriqorn-install/docker-compose.yml`, PostgreSQL is already included and the backend already talks to the internal `postgres` service. No extra PostgreSQL setup is required for this guide.

This page does not cover source-based local development or internal debugging workflows.

---

## 4) Installing Qdrant

### Quick Start via Docker

```bash
docker volume create qdrant_storage

docker run -d \
  --name qa-qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  -v qdrant_storage:/qdrant/storage \
  qdrant/qdrant:v1.10.1
```

Health check:

```bash
curl http://localhost:6333/healthz
```

Expected response:

```json
{"status":"ok"}
```

---

## 5) Configuring AI Retrieval

### 5.1 Specify repositories for indexing

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisRepositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": [
      { "id": "backend", "name": "Backend", "url": "backend/src" },
      { "id": "frontend", "name": "Frontend", "url": "frontend" }
    ]
  }'
```

### 5.2 Choose a vector provider

The service currently supports the following providers:
- `memory`
- `in-memory`
- `local-ann`
- `qdrant`

Example:

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisVectorProvider \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "value": "memory" }'
```

Example for Qdrant:

```bash
curl -X POST http://localhost:3001/settings/aiAnalysisVectorProvider \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{ "value": "qdrant" }'
```

If Qdrant or the network is unavailable, retrieval will automatically switch to a deterministic fallback and add a warning to `warnings`.

### 5.2.1 ENV variables for the Qdrant adapter

```env
AI_ANALYSIS_QDRANT_URL=http://127.0.0.1:6333
AI_ANALYSIS_QDRANT_API_KEY=
AI_ANALYSIS_QDRANT_TIMEOUT_MS=3000
AI_ANALYSIS_QDRANT_COLLECTION_PREFIX=qa_report_ai
```

### 5.3 Run indexing

```bash
curl -X POST http://localhost:3001/ai-analysis/index/repositories \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{}'
```

### 5.4 Verify retrieval

```bash
curl -X POST http://localhost:3001/ai-analysis/retrieve/evidence \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "query": "timeout in payment retry middleware",
    "topK": 5,
    "minScore": 0.08
  }'
```

Key fields to check in the response:
- `vectorProvider`
- `fallbackUsed`
- `warnings`
- `rankingReasons`
- `scoreBreakdown`

---

## 6) Why Qdrant Was Chosen (and Not Another Database)

Below is a dedicated architectural rationale.

### Key Reasons

1. **Self-hosted friendly**
   - Easy to launch (a single container), simple operational footprint.
   - Well suited for on-prem deployments and data residency requirements.

2. **Strong focus on vector search**
   - Qdrant was designed from the ground up for ANN/HNSW, rather than being an "add-on" to an OLTP database.
   - Predictable performance under retrieval workloads.

3. **Payload filtering alongside vectors**
   - Convenient metadata filtering (repository, path, language, tags) within the same query that performs similarity search.

4. **Transparent rollback scenario**
   - In our architecture, issues with the vector provider do not cause retrieval to fail — it falls back to lexical fallback instead.
   - This reduces operational risk during rollout.

5. **Balance of functionality, simplicity, and cost**
   - For the self-hosted Pro scenario, it provides a good trade-off without a mandatory dependency on managed SaaS.

### Brief Comparison of Alternatives

| Option | Pros | Limitations in Our Context |
|---|---|---|
| **Qdrant** | Specialization in ANN, payload filters, simple self-hosting | Requires maintaining a separate vector service |
| **pgvector (PostgreSQL)** | Single database for everything, easy to get started | OLTP + heavy vector search in one footprint can be harder to scale |
| **OpenSearch kNN** | Powerful ecosystem stack | Heavier to operate for our use case |
| **Weaviate** | Rich ML capabilities | Larger operational footprint than needed at this stage |
| **Managed (Pinecone, etc.)** | Minimal ops | Vendor lock-in and external data storage requirements |

---

## 7) Practical Rollout Recommendation

1. Start with `memory`/`local-ann` in staging.
2. Verify retrieval quality and latency.
3. Deploy Qdrant and include it in the rollout plan.
4. In production, monitor `fallbackUsed` and `warnings`.
5. If degradation occurs, quickly roll back to lexical fallback via `aiAnalysisVectorProvider`.

This aligns with the current model for safely introducing AI retrieval into the platform.

---

## 8) Chunking Algorithm: How Code Is Split

The current implementation uses a hybrid approach:

- **AST-aware heuristic chunking** for TS/JS (splitting by declaration boundaries)
- **char-window fallback** for other files/cases

Basic workflow:
1. The file text is normalized for line endings (`\r\n` -> `\n`) and trimmed.
2. For TS/JS, the indexer first looks for structural declaration blocks.
3. If the AST-aware path is not applicable, char-window chunking is used:
   - window size = `chunkSizeChars`
   - step = `chunkSizeChars - chunkOverlapChars`
4. Each non-empty block becomes a chunk.

Example:
- `chunkSizeChars = 1200`
- `chunkOverlapChars = 180`
- step = `1020`

This provides context overlap so that important fragments at chunk boundaries are not lost.

### How Index Stability Is Ensured

A deterministic `chunkId` is generated for each chunk based on:
- `repositoryId`
- `filePath`
- `chunkIndex`
- `sha1` of the chunk itself

This means that given the same input code and indexing parameters, you will get identical chunk IDs.

### What Metadata Is Attached to a Chunk

In addition to the text, the following are stored:
- `language` (determined by file extension),
- `pathTokens` (path/segment tokens),
- `symbolHints` (symbol hints: classes/functions/calls),
- `chunkingMode`, `astEntityType`, `astEntityName`,
- `summary`, `summaryVersion`,
- `sha1`, `charCount`.

These fields are used during the ranking and explainability stages.

Additionally, the catalog includes a `symbolGraph` (nodes/edges) for the graph-expansion retrieval channel.

---

## 9) How Retrieval Data Sorting and Processing Works

Below is the end-to-end pipeline for `POST /ai-analysis/retrieve/evidence`:

1. **Query normalization**
   - Conversion to lower-case and tokens.
   - Validation of `topK`, `minScore`.

2. **Candidate filtering**
   - By `repositoryIds` and `filePathPrefixes` (if provided).

3. **Chunk text reconstruction**
   - For filtered metadata, the service reads the file and reconstructs the chunk by `chunkIndex`.

4. **BM25 stage**
   - Weighted lexical relevance (BM25).

5. **Vector stage (if provider is enabled)**
   - Upsert of candidate embeddings.
   - ANN search on the query.
   - Timeouts on vector operations + fail-safe fallback.
   - If the provider does not respond, is unsupported, or returns empty results — lexical fallback is activated.

6. **Hint and graph channels**
   - `pathHints`/`symbolHints` boosts,
   - graph expansion via `symbolGraph`.

7. **RRF fusion**
   - Reciprocal Rank Fusion combines all active channels.

8. **Optional reranker**
   - Additional rerank stage (heuristic/http provider).

9. **Threshold and explainability**
   - Filtering by `minScore`.
   - Generation of:
     - `rankingReasons[]`
     - `scoreBreakdown { lexical/bm25, vector, pathBoost, symbolBoost, graphBoost, fusion, rerank, final }`

10. **Deterministic sorting**
   - First by score (desc),
   - then tie-breakers: `repositoryId` -> `filePath` -> `chunkIndex`.

11. **Observability**
   - The response includes `stageFlags` and `stageTimingsMs`.

This is important for reproducibility: given identical inputs, the ordering is stable.

---

## 10) Is It True That Building a Universal Algorithm for All Projects Is Difficult?

**Short answer: yes, it is.**

The reason is that relevance heavily depends on:
- the language (TS/Java/Python/Go, etc.),
- the framework (Spring/Nest/React, etc.),
- the architectural style (monolith/microservices),
- the team's coding style (naming conventions, file sizes, depth of abstractions).

Therefore, an "ideal" chunker/ranker is typically **configurable** rather than universal.

What can be done universally:
- provide a safe baseline,
- ensure explainability,
- add quality metrics and iterative tuning.

This is exactly how the current module is designed.

---

## 11) How to Tune Retrieval for Your Project

Below are practical tuning levers.

### 11.1 Chunking parameters

- Increase `chunkSizeChars` (e.g., 1400–2000) if:
  - code is frequently spread across long blocks,
  - important context does not fit within 1200 characters.

- Increase `chunkOverlapChars` (e.g., 220–320) if:
  - many relevant matches are lost at chunk boundaries.

- Decrease chunk size (800–1100) if:
  - files are very dense,
  - results are often too "diffuse" in topic coverage.

### 11.2 Search settings

- `topK`:
  - triage UI typically 5–8,
  - for deep diagnostics 10–15.

- `minScore`:
  - increase (e.g., to 0.12–0.18) to reduce noise,
  - decrease (0.05–0.08) if relevant chunks are being missed.

### 11.3 Repository scope

- Keep `aiAnalysisRepositories` precise (without unnecessary directories).
- Exclude noisy areas (`generated`, temporary artifacts, vendor code).

### 11.4 Hints from failure signals

- The better the `pathHints` and `symbolHints`, the better the ranking.
- For non-standard stack traces, it is useful to enrich/normalize parser rules.

### 11.5 Evaluating quality after each tuning iteration

Use the evaluation harness:
- `precision`
- `rootCausePrecision`
- `recallAtK`
- `rankingStability`
- `ndcgAtK`
- `mrr`
- `averageLatencyMs`

Tuning is considered successful if `recallAtK`/`precision` improved while `rankingStability` did not degrade significantly.

### 11.6 Recommended strategy

1. Establish a baseline on real failure cases.
2. Change one parameter at a time.
3. Run evaluation on the same dataset.
4. Lock in changes only when there is a measurable improvement.
