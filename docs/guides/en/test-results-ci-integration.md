# Send automated test results to Veriqorn

Use this guide to make every automated test run visible in Veriqorn. Your test job produces an `allure-results` directory; the final CI step packages it and sends it to the platform.

## Choose an integration pattern

| Pattern | Best for | How it works |
|---|---|---|
| Direct CI upload | Most teams | Add one upload step after the test command. |
| Existing script or runner | Teams with custom tooling | Run the same `curl` command from your script after results are produced. |
| Test rerun pipeline | Rerunning selected tests from Veriqorn | Configure [Test Rerun](test-rerun-setup.md); its CI job uploads results back into the original launch. |

The first two patterns create a new launch for each run. For a rerun, use `parentRunId` as described in the Test Rerun guide.

## Before you begin

- The platform is running and reachable from the CI runner.
- Your test framework is configured to write Allure result files to `allure-results/`.
- Create credentials for the CI job and store them only in your CI secret store. Do not commit credentials, cookies, or result archives to the repository.

## Upload after the test command

The normalized import endpoint accepts an Allure result file or a ZIP archive. Run this after your tests; `if: always()` or its equivalent is important so failed tests are reported too.

```bash
zip -r allure-results.zip allure-results/

curl --fail-with-body -X POST "$VERIQORN_URL/api/v1/projects/default/imports/allure-jobs" \
  -b "$VERIQORN_COOKIE_FILE" \
  -F "file=@allure-results.zip" \
  -F "runName=$CI_RUN_NAME" \
  -F "sourceKind=ci_archive" \
  -F "branch=$CI_BRANCH" \
  -F "environment=$CI_ENVIRONMENT"
```

Replace `default` with your project ID. Set only the metadata fields you use; `runName` is the label shown in Veriqorn.

For an initial setup, create the cookie file with a session request and save it as a protected CI secret or generated job file:

```bash
curl --fail-with-body -c "$VERIQORN_COOKIE_FILE" \
  -X POST "$VERIQORN_URL/api/v1/auth/session" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$VERIQORN_EMAIL\",\"password\":\"$VERIQORN_PASSWORD\"}"
```

Use a dedicated non-personal account for this integration and keep its password in the CI secret store.

## GitHub Actions example

Add secrets for `VERIQORN_URL`, `VERIQORN_EMAIL`, and `VERIQORN_PASSWORD` in the repository or organization settings.

```yaml
- name: Run tests
  run: npm test
  continue-on-error: true

- name: Upload Allure results to Veriqorn
  if: always()
  env:
    VERIQORN_URL: ${{ secrets.VERIQORN_URL }}
    VERIQORN_EMAIL: ${{ secrets.VERIQORN_EMAIL }}
    VERIQORN_PASSWORD: ${{ secrets.VERIQORN_PASSWORD }}
  run: |
    curl --fail-with-body -c veriqorn.cookies \
      -X POST "$VERIQORN_URL/api/v1/auth/session" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$VERIQORN_EMAIL\",\"password\":\"$VERIQORN_PASSWORD\"}"
    zip -r allure-results.zip allure-results/
    curl --fail-with-body -X POST "$VERIQORN_URL/api/v1/projects/default/imports/allure-jobs" \
      -b veriqorn.cookies \
      -F "file=@allure-results.zip" \
      -F "runName=${{ github.workflow }} #${{ github.run_number }}" \
      -F "sourceKind=ci_archive" \
      -F "branch=${{ github.ref_name }}"
```

For GitLab CI, Jenkins, Azure Pipelines, or a self-hosted runner, use the same two commands in an `after_script`, post-build action, or final pipeline step.

## Verify and troubleshoot

Open **Launches** after the CI job finishes. A new launch should show the run name, branch, environment, and imported tests.

| Symptom | What to check |
|---|---|
| Upload is skipped after a failed test | Make the upload step unconditional (`if: always()`, `after_script`, or equivalent). |
| `allure-results` is missing | Configure the test reporter and confirm the directory exists before zipping it. |
| 401 or 403 response | Check the CI credentials and that the platform URL is reachable from the runner. |
| Launch appears in the wrong project | Replace `default` in the endpoint with the intended project ID. |
