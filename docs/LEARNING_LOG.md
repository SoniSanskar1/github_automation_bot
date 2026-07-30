# Learning Log

Codex should append one concise section after each meaningful milestone.

## 2026-07-28 — Phase 6 Slack notifications

**What was built**

A Slack Incoming Webhook action with escaped messages, durable ledger state,
retry classification, and conservative handling of ambiguous delivery outcomes.

**End-to-end flow**

A matched version-2 rule plans label and Slack actions with separate keys. The
worker skips either action if already successful, posts the Slack JSON payload,
and stores success or a categorized failure without exposing the webhook URL.

**Important code**

- `src/modules/slack/message.ts` builds escaped notifications.
- `src/modules/slack/client.ts` owns the secret HTTP boundary.
- `src/modules/actions/slack-executor.ts` manages Slack ledger transitions.
- `drizzle/0004_add-slack-notification-action.sql` upgrades the demo rule.

**Why this approach**

Independent ledger rows prevent a Slack retry from repeating GitHub work.
Ambiguous network outcomes stop automatic retries because Slack offers no
message reference from an incoming webhook response.

**How to test**

Create a matching bug issue after deployment, invoke the worker, and confirm one
GitHub label, one Slack message, and two successful action rows.

**Failure modes**

429 and 5xx responses retry. Clear 4xx errors fail permanently. Network or
timeout ambiguity becomes `unknown_outcome`. Missing configuration is permanent.

## 2026-07-28 — Phase 5 idempotent GitHub label actions

**What was built**

A durable action ledger and GitHub App client that add labels for matched rules
without repeating completed actions.

**End-to-end flow**

A matched evaluation produces a deterministic action key. The worker stores the
ledger row, creates a short-lived installation-authenticated GitHub client,
adds the label, and records success. Existing successful rows are skipped.

**Important code**

- `src/modules/actions/key.ts` creates deterministic SHA-256 keys.
- `src/modules/actions/executor.ts` manages action state and retry metadata.
- `src/modules/github/labels.ts` uses transient installation authentication.
- `src/modules/github/failure.ts` classifies safe retry/permanent failures.
- `drizzle/0003_material_pete_wisdom.sql` adds the tenant-owned action ledger.

**Why this approach**

The ledger exists before external work, so retries have durable context. Label
addition is repeat-safe on GitHub. Short-lived installation tokens preserve
least privilege and are never stored.

**How to test**

After deployment, create an issue with `bug` in the title, confirm its webhook is
queued, invoke the worker, and verify one `bug` label plus one successful ledger
row. Redelivery and another worker call must not create another row.

**Failure modes**

Permissions, missing resources, and invalid labels fail permanently. Rate limits,
GitHub server errors, and network errors enter bounded retry state. Errors are
sanitized and tokens are never logged.

**Concept mapping**

The action ledger resembles an outbox/execution table. The GitHub installation
token is a short-lived service credential, and the deterministic key is an
idempotency key.

## 2026-07-28 — Phase 4 job worker and rule engine

**What was built**

An authenticated worker that atomically claims queued jobs, evaluates versioned
rules, records explanations, recovers stale locks, and schedules bounded retries.

**End-to-end flow**

The worker verifies a private bearer secret, claims due jobs with one
`FOR UPDATE SKIP LOCKED` statement, normalizes the stored GitHub payload, loads
enabled rules for the repository/event/action, evaluates every condition, and
transactionally stores evaluations plus final job state.

**Important code**

- `src/modules/jobs/worker.ts` owns claiming and job state transitions.
- `src/modules/jobs/retry.ts` defines bounded backoff.
- `src/modules/rules/engine.ts` validates and evaluates safe conditions/actions.
- `src/app/api/internal/jobs/process/route.ts` protects the worker boundary.
- `drizzle/0002_optimal_frog_thor.sql` adds rules, evaluations, RLS, and the demo
  rule.

**Why this approach**

Atomic database claiming prevents concurrent processing. Versioned evaluation
keys prevent duplicate audit records. Invalid rules/payloads fail permanently,
while unexpected temporary failures retry up to the configured maximum.

**How to test**

Run all automated checks. After deployment, call the worker with missing and
incorrect secrets and expect 401, then use the correct secret and confirm the
pending job becomes succeeded with one rule evaluation.

**Failure modes**

Unauthorized callers cannot start work. Crashed workers leave a lock that
becomes eligible after five minutes. Temporary failures use bounded backoff.
Invalid event or rule data is sanitized and marked failed rather than retried.

