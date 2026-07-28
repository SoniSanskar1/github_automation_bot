# Learning Log

Codex should append one concise section after each meaningful milestone.

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
