# Manage automated test IDs

Veriqorn can reserve a stable numeric ID before a new automated test is committed. The ID is project-scoped and is issued in sequence: `1`, `2`, `3`, and so on. Use it as the test's Allure ID, not as an Allure result UUID.

## Reserve an ID

Before writing a new test, choose a stable identity based on its repository-relative path and test title. A project maintainer or owner can reserve one ID:

```bash
curl --fail-with-body -X POST "$VERIQORN_URL/api/v1/projects/default/test-case-ids/reservations" \
  -H "Authorization: Bearer $VERIQORN_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "testIdentity": "e2e/checkout.spec.ts::guest can pay by card",
    "testName": "Guest can pay by card"
  }'
```

The response contains the reserved numeric value in `data.testCaseId`. Keep the same `testIdentity` with the test source; moving a file alone must not silently change it.

## Add it to the test

Make the framework emit both labels in its Allure result. The exact decorator or helper differs by framework.

```ts
allure.label("allure.id", "42")
allure.label("veriqorn.test.identity", "e2e/checkout.spec.ts::guest can pay by card")
```

Do not generate numbers locally or reuse an ID from another test. Reserve one ID for each new test.

## What happens on import

When results arrive, Veriqorn confirms a matching reservation. If an existing numeric ID was never reserved, its first imported test claims it automatically. Existing suites without `veriqorn.test.identity` remain supported: Veriqorn uses Allure `historyId`, then `fullName`, then the test name as its identity.

If another test uses an occupied ID, Veriqorn still imports its result. The result shows **Duplicate test ID**, and the registry records the conflicting identity. This preserves the evidence while making the conflict visible for correction.

## Review reservations and conflicts

List all entries, or filter by `reserved`, `claimed`, or `conflicted`:

```bash
curl --fail-with-body \
  -H "Authorization: Bearer $VERIQORN_TOKEN" \
  "$VERIQORN_URL/api/v1/projects/default/test-case-ids?status=conflicted"
```
