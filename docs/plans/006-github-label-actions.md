# Idempotent GitHub Label Actions

## Goal

Turn matched rule decisions into GitHub issue labels using short-lived
installation credentials and an action ledger that makes retries repeat-safe.

## Included

- Tenant-owned action-execution ledger and RLS.
- Deterministic SHA-256 action keys.
- GitHub App installation-token client.
- `github_add_label` execution for issues and pull requests.
- Success, retryable failure, and permanent failure states.
- Worker integration that resumes incomplete actions without duplicating
  successful ones.
- Tests, migration, documentation, and production verification.

## Excluded

- GitHub comments.
- Slack and Gemini.
- Scheduler setup.
- Rule-management UI.

## Reliability model

The ledger row is created before the GitHub call. A unique idempotency key
prevents duplicate planned actions. A successful row is never sent again.
Adding an existing label is naturally repeat-safe, so a retry after an ambiguous
network outcome converges on the same GitHub state.

Exactly-once effects across PostgreSQL and GitHub are not strictly possible
without a shared transaction. This design provides at-least-once attempts with
an idempotent external operation and exactly-once local success history.

## Verification

1. Create an issue whose title contains `bug`.
2. Confirm GitHub delivers and queues the webhook.
3. Invoke the worker.
4. Confirm the `bug` label appears.
5. Confirm one successful action ledger row exists.
6. Redeliver/reinvoke and confirm no second action row or duplicate label.

## Progress

- [x] Review Phase 4 production evidence and worker design.
- [x] Create `feature/github-label-actions`.
- [x] Add action ledger migration.
- [x] Implement GitHub action client and deterministic keys.
- [x] Integrate execution and retries.
- [x] Add tests and run verification.
- [x] Verify production.

Production evidence: a matching issue created one successful label action and
received the `bug` label. The follow-up `issues.labeled` webhook was processed
without another action, and the final queue was empty.