**Concept mapping**

The worker resembles a scheduled Spring service or Celery task consumer.
`FOR UPDATE SKIP LOCKED` is the queue-claim primitive, and rule evaluations are
an immutable audit table.

## 2026-07-28 — Phase 3 webhook ingestion

**What was built**

A public GitHub webhook endpoint with raw-body signature verification,
allowlisted event validation, duplicate prevention, repository ownership
mapping, and transactional event/job storage.

**End-to-end flow**

GitHub signs the exact request body with the shared webhook secret. RepoPilot
checks that signature before JSON parsing, validates the event and delivery ID,
maps the signed repository and installation to an active connection, and inserts
the event plus pending job in one transaction. Duplicate delivery IDs return
success without another event or job.

**Important code**

- `src/modules/webhooks/signature.ts` computes and constant-time compares HMACs.
- `src/modules/webhooks/payload.ts` validates headers and safe routing fields.
- `src/modules/webhooks/ingestion.ts` resolves ownership and persists atomically.
- `src/app/api/github/webhooks/route.ts` maps failures to HTTP responses and
  writes safe structured logs.
- `drizzle/0001_lethal_turbo.sql` creates the durable inbox and queue with RLS.

**Why this approach**

Signature verification blocks forged events. The delivery-ID constraint makes
redelivery repeat-safe. One transaction prevents an accepted event from losing
its job. Slow actions are deferred so GitHub receives a prompt acknowledgement.

**How to test**

Run the migration and all quality commands. In production, configure one shared
webhook secret, enable Issues and Pull requests, confirm GitHub's ping succeeds,
create a test issue, and verify exactly one event and pending job in Supabase.

**Failure modes**

Forged signatures return 401. Oversized bodies return 413. Malformed supported
payloads return 400. Unsupported signed events are acknowledged and ignored.
Unmapped repositories are acknowledged with a safe status, while unexpected
database errors return 500 so GitHub can redeliver.

**Concept mapping**

The webhook route resembles a signed controller boundary. `webhook_events` is
an inbox table, while `processing_jobs` is a durable queue. Their transaction is
similar to a Spring `@Transactional` service or Django `transaction.atomic`.

## 2026-07-28 — Phase 2 GitHub App installation

**What was built**

Database-backed GitHub App installation, verified repository synchronization,
tenant-scoped dashboard reads, and security policies for profiles,
installations, and repositories.

**End-to-end flow**

The signed-in user starts installation from the dashboard. RepoPilot stores a
short-lived random state in an HTTP-only cookie and sends the user to GitHub.
GitHub's setup callback returns the installation ID and state. RepoPilot stores
that ID server-side in another HTTP-only cookie and starts GitHub user OAuth
with fresh state. It exchanges the returned code for a temporary user token,
confirms that GitHub lists the stored installation for that user, loads its
repositories, saves everything in one transaction, discards the token, and
returns to the dashboard.

**Important code**

- `src/db/schema.ts` defines application tables, relations, and indexes.
- `drizzle/0000_violet_stark_industries.sql` adds foreign keys, RLS, and policies.
- `src/modules/github/api.ts` is the validated GitHub API boundary.
- `src/modules/github/repository-sync.ts` owns transactional, user-scoped writes
  and reads.
- `src/app/api/github/install/**` handles the browser installation transitions.

**Why this approach**

GitHub callback parameters can be spoofed, so the installation is checked
against GitHub before persistence. State prevents cross-site request forgery.
Transactions prevent half-saved installations. RLS and explicit `user_id`
conditions provide two tenant-isolation layers. Tokens are never persisted.

**How to test**

Run `npm run db:migrate`, `npm run typecheck`, `npm run lint`, `npm test`, and
`npm run build`. After deployment, sign in, install the GitHub App on a test
repository, confirm success on the dashboard, and repeat the flow to ensure no
duplicate repository appears.

**Failure modes**

Expired state, missing authorization, inaccessible installations, malformed
GitHub data, ownership conflicts, and database failures produce a sanitized
dashboard result. A database URL containing unescaped special characters can
fail parsing; connection strings must be copied correctly and secrets must be
rotated if diagnostic output exposes them.

**Concept mapping**

The Drizzle schema plus SQL migration resembles JPA entities plus Flyway, or
Django models plus migrations. The synchronization service resembles a
transactional service method. RLS acts like a database-level tenant guard in
addition to application authorization.

