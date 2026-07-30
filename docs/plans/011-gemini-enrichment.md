# Optional Gemini Enrichment

## Purpose

Add useful AI-generated issue/pull-request summaries, priority classification,
and safe label suggestions without making deterministic automation depend on AI.

## Current state

RepoPilot's core flow is deployed and unattended: signed webhooks are stored,
rules run, GitHub labels and Slack notifications complete, and the dashboard
shows history. Gemini environment placeholders exist but no AI code or data
model exists.

## Scope

### Included

- Server-only Gemini REST client using stable `gemini-2.5-flash` by default.
- Bounded title/body prompt with prompt-injection-resistant instructions.
- Structured summary, priority, and label suggestion from an allowlist.
- Strict Zod validation after Gemini structured output.
- Event/prompt-version idempotency and one external call at most.
- Persisted succeeded, failed, or skipped enrichment status.
- Dashboard display for AI result/status.
- Timeout and sanitized failure behavior that cannot fail the core job.

### Excluded

- Automatically applying AI-suggested labels.
- AI-authored GitHub comments.
- AI-dependent rule matching or Slack delivery.
- Retrying ambiguous/failed AI calls automatically.
- User-authored prompts or arbitrary output schemas.

## Acceptance criteria

- Core job success is stored before Gemini is attempted.
- Missing configuration records `skipped` without affecting automation.
- Only one caller can claim `(event_id, prompt_version)`.
- API key, raw response, and full prompt are never logged or persisted.
- Gemini output is accepted only after strict validation.
- Suggested labels are limited to the documented allowlist.
- Authenticated dashboard queries remain tenant-scoped.

## Architecture and flow

After a job is marked successful, the worker calls an isolated enrichment
service. The service inserts a unique `processing` ledger row before the
external request. It calls Gemini with an eight-second timeout and JSON schema,
validates the candidate text, and stores only bounded safe fields. Every error
is caught and stored as a sanitized AI-only failure.

## Data model changes

Add `ai_enrichments`:

- ownership: `user_id`, `repository_id`, `event_id`;
- idempotency: unique `(event_id, prompt_version)`;
- provenance: `model`, `prompt_version`;
- state: `status`, `attempt_count`, safe error fields;
- result: bounded summary, priority, suggested label;
- timestamps.

Deleting a user/repository/event cascades to its enrichment. Authenticated users
receive read-only RLS access to their own rows.

## Security analysis

- API key stays in `GEMINI_API_KEY` and is sent only in a server header.
- Model name is allowlisted to URL-safe characters.
- Issue/PR content is untrusted, length-limited, and clearly delimited.
- The system instruction says content cannot change the task or schema.
- Structured output is still untrusted and is validated with Zod.
- The dashboard uses React escaping and never renders HTML.

## Reliability analysis

- The database claim precedes the external call, preventing duplicate spend.
- AI runs only after core completion and is wrapped so it cannot change job
  status.
- Timeout/network/API/validation failures are terminal AI records, not job
  retries.
- Model and prompt versions make results explainable and upgradeable.

## Implementation milestones

1. Add schema/migration/RLS.
2. Add prompt, client, response validation, and tests.
3. Add idempotent persistence/orchestration.
4. Invoke after core job success.
5. Add tenant-scoped dashboard display and documentation.

## Verification

```bash
npm run db:generate
npm run db:migrate
npm run build
npm run typecheck
npm run lint
npm test
```

Production:

1. Configure `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-2.5-flash`.
2. Apply the migration and deploy the branch.
3. Open a matching issue with a short body.
4. Confirm GitHub/Slack/job success regardless of AI result.
5. Confirm the dashboard shows summary, priority, suggestion, model, and status.

## Rollback or recovery

Disable Gemini by removing its two Vercel variables; new events become skipped
while the core flow continues. Revert application code if needed. Keep the
additive table for audit history unless a later migration deliberately removes
it.

## Progress

- [x] Audit current production flow and official Gemini API guidance.
- [x] Create branch and plan.
- [x] Add AI ledger schema and migration.
- [x] Implement/test Gemini boundary and orchestration.
- [x] Show tenant-scoped enrichment status/results on the dashboard.
- [x] Update architecture, data-model, decision, and learning records.
- [x] Pass tests, typecheck, lint, build, and diff validation.
- [ ] Integrate worker and dashboard.
- [ ] Update documentation and run complete verification.

## Decisions and discoveries

- AI executes after core job success, so latency/failure cannot delay required
  GitHub or Slack effects.
- Suggested labels are advisory and allowlisted; AI never writes to GitHub.
- Dashboard-only enrichment avoids making Slack wait for an optional provider.

## Learning summary

Pending implementation.
