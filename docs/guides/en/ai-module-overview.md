# AI Module — Overview

Veriqorn Enterprise includes optional AI capabilities for intelligent failure analysis, code-aware test coverage scoring, and automated gap recommendations.

## Editions

| Feature | Community (OSS) | Enterprise |
|---------|-------------|-----|
| Allure ingestion & launches | Yes | Yes |
| Dashboard & analytics | Yes | Yes |
| Notifications (Slack/Telegram/Webhook) | Yes | Yes |
| Multi-project & access control | Yes | Yes |
| Selective test rerun | Yes | Yes |
| AI failure analysis | - | Yes |
| Repository indexing & retrieval | - | Yes |
| Evidence connectors (Kibana/Sentry/Grafana) | - | Yes |
| Coverage Intelligence | - | Yes |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend                        │
│  Settings UI · Failure Panel · Coverage Page     │
└──────────────────────┬──────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────┐
│                  Backend                         │
│                                                  │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Edition Gate │→ │ Indexing · Retrieval      │  │
│  │ (License)    │  │ Connectors · Analysis     │  │
│  └──────────────┘  │ Coverage Intelligence     │  │
│                    └──────────────────────────┘  │
│                         │                        │
│                    ┌────▼─────┐                   │
│                    │ Settings │  (PostgreSQL)     │
│                    └──────────┘                   │
└──────────────────────────────────────────────────┘
```

## Guides

1. [Activating Enterprise AI License](./ai-pro-license.md) — enable AI features
2. [LLM Connection](./ai-llm-connection.md) — connect an LLM provider
3. [Repository Indexing](./ai-repository-indexing.md) — index your codebase
4. [Auto-Indexing](./ai-auto-indexing.md) — automatic re-indexing on commits
5. [Knowledge Base Chat](./ai-knowledge-base-chat.md) — ask questions about your code
6. [MCP Server](./ai-mcp-server.md) — query indexed code from Claude Code / VS Code
7. [Evidence Connectors](./ai-evidence-connectors.md) — connect Kibana, Sentry, Grafana
8. [Coverage Intelligence](./ai-coverage-intelligence.md) — configure test coverage scoring
9. [AI Vector DB Setup (PostgreSQL + Qdrant)](./ai-vector-db-setup.md) — install and configure vector retrieval storage
10. [Hybrid Retrieval Architecture](../architecture/ai-retrieval-hybrid-architecture.md) — stage boundaries, pluggable interfaces, migration model
11. [Hybrid Retrieval Rollout](../rollout/ai-hybrid-retrieval-rollout.md) — staged enablement and rollback playbook

## Quick Start

```bash
# 1. Set deployment environment variables
AI_ANALYSIS_DEFAULT_MODE=pro_self_hosted
AI_ANALYSIS_MONOREPO_ROOT=/path/to/your/project

# 2. Generate the customer activation request, send it to Veriqorn, then import the issued license
GET /api/v1/edition/license-activation-request
POST /api/v1/edition/license-activations

# 3. Verify capabilities
GET /ai-analysis/capabilities
# → { "licensed": true, "features": { "analysis": { "enabled": true }, ... } }

# 4. Index your repositories
POST /ai-analysis/index/repositories

# 5. Open Coverage Intelligence page in UI
# → /projects/{projectId}/coverage
```

Set the deployment values in the Enterprise environment file. The verification public key is embedded in the Enterprise image; do not add an issuer key to `.env`.

## Retrieval Operations (Vector + Fallback)

Recommended rollout for self-hosted Enterprise:
1. Start with `aiAnalysisVectorProvider=lexical-fallback`.
2. Re-index repositories after enabling code-aware chunk metadata.
3. Switch to a supported vector provider in staging (`memory`, `in-memory`, `local-ann`).
4. Validate retrieval relevance and latency under failed-test workloads.
5. Monitor fallback ratio and warnings before production rollout.

Current hybrid retrieval stack:
- BM25 lexical channel
- ANN/vector channel (including `qdrant`)
- path/symbol hint channels
- symbol-graph expansion channel
- optional reranker stage
- reciprocal rank fusion (RRF) for channel merging

Safety defaults:
- Vector ANN operations are guarded by provider timeouts.
- On provider errors/timeouts/empty ANN matches, retrieval auto-falls back to deterministic lexical mode.
- Retrieval logs provider mode, fallback usage, candidate/match counts for diagnostics.

Rollback:
- Set `aiAnalysisVectorProvider=lexical-fallback`.
- Re-run indexing if index schema changed between releases.