## 2026-07-28 — Phase 1 GitHub authentication

**What was built**

GitHub OAuth through Supabase Auth, cookie-based SSR sessions, a PKCE callback, safe redirects, session refresh, a protected dashboard, and sign-out.

**End-to-end flow**

The sign-in route asks Supabase to begin GitHub OAuth. GitHub returns to Supabase, which redirects an authorization code to the application callback. The callback exchanges that code for a cookie session. The dashboard verifies the user with Supabase before rendering; signed-out requests return to the landing page.

**Important code**

- `src/lib/supabase/server.ts` creates request-scoped cookie clients.
- `src/modules/auth/session-proxy.ts` refreshes expiring sessions.
- `src/modules/auth/safe-redirect.ts` prevents external post-login redirects.
- `src/app/auth/**` implements sign-in, callback, and sign-out transitions.
- `src/app/dashboard/page.tsx` enforces server-side access.

**Why this approach**

`@supabase/ssr` implements PKCE and cookie synchronization for Next.js without exposing secret keys. The dashboard verifies identity itself instead of trusting UI state or proxy execution alone. The proxy excludes public routes so authentication-provider availability does not control basic application health.

**How to test**

Run typecheck, lint, tests, and build. Start the app, confirm signed-out `/dashboard` redirects home, complete GitHub sign-in, verify the dashboard identity, sign out, and confirm dashboard access is removed.

**Failure modes**

Provider or callback failures return sanitized messages. Missing public configuration fails validation when auth is used. External `next` targets fall back to `/dashboard`. If a requested callback is absent from Supabase's redirect allowlist, Supabase falls back to the Site URL; this was observed and corrected during the local OAuth test. Profile persistence and tenant-owned data remain later work.

**Concept mapping**

The Next.js proxy resembles a Spring Security filter or Django authentication middleware. Route Handlers resemble OAuth controller/views. The protected Server Component combines controller rendering with a server-side authorization check.

## 2026-07-28 — Phase 0 project foundation

**What was built**

A strict-TypeScript Next.js App Router foundation with Tailwind CSS, ESLint, Vitest, Zod environment validation, a landing page, a health endpoint, modular domain boundaries, locked npm dependencies, and GitHub Actions CI.

**End-to-end flow**

A browser request for `/` reaches `src/app/page.tsx`, which Next.js renders as a Server Component by default. A request for `/api/health` reaches the Route Handler, which calls the pure health service and returns its stable result as JSON. Neither route uses a database or external integration yet.

**Important code**

- `src/app/layout.tsx` defines shared page metadata and the required root HTML structure.
- `src/app/page.tsx` is the Phase 0 landing page.
- `src/app/api/health/route.ts` maps an HTTP GET request to the health service.
- `src/modules/system/health.ts` contains framework-independent health behavior.
- `src/lib/env.schema.ts` defines allowed environment shapes; `src/lib/env.ts` validates process values behind a server-only boundary.
- `vitest.config.ts`, `eslint.config.mjs`, and `tsconfig.json` define automated quality gates.
- `.github/workflows/ci.yml` repeats the local install, typecheck, lint, test, and build workflow in GitHub.

**Why this approach**

The modular monolith gives the 72-hour project one deployment and one operational boundary while preserving domain separation. Thin Route Handlers will make future authentication, webhook verification, and worker authorization easier to reason about. Integration variables are optional during this foundation phase and must become required when their consuming milestone is implemented.

**How to test**

Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Start `npm run dev`, open `http://localhost:3000`, then request `http://localhost:3000/api/health` and expect `{"service":"repopilot","status":"ok"}`.

**Failure modes**

Invalid configured URLs are rejected by Zod before an integration uses them. Type, lint, test, or build failures stop CI. The health endpoint checks only application-process availability, not future database or provider health. The current Next.js dependency tree has unresolved upstream PostCSS and Sharp advisories; an incompatible forced npm downgrade was intentionally rejected.

**Concept mapping**

An App Router Route Handler is similar to a Spring REST controller or Django view. A domain function under `src/modules` is similar to a Spring service or Django service layer. Zod schemas play the role of validated configuration/DTO objects. GitHub Actions CI is the remote equivalent of running Maven/Gradle or Django test-and-build checks before merging.

## 2026-07-28 — Phase 7 authenticated automation history

**What was built**

