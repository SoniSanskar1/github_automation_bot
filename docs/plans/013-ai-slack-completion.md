# AI Slack Completion

## Purpose

Complete the assessment's literal AI stretch wording by showing validated
Gemini enrichment in Slack as well as the authenticated dashboard, without
making core automation depend on either Gemini or the AI follow-up notification.

## Current state

Matched rules can add a GitHub label and send a deterministic Slack alert.
After the core job succeeds, `attemptEventEnrichment` stores a summary, priority,
and allowlisted label suggestion in `ai_enrichments`. The dashboard displays it,
but Slack does not.

## Scope

### Included

- An AI-specific Slack message with escaped repository content.
- AI-ledger notification status and sanitized failure fields.
- One AI Slack attempt only when a matched rule requested Slack.
- Dashboard visibility for the AI notification outcome.
- Exact GPT-5.6/free-tier disclosure updates.

### Excluded

- Automatically applying AI labels.
- Delaying or changing the original deterministic Slack alert.
- Automatic retry of ambiguous Slack delivery.
- Slack OAuth or per-user Slack destinations.

## Acceptance criteria

- Core GitHub and Slack actions are committed before AI starts.
- Successful enrichment sends one separate Slack follow-up.
- AI/AI-Slack failure cannot change the succeeded job.
- Unknown Slack delivery is never automatically repeated.
- The dashboard shows the AI notification state.
- Tests validate escaping/message content and view-model isolation.

## Architecture and flow

The worker passes whether any matched rule planned Slack. Gemini remains
post-success. After storing a validated enrichment, the service atomically moves
the unique AI ledger's notification state from `not_requested` to `processing`,
sends the follow-up, and stores a safe terminal outcome.

## Data model changes

Add to `ai_enrichments`:

- `notification_status`
- `notification_attempt_count`
- `notification_error_code`
- `notification_error_message`
- `notified_at`

The existing `(event_id, prompt_version)` uniqueness remains the idempotency
boundary. Ownership and cascade behavior are unchanged.

## Security analysis

- The Gemini key and Slack URL remain server-only.
- Untrusted summary/title-like content is escaped for Slack.
- No raw provider response or secret is logged or persisted.
- Suggested labels remain advisory.

## Reliability analysis

- Original Slack is independent and completes first.
- The AI ledger makes the follow-up visible and prevents normal duplicate sends.
- Timeout/ambiguous delivery becomes `unknown_outcome` and is not retried.
- Provider/configuration errors affect only enrichment notification state.

## Implementation milestones

1. Add migration and schema fields.
2. Add/test AI Slack message.
3. Orchestrate delivery and persist safe state.
4. Display status and update docs.
5. Run all checks and push.

## Verification

Run typecheck, lint, tests, build, and diff validation. In production, create a
matching issue/PR and confirm the original Slack alert, AI follow-up, dashboard
AI card, and unchanged succeeded job.

## Rollback or recovery

Revert application commits to stop new follow-ups. The additive nullable/default
columns can remain safely; do not edit or roll back an already-applied migration.

## Progress

- [x] Review assessment gap and current flow.
- [x] Choose separate AI-ledger notification state.
- [x] Implement migration and code.
- [x] Update tests and documentation.
- [x] Run full verification.
- [x] Commit and push.

## Decisions and discoveries

- A second Slack message preserves the original alert's deterministic timing and
  clearly labels AI output as advisory.
- Reusing `action_executions` would require falsely assigning enrichment to one
  rule even when several rules matched.

## Learning summary

Optional post-processing needs its own observable state boundary. Separating the
follow-up keeps probabilistic enrichment from weakening the required workflow.
