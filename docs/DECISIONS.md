# Architecture Decision Log

Update this file when a meaningful decision changes. Do not rewrite history; add a superseding decision.

## ADR-001 — Modular monolith

**Status:** Accepted

**Decision:** Use one Next.js TypeScript codebase with internal domain modules.

**Why:** The product is small and must be completed and deployed within 72 hours. Separate frontend/backend services or microservices add deployment, authentication, CORS, monitoring, and failure-mode overhead without improving the assessment outcome.

**Trade-off:** Independent scaling and language specialization are deferred.

## ADR-002 — PostgreSQL-backed durable processing

**Status:** Accepted

**Decision:** Store webhook events and processing jobs in Supabase PostgreSQL, using a transactional event/job insert and scheduled worker.

**Why:** The assessment requires no silent loss and duplicate protection. PostgreSQL is already required for application data and provides transactions, constraints, indexes, and job-locking primitives without another paid or operational service.

**Trade-off:** It is not a high-throughput event broker. It is sufficient for assessment volume.

## ADR-003 — GitHub OAuth for user login, GitHub App for bot authorization

**Status:** Accepted

**Decision:** Use Supabase GitHub OAuth to establish the human dashboard identity, and a GitHub App installation token for repository access and write-back.

**Why:** Human login and bot repository authorization solve different problems. GitHub App installations provide repository selection, scoped permissions, and short-lived installation tokens.

**Trade-off:** Setup and callback flow are more involved than using one personal token.

## ADR-004 — Acknowledge only after durable ingestion

**Status:** Accepted

**Decision:** The webhook route verifies and stores the event/job, then returns without waiting for GitHub write-back, Slack, or AI.

**Why:** Downstream availability should not determine whether the incoming event is accepted. This reduces webhook timeout risk and supports retries.

**Trade-off:** Actions are eventually consistent rather than immediate within the webhook request.

## ADR-005 — Configurable deterministic rules before AI

**Status:** Accepted

**Decision:** Core automation uses explicit deterministic conditions and actions. AI is optional enrichment.

**Why:** Deterministic rules are testable and reliable. An AI outage or malformed output must not break the required automation flow.

**Trade-off:** Initial matching is intentionally limited.

## ADR-006 — One environment-level Slack destination for the core build

**Status:** Accepted provisionally

**Decision:** Use one Slack Incoming Webhook URL stored in server environment variables for the assessment demo.

**Why:** It satisfies the required notification flow with minimal security and UI complexity.

**Trade-off:** It is not a complete multi-tenant Slack OAuth implementation. A secure per-user Slack integration is future work.

## ADR-007 — AI enrichment is advisory and post-success

**Status:** Accepted

**Decision:** Gemini runs only for matched, newly opened issues and pull
requests, after deterministic GitHub/Slack actions and the processing job have
already succeeded. Its structured result is shown on the dashboard and never
applied automatically.

**Why:** External AI is slower, probabilistic, and may be unavailable. Keeping
it outside the core success boundary preserves reliable automation and limits
cost. An allowlist and Zod validation prevent arbitrary labels or output shapes.

**Trade-off:** AI failures are visible separately and are not automatically
retried. A process interruption after claiming the AI ledger may require future
operator recovery, deliberately avoiding accidental duplicate provider spend.

## ADR-008 — Start dashboard live updates with safe polling

**Status:** Accepted

**Decision:** Refresh authenticated server-rendered dashboard history every 15
seconds instead of subscribing the browser directly to Supabase Realtime.

**Why:** The server already has a clear ownership path from the verified
Supabase user to repositories and events. Polling preserves that boundary and
meets the live-demo requirement with less authorization risk.

**Trade-off:** Updates may appear up to 15 seconds late and each open dashboard
performs periodic reads. Realtime can replace polling when private,
tenant-scoped subscriptions are implemented and tested.

## ADR-009 — Disable rules instead of deleting them

**Status:** Accepted

**Decision:** The simple rule-management UI supports enable and disable but does
not expose permanent deletion.

**Why:** Rule evaluations and action executions reference the rule with
`ON DELETE CASCADE`. Deleting a rule would erase evidence needed to explain
past automation.

**Trade-off:** Disabled rules remain stored and visible. A future archive model
or safer foreign-key strategy can support lifecycle cleanup without destroying
history.

## ADR-010 — Send AI output as a separate post-success Slack follow-up

**Status:** Accepted

**Decision:** Keep the deterministic Slack alert unchanged, then send one
separate AI follow-up only after validated enrichment succeeds and only when the
matched rule requested Slack.

**Why:** This completes the assessment's notification-and-dashboard AI goal
without delaying or weakening the required notification. A separate AI-ledger
state makes failure and ambiguous delivery visible.

**Trade-off:** A matching event produces two Slack messages. Ambiguous AI
follow-up delivery is not retried because Slack Incoming Webhooks do not provide
a lookup identifier.

## ADR-011 — Store rule conditions and actions as validated JSON

**Status:** Accepted

**Decision:** Store the small rule condition and action lists in PostgreSQL
JSONB columns and validate them with the same schemas used by the worker.

**Why:** The supported rule language is intentionally small and versioned as one
unit. JSONB keeps each rule readable and avoids several child tables without
allowing arbitrary executable input.

**Trade-off:** More complex reporting across individual conditions would be
easier with normalized child tables. If the rule language grows, the storage
model should be reviewed.

## ADR-012 — Support issues and pull requests, not push events

**Status:** Accepted

**Decision:** Subscribe to `issues` and `pull_request`, the two event types
required for the demonstrated rule workflow. Do not subscribe to `push` only to
increase the event count.

**Why:** Both event types can use the same bounded title/author/label rule model
and GitHub label action. Push automation would require a separate condition and
action design that was not needed for the assessment.

**Trade-off:** Repository push activity is outside the current product scope.

## ADR-013 — Claim jobs with one atomic PostgreSQL statement

**Status:** Accepted

**Decision:** Claim due jobs with a transaction and row locking rather than
loading pending rows and updating them in separate application calls.

**Why:** Multiple worker invocations can overlap. An atomic claim prevents two
workers from processing the same job while still allowing abandoned claims to
be recovered after their lease expires.

**Trade-off:** The queue relies on PostgreSQL-specific locking behavior and is
designed for the current workload rather than very high throughput.
