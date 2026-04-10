# Test Rerun — Setup Guide

QA Report Platform allows you to re-run failed or selected tests directly from a launch page. New results replace the old ones **in the same run** — no separate child launches are created.

This guide explains how to configure the rerun pipeline end-to-end.

---

## Prerequisites

- Platform backend is running and migrations are applied (the `test_rerun_job` table must exist).
- At least one project with imported test results (so you have a launch to rerun from).
- A CI system (GitHub Actions, GitLab CI, Jenkins, etc.) that can receive webhook triggers — **or** a local test-rerun agent.

---

## Step 1 — Open Rerun Settings

1. Go to **Settings** in the left sidebar.
2. Click **Test Rerun** in the settings navigation.
3. Select the **project** you want to configure in the "Project scope" dropdown (settings are stored per project).

---

## Step 2 — Create an Execution Profile

Each project needs at least one execution profile that tells the platform *how* to trigger your tests.

### Profile fields

| Field | Description | Example |
|-------|-------------|---------|
| **Profile name** | Human-readable label | `Playwright CI Rerun` |
| **Framework** | Test framework used in the project | `playwright`, `junit`, or `testng` |
| **Execution mode** | How the platform triggers the rerun | `ci-webhook` or `agent` |
| **Trigger mode** | Run only the selected tests or a full pipeline | `tests_only` or `full_pipeline` |
| **Command template** | Shell command with placeholders (see below) | `npx playwright test --grep "{{selectorExpression}}"` |
| **CI trigger URL** | Webhook URL your CI listens on (for `ci-webhook` mode) | `https://ci.example.com/api/trigger` |
| **Enabled** | Toggle to enable/disable the profile | checked |
| **Active profile** | Radio button — which profile to use when multiple exist | selected |

### Command template placeholders

| Placeholder | Replaced with | Example output |
|-------------|---------------|----------------|
| `{{selectorExpression}}` | Regex-compatible expression joining all selected test names/IDs | `Login test\|Logout test` |
| `{{selectorArgs}}` | Space-separated arguments | `--grep "Login test" --grep "Logout test"` |

### Example profiles

**Playwright (CI webhook):**
```
Profile name:     Playwright Rerun
Framework:        playwright
Execution mode:   ci-webhook
Trigger mode:     tests_only
Command template: npx playwright test --grep "{{selectorExpression}}"
CI trigger URL:   https://ci.example.com/api/pipelines/trigger
```

**JUnit (CI webhook):**
```
Profile name:     JUnit Rerun
Framework:        junit
Execution mode:   ci-webhook
Trigger mode:     tests_only
Command template: mvn test -Dtest="{{selectorExpression}}"
CI trigger URL:   https://jenkins.example.com/job/rerun/buildWithParameters
```

Click **Save rerun settings** after filling in the profile.

---

## Step 3 — Configure Your CI to Accept the Webhook

When you click "Rerun" in the UI, the platform sends a `POST` request to your **CI trigger URL** with this JSON body:

```json
{
  "projectId": "my-project",
  "parentRunId": 42,
  "executionProfileId": "profile-uuid",
  "framework": "playwright",
  "triggerMode": "tests_only",
  "command": "npx playwright test --grep \"Login test|Logout test\"",
  "commandArgs": ["--grep", "Login test|Logout test"],
  "selectors": [
    { "kind": "testName", "value": "Login test", "testResultId": "uuid-1" },
    { "kind": "testName", "value": "Logout test", "testResultId": "uuid-2" }
  ]
}
```

Your CI pipeline should:

1. Parse the `command` field and execute it (run the tests).
2. Collect the Allure results.
3. Upload results back to the platform **with `parentRunId`** so they merge into the original run.

### Upload results back (CI script example)

```bash
# After tests finish and allure-results/ directory is ready:

zip -r allure-results.zip allure-results/

curl -X POST "https://your-platform.com/upload/ci/allure-results?projectId=my-project" \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -F "file=@allure-results.zip" \
  -F "runName=Rerun" \
  -F "parentRunId=42" \
  -F "projectId=my-project"
```

Key detail: **`parentRunId`** tells the upload endpoint to import results into the existing launch instead of creating a new one. Old results for re-run tests (matched by test name) are automatically replaced.