An authenticated dashboard that summarizes repositories, active rules, today's
events, successful actions, and actions needing attention. It shows the newest
25 events with job, rule-match, action, attempt, and safe failure information,
refreshing automatically every 15 seconds.

**End-to-end flow**

The dashboard verifies the Supabase cookie session and passes only that trusted
user id to the audit service. Drizzle filters queries by ownership. A pure
mapper creates a safe display model, React renders it, and a small Client
Component periodically requests a server refresh.

**Important code**

- `src/modules/audit/dashboard-history.ts` owns server-only database reads.
- `src/modules/audit/dashboard-view-model.ts` groups and filters rows.
- `src/components/dashboard/event-history.tsx` renders operational history.
- `src/components/dashboard/history-refresh.tsx` requests safe refreshes.

**Why this approach**

Server-side polling is safer and simpler for this assessment than exposing
database changes through browser Realtime subscriptions before tenant-scoped
channel authorization exists. Previous phases already persisted the full
operational ledger, so no migration is needed.

**How to test**

Run typecheck, lint, tests, and build. Sign in, open `/dashboard`, create a
matching issue, run the worker, and confirm the event plus actions appear within
15 seconds. Sign out and verify `/dashboard` redirects home.

**Failure modes**

A database failure fails the page instead of inventing metrics. Retryable,
permanent, and unknown outcomes are highlighted. The first version shows only
the newest 25 events and can be up to 15 seconds behind. OAuth preview testing
also requires the Vercel preview callback in Supabase's redirect allowlist. The
application selects Vercel's trusted preview origin so the PKCE verifier cookie
and authorization callback stay on the same domain.

**Concept mapping**

The Server Component plus audit service resembles a protected Spring controller
plus service/repository. The pure mapper resembles a DTO assembler.
`router.refresh()` reruns server rendering while preserving browser state.

## 2026-07-28 — Phase 8 configurable rules

**What was built**

Authenticated rule creation, editing, enabling, and disabling for opened issues
and pull requests. A rule matches one title keyword, adds one GitHub label, and
can optionally send Slack.

**End-to-end flow**

A dashboard form calls a Server Action. The action verifies the Supabase user,
parses bounded allowlisted fields with Zod, and calls the server-only management
service. The service checks repository/rule ownership, derives worker-compatible
JSON, writes it, and increments the rule version for edits/status changes.

**Important code**

- `src/modules/rules/rule-input.ts` validates forms and derives configuration.
- `src/modules/rules/management.ts` owns tenant-scoped reads and writes.
- `src/app/dashboard/rules/actions.ts` authenticates mutation requests.
- `src/components/dashboard/rule-manager.tsx` renders the forms and rule list.

**Why this approach**

Users never submit arbitrary rule JSON. The deliberately small UI meets the
assessment workflow while preventing executable templates, regex, URLs, or
unsupported actions. Disable replaces delete because the existing cascade
would erase audit history.

**How to test**

Create a rule, disable it, edit it, enable it, then open a matching issue or
pull request. Run the worker and verify the selected label and optional Slack
action. Disable the rule and confirm later events do not match it.

**Failure modes**

Invalid input is rejected with a fixed message. Cross-user repository and rule
ids produce no mutation. Changes affect only future processing; previously
accepted events are not replayed. Manual preview testing exposed duplicate
creation when the user clicked twice during a slow request. Pending buttons now
provide immediate feedback, and a database transaction serializes identical
creates so the second request is rejected safely.

**Concept mapping**

A Server Action acts like a form POST controller. Zod acts like DTO validation.
The management module is the service/repository layer, and the JSON columns are
a constrained rule DSL rather than executable code.

## 2026-07-28 — Phase 9 reliability hardening

**What was built**

Failure visibility now matches persisted worker/action states. Authenticated
owners can grant one additional attempt to an exhausted temporary failure.
Supabase Cron/Vault instructions enable unattended one-minute worker invocation.

**End-to-end flow**

The dashboard receives a safe retry flag from the server view model. A retry
form verifies the Supabase session, validates the job id, joins the job to an
event owned by that user, and allowlists the stored error code. An atomic update
requeues the failed job and raises its maximum just enough for one more claim.
Separately, Supabase Cron calls the existing protected worker every minute.

**Important code**

- `src/modules/jobs/manual-retry.ts` defines the safe retry taxonomy.
- `src/modules/jobs/recovery.ts` owns the tenant-scoped state transition.
- `src/app/dashboard/jobs/actions.ts` authenticates retry form submissions.
- `docs/SUPABASE_SCHEDULER.md` keeps production scheduling repeatable.

