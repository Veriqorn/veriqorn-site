# Coverage Intelligence

Coverage Intelligence provides a project-scoped view of test coverage quality using code-aware units, evidence signals, and weighted scoring — without requiring strict requirement-to-test traceability.

## Prerequisites

- AI Pro license active ([see activation guide](./ai-pro-license.md))
- Repository indexing configured ([see indexing guide](./ai-repository-indexing.md)) — recommended but not required

## Concepts

### Coverage units

Instead of measuring coverage by test count alone, the system defines **coverage units** — meaningful things that should be tested:

| Type | Example | Key format |
|------|---------|------------|
| `api_endpoint` | CI Upload Allure Results | `POST:/upload/ci/allure-results` |
| `ui_flow` | Launch detail page | `launches.open-details` |
| `domain_operation` | Notification dispatch | `notifications.dispatch-on-run-complete` |

Each unit has a `moduleKey` (feature area), `isCritical` flag, and optional `owner`.

### Evidence signals

Every unit is evaluated against 6 signals, each normalized to `[0..1]`:

| Signal | What it measures |
|--------|-----------------|
| `codePresence` | Unit exists in current code inventory |
| `testPresence` | At least one automated test is mapped to the unit |
| `executionFreshness` | Mapped tests were executed recently |
| `executionStability` | Mapped tests are stable (low flaky/failure rate) |
| `assertionDepth` | Both happy-path and negative/error assertions exist |
| `incidentLink` | Incidents or defects linked to this unit |

### Scoring formula

Per-unit coverage:

```
effectiveCoverage = 0.25×codePresence + 0.30×testPresence
                  + 0.20×executionFreshness + 0.15×executionStability
                  + 0.10×assertionDepth
```

Project-level score (risk-adjusted):

```
projectCoverageScore = 100 × Σ(unitCoverage × riskWeight) / Σ(riskWeight)
```

### Confidence

Each unit also has a confidence score based on evidence completeness, mapping precision, and data recency. This tells you how much to trust the coverage number:

- **High** (≥75%) — strong evidence, reliable score
- **Medium** (50–74%) — partial evidence, directionally useful
- **Low** (<50%) — limited evidence, use as a starting point

## Getting started

### 1. Open the Coverage page

Navigate to **Coverage** in the sidebar (visible only with Pro license), or go to:

```
/projects/{projectId}/coverage
```

### 2. Rebuild inventory

Click **Rebuild Inventory**. This:

- Catalogs all coverage units from the platform's API surface, UI flows, and domain operations
- Queries recent test run history for the active project
- Computes evidence signals for each unit based on test name heuristic matching

### 3. Review the dashboard

After rebuild, you'll see:

- **Coverage Score** — overall project coverage percentage
- **Units** — how many units have adequate coverage
- **Confidence** — how reliable the score is
- **Gaps** — number of under-covered units

### 4. Explore module breakdown

The **Module Breakdown** section shows coverage per feature area (upload, auth, dashboard, etc.), so you can identify which modules need attention.

### 5. Review top gaps

The **Top Coverage Gaps** section lists units sorted by priority:

- **Critical** — low coverage + high risk weight (critical feature, no tests)
- **High** — below threshold + meaningful risk
- **Medium/Low** — below threshold, lower risk

Click a gap to expand and see unit details (ID, risk weight, effective coverage).

### 6. Generate AI recommendations

Click **Generate Recommendations** to get AI-assisted suggestions for what to test next. Each recommendation includes:

- **Priority** — aligned with gap severity
- **Risk reason** — why this unit is high-risk
- **Coverage reason** — what's missing (no tests, weak assertions, stale execution)
- **Suggested scenario** — a Given/When/Then outline for a new test
- **Estimated impact** — projected coverage and confidence improvement

## API reference

All endpoints require JWT authentication and an active Pro license.

### Rebuild inventory

```bash
POST /test-coverage/inventory/rebuild?projectId={id}
```

### Get inventory

```bash
GET /test-coverage/inventory?projectId={id}
```

### Get coverage summary

```bash
GET /test-coverage/summary?projectId={id}
```

Response:

```json
{
  "projectCoverageScore": 42.5,
  "totalUnits": 28,
  "coveredUnits": 12,
  "projectConfidence": 0.58,
  "confidenceBand": "medium",
  "generatedAt": "2025-06-15T10:30:00Z"
}
```

### Get module breakdown

```bash
GET /test-coverage/modules?projectId={id}
```

### Get coverage gaps

```bash
GET /test-coverage/gaps?projectId={id}
```

### Generate recommendations

```bash
POST /test-coverage/recommendations/generate?projectId={id}
```

### Get stored recommendations

```bash
GET /test-coverage/recommendations?projectId={id}
```

## Customizing scoring weights

The default weights can be overridden via Settings:

```bash
curl -X POST http://localhost:3001/settings/testCoverageScoringWeights \
  -H "Content-Type: application/json" \
  -b "auth_token=<jwt>" \
  -d '{
    "value": {
      "codePresence": 0.15,
      "testPresence": 0.40,
      "executionFreshness": 0.20,
      "executionStability": 0.15,
      "assertionDepth": 0.10
    }
  }'
```

After changing weights, rebuild the inventory and re-check the summary — scores will reflect the new weighting.

## Current limitations

- **Coverage units are platform-defined** — the catalog covers the QA Report Platform's own surface (APIs, UI flows, domain operations). Custom unit definitions are planned.
- **Test mapping is heuristic** — tests are matched to units by keyword matching on test names. Explicit test-to-unit annotations are planned.
- **No incremental updates** — rebuilding the inventory re-scans everything. Incremental evidence updates are planned.
- **Recommendations are template-based** — when no LLM is configured, scenarios use structured templates. With an LLM connected, richer natural-language suggestions are generated.

## Full contract reference

See the detailed scoring formulas, risk weights, and confidence model in:

```
docs/contracts/test-coverage-intelligence-contract.md
```