### GitHub Actions example

```yaml
name: Test Rerun
on:
  repository_dispatch:
    types: [test-rerun]

jobs:
  rerun:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: ${{ github.event.client_payload.command }}
        continue-on-error: true

      - name: Upload results to platform
        run: |
          cd allure-results && zip -r ../allure-results.zip . && cd ..
          curl -X POST "${{ secrets.QA_PLATFORM_URL }}/upload/ci/allure-results?projectId=${{ github.event.client_payload.projectId }}" \
            -H "Cookie: access_token=${{ secrets.QA_PLATFORM_TOKEN }}" \
            -F "file=@allure-results.zip" \
            -F "runName=Rerun" \
            -F "parentRunId=${{ github.event.client_payload.parentRunId }}" \
            -F "projectId=${{ github.event.client_payload.projectId }}"
```

For this example, set the **CI trigger URL** in the profile to:
```
https://api.github.com/repos/OWNER/REPO/dispatches
```
And add authorization headers in the CI Headers field or use `ciHeaders` in the settings API.

---

## Step 4 — Rerun Tests from the UI

1. Open a launch detail page (**Launches** > click a run).
2. Switch to the **Tests** tab.
3. Select tests to rerun:
   - **Single test**: click the rerun icon next to a test result.
   - **Selected tests**: check multiple tests with checkboxes, then click "Rerun selected".
   - **All failed/broken**: click "Rerun failed & broken".
4. A progress banner appears at the top of the page showing the rerun job status.
5. When CI uploads results with `parentRunId`, the test results in the current launch are **automatically updated** — the page refreshes to show new results.

---

## How It Works (Data Flow)

```
 UI: click "Rerun"
       |
       v
 Backend: create rerun job (status: queued)
       |
       v
 Backend: POST webhook to CI trigger URL
       |  (payload includes parentRunId, command, selectors)
       v
 CI: runs the command, produces allure-results
       |
       v
 CI: uploads ZIP to /upload/ci/allure-results
       |  with parentRunId in the form data
       v
 Backend: deletes old results (by test name) from parent run
 Backend: imports new results into the same run
       |
       v
 UI: polls rerun job status, refreshes page on completion
```

---

## Execution Modes

### ci-webhook (recommended)

The platform sends a POST request to your CI trigger URL. Your CI runs the tests and uploads results. This is the most common setup for teams with existing CI pipelines.

### agent

The platform sends the command to a local test-rerun agent service (configured via the `TEST_RERUN_AGENT_ENDPOINT` environment variable on the backend). The agent executes the command locally and uploads results. Useful for local development or on-premise setups without webhook-capable CI.

Set the env var on the backend:
```
TEST_RERUN_AGENT_ENDPOINT=http://localhost:4000/execute
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Failed to start rerun job" error in UI | `test_rerun_job` table doesn't exist | Restart the backend — migrations run automatically on startup |
| Rerun job stays in "queued" status | No execution profile configured or CI trigger URL is empty | Go to Settings > Test Rerun and configure a profile with CI trigger URL |
| Rerun job status is "failed" with "CI webhook returned HTTP 4xx" | CI rejected the webhook | Check CI trigger URL, auth headers, and CI pipeline configuration |
| New results appear in a separate launch | CI uploaded without `parentRunId` | Update CI script to include `-F "parentRunId=..."` in the upload call |
| "Agent endpoint is not configured" | Using `agent` mode without `TEST_RERUN_AGENT_ENDPOINT` env var | Set the env var or switch to `ci-webhook` mode |

---

## API Reference (for CI integration scripts)

### Upload with parent run merge

```
POST /upload/ci/allure-results?projectId=<projectId>
Content-Type: multipart/form-data

Form fields:
  file          - ZIP file containing allure-results
  runName       - Display name (used only when creating a new run)
  parentRunId   - (optional) ID of existing run to merge into
  projectId     - Project ID
  environment   - (optional) Environment label
  branch        - (optional) Branch name
  tags          - (optional) JSON array of tags
```

When `parentRunId` is provided:
- No new run is created.
- Old test results with matching names are deleted from the parent run.
- New results are imported into the parent run.

When `parentRunId` is omitted:
- A new run is created (standard upload behavior).