**Why this approach**

Resetting attempts would erase operational evidence, while retrying every
failure could repeat permanent errors or ambiguous Slack messages. One explicit
extra attempt preserves history and scope. Cron triggers existing logic rather
than creating a second processing system.

**How to test**

Run build, typecheck, lint, and tests. Verify permanent/ambiguous failures have
no retry button. Apply the Vault/Cron runbook, open a matching issue without
calling the worker manually, and confirm processing within two minutes.

**Failure modes**

A wrong Cron bearer token returns 401 and leaves jobs durable. Interrupted
workers recover stale locks after five minutes. Repeated manual retry clicks
cannot move a job that has already left `failed`. Slack `unknown_outcome` stays
review-only.

**Concept mapping**

Supabase Cron is a scheduler, not the worker. The recovery service resembles an
operator command with a guarded SQL state transition. Vault is encrypted
server-side secret storage for database-triggered HTTP calls.

## 2026-07-30 — Optional Gemini enrichment

**What was built**

A server-only Gemini client, strict structured-output validation, an idempotent
AI enrichment ledger, post-success worker orchestration, and dashboard display.

**End-to-end flow**

The worker completes deterministic rule evaluation, GitHub, Slack, and the job
state first. For a matched opened issue or pull request, it claims the unique
event/prompt row, sends bounded untrusted content to Gemini, validates the
response, and stores only a summary, priority, and allowlisted label suggestion.

**Why this approach**

AI is useful context but not a trustworthy transaction coordinator. Keeping it
after job success means timeouts, quota errors, malformed output, or missing
configuration cannot break required automation. The unique database constraint
prevents concurrent workers from spending twice.

**How to test**

Run `npm test -- --run`, `npm run typecheck`, `npm run lint`, and
`npm run build`. In preview, configure server-only Gemini variables, open a
matching issue, and verify core actions succeed even if Gemini is unavailable.

**Failure modes**

Missing configuration becomes `skipped`; timeouts/provider errors/invalid
responses become sanitized AI-only failures. A crash after the ledger claim can
leave `processing`, prioritizing no duplicate external call over automatic
recovery.

**Concept mapping**

The AI ledger is an idempotency/outbox-style integration record. Zod is the
response DTO validator. The provider client is an anti-corruption boundary that
keeps external response details out of domain code.

## 2026-07-30 — Final hardening and submission readiness

**What was built**

The final repository narrative, AI retrospective, evaluator demo checklist, and
release audit evidence were brought in line with the deployed Phases 0–10.

**Why this approach**

Release hardening should reduce uncertainty, not add late scope. The audit
focused on reproducibility, honest known limitations, deployment order,
credential hygiene, and evidence an evaluator can follow.

**How to test**

Run the full typecheck, lint, test, build, tracked-secret scan, dependency audit,
and `git diff --check`. Then follow `docs/SUBMISSION_CHECKLIST.md` against the
public deployment.

**Failure modes**

Deploying code before its migration can break server-rendered database queries.
Forced dependency “fixes” can also introduce a larger compatibility/security
regression when the suggested version is an old major release.

**Concept mapping**

This phase is comparable to a release-candidate audit: documentation is part of
the product, migrations are release artifacts, and unresolved upstream
advisories belong in a risk register rather than being hidden or “fixed”
blindly.

## 2026-07-30 — AI enrichment Slack completion

**What was built**

A separate, idempotent AI Slack follow-up after successful Gemini enrichment,
with delivery state stored on the AI ledger and shown on the dashboard.

**End-to-end flow**

The original GitHub label, deterministic Slack alert, and job success complete
first. Gemini then stores validated advisory output. If the matched rule
requested Slack, RepoPilot claims the AI notification state, sends a second
message, and records success, failure, or unknown outcome.

**Why this approach**

The assessment asks for AI output in the notification and dashboard. A separate
follow-up satisfies that stretch goal without delaying or changing the required
alert. The unique AI row is the natural idempotency boundary.

**How to test**

Run all automated checks, apply migration `0006`, deploy, open a matching issue
or pull request, and verify two Slack messages plus a succeeded AI notification
state on the dashboard.

**Failure modes**

Missing Slack configuration records a safe failure. Timeout is
`unknown_outcome` and is not resent. Any outcome leaves the already-succeeded
core job unchanged.

