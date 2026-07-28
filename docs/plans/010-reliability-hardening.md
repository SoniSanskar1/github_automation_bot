# Reliability Hardening and Unattended Processing

## Purpose

Make RepoPilot process accepted events without manual commands and give an
authenticated owner one safe recovery option for exhausted temporary failures.

## Current state

The protected worker atomically claims due jobs, uses bounded backoff, and
recovers `processing` locks older than five minutes. The dashboard shows job and
action history. Worker invocation is still manual, the attention metric omits
the actual `failed` status, and there is no user retry control.

## Scope

### Included

- Correct attention styling/counts for `failed`, `retrying`, and
  `unknown_outcome`.
- Tenant-scoped manual retry for exhausted temporary failures only.
- One extra attempt per explicit retry request.
- Supabase Cron + Vault setup and verification instructions.
- Security/recovery tests and production demo checklist.

### Excluded

- Retrying permanent configuration/authorization/validation failures.
- Retrying Slack `unknown_outcome`, which could duplicate a delivered message.
- A second queue, scheduler service, or new database table.
- Automatic deletion or rewriting of historical attempts.

## Acceptance criteria

- Only the authenticated event owner can request a retry.
- Only a `failed` job with an allowlisted temporary error can be requeued.
- A retry grants one additional attempt without resetting historical counts.
- Repeated retry clicks cannot enqueue more than once from the same failed state.
- Failed and ambiguous actions visibly require attention.
- Supabase invokes the existing bearer-protected worker once per minute without
  exposing the secret in source control.

## Architecture and flow

The dashboard posts a job id to a Server Action. The action verifies Supabase
identity and validates the id. A server-only recovery service joins the job to
its event, checks ownership/status/error taxonomy, and atomically moves it to
`pending` with `max_attempts = attempt_count + 1`. The existing worker and
idempotent action ledger perform the attempt.

Supabase Cron uses `pg_net` to POST to the production worker route. The URL and
bearer secret are read from encrypted Vault entries.

## Data model changes

None. Existing job attempt, maximum-attempt, status, error, and scheduling
columns support one explicit extra attempt.

## Security analysis

- The browser supplies only a job id, never a user id or error classification.
- SQL joins the job to an event owned by the verified user.
- Retryable error codes are allowlisted in server code.
- Worker authorization remains constant-time bearer verification.
- Scheduler secrets are stored in Supabase Vault and never committed.

## Reliability analysis

- The update predicate requires `failed`, so repeated submissions race safely:
  only one can transition the job.
- Attempt history is retained; maximum attempts increases only to permit one
  more claim.
- Successful action rows are skipped by idempotency.
- `unknown_outcome` is never retried because Slack may already have delivered.
- Existing stale-lock recovery handles interrupted worker invocations.

## Implementation milestones

1. Add retry taxonomy, recovery service, and tests.
2. Expose job ids/retry eligibility in the safe dashboard model.
3. Add authenticated retry action and pending UI.
4. Correct attention metrics/status styling.
5. Document Cron/Vault production setup and demo checks.

## Verification

```bash
npm run build
npm run typecheck
npm run lint
npm test
```

Production:

1. Create the Vault URL and secret entries.
2. Schedule the one-minute job.
3. Verify unauthorized worker calls return 401.
4. Verify `cron.job_run_details` and `net._http_response` show success.
5. Open a matching issue and confirm processing occurs without a manual command.

## Rollback or recovery

Unschedule the Supabase Cron job first, then revert the application changes.
Vault secrets can remain encrypted or be deleted through Supabase. No schema
rollback is needed.

## Progress

- [x] Audit existing recovery and failure behavior.
- [x] Create branch and plan.
- [x] Implement safe retry and visibility fixes.
- [x] Add scheduler runbook.
- [x] Update tests and documentation.
- [x] Run complete verification.

## Decisions and discoveries

- Stale-lock recovery already exists in the atomic claim query and is reused.
- Actual persisted action failures use `failed`, while the dashboard expected
  names that are never written; Phase 9 corrects the UI/query taxonomy.

## Learning summary

Automatic retry and manual retry solve different problems. Automatic retry uses
bounded backoff for ordinary temporary failures. Manual retry is a deliberate
operator decision after those attempts are exhausted, so it grants only one
extra attempt. The action ledger still decides which external effects may run.
Cron is only a trusted trigger; it does not contain processing logic.