**Concept mapping**

This is a post-commit integration listener with its own delivery ledger, similar
to publishing an optional notification after a primary transaction completes.

## 2026-07-30 — GitHub repository-selection synchronization

**What was built**

Support for GitHub's signed `installation_repositories` maintenance webhook so
repositories added or removed after initial App installation stay synchronized.

**End-to-end flow**

The webhook route verifies the raw signature, validates the maintenance payload,
resolves the stored installation owner, and transactionally upserts additions
or deactivates removals. Existing dashboard polling then shows the new list.

**Why this approach**

Refreshing only during initial installation made GitHub access and application
state drift. The lifecycle webhook is the authoritative event and avoids asking
users to reinstall the App.

**How to test**

Add a second selected repository in GitHub, deploy the fix, redeliver the
existing `installation_repositories` delivery, and verify both repositories
appear. Remove one and verify it becomes inactive without losing history.

**Failure modes**

Unknown installations are acknowledged without writes. Cross-user external
repository conflicts fail safely. Replayed additions/removals converge on the
same state.

Production redelivery also proved that webhook repository objects can be
smaller than REST API repository objects. Validation should require only fields
guaranteed by that specific event contract, not a convenient richer fixture.

**Concept mapping**

This is a webhook-driven projection: GitHub owns repository selection, while
RepoPilot maintains a local tenant-scoped read model.

## Entry template

### <Date> — <Milestone>

**What was built**

**End-to-end flow**

Explain the request/data path from entry point to visible result.

**Important code**

List key files, classes/functions, and responsibilities.

**Why this approach**

Connect the implementation to architecture, security, reliability, or delivery constraints.

**How to test**

Include automated commands and manual steps.

**Failure modes**

Explain likely failures and how they are surfaced or recovered.

**Concept mapping**

When useful, map TypeScript/Next.js concepts to familiar Java Spring Boot or Python Django concepts.

Examples:

- Next.js Route Handler ≈ Spring REST controller / Django view.
- Service module ≈ Spring service / Django service layer.
- Drizzle schema and migration ≈ JPA entity plus migration tooling / Django model plus migration.
- Zod schema ≈ request DTO validation / serializer validation.
- Supabase Auth session ≈ authenticated principal/session.

### 2026-07-30 — Stitch-based production UI polish

**What was built**

RepoPilot's light prototype UI was replaced with a responsive dark
developer-tool interface across the landing page, dashboard overview, rule
configuration, repository access, event history, action states, and AI results.

**End-to-end flow**

The authenticated dashboard still loads tenant-scoped data on the server and
passes it into focused display components. Existing forms still submit to the
same Server Actions. Only the visual hierarchy and styles changed.

**Important code**

- `src/app/globals.css` owns reusable color, surface, focus, and motion tokens.
- `src/app/page.tsx` presents the completed product rather than stale milestones.
- `src/app/dashboard/page.tsx` provides the responsive shell and real section
  navigation.
- `src/components/dashboard/rule-manager.tsx` and `event-history.tsx` preserve
  all behavior while making dense state easier to scan.

**Why this approach**

The Stitch HTML was treated as a reference because it contained fake data and
unsupported pages. Translating its design language into existing components
avoided regressions, external assets, and unnecessary dependencies.

**How to test**

Run typecheck, lint, tests, and production build. In the preview, verify the
landing page, sign-in, dashboard anchors, rule create/edit/toggle forms,
repository access, history states, retry controls, and mobile layout.

**Failure modes**

A purely visual change can still break form names, action targets, responsive
layouts, focus visibility, or status meaning. Existing actions were preserved
and semantic success/warning/error treatments remain distinct.

**Concept mapping**

This is comparable to replacing Django templates or Spring MVC views while
keeping controller, service, and persistence behavior unchanged.

**Routed dashboard follow-up**

The long dashboard was split into `/dashboard`, `/dashboard/rules`,
`/dashboard/history`, and `/dashboard/repositories`. A shared authenticated
layout owns the shell, while each page loads only the data it displays. Server
Action redirects were updated so rule mutations, retries, and GitHub connection
callbacks return to the page where the user initiated the workflow.

**Contrast correction**

The first preview showed that inherited navigation color could remain muted on
the solid mint active state. A shared `text-on-mint` class now enforces a
near-black foreground on every solid mint button or active navigation item.
Translucent success badges keep mint text because their background remains dark.
