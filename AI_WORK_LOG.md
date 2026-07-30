# AI Work Log

Maintain this during implementation. Keep entries concise but specific. This file is evidence for the final `AI_NOTES.md`.

## 2026-07-28 — Phase 6 Slack notifications

**Human objective**

Send a Slack alert for the same matched issue that receives a GitHub label.

**AI contribution**

Codex added a safe Slack message builder, Incoming Webhook client, independent
Slack action execution, retry/permanent/unknown-outcome classification, a
version-2 demo rule data migration, tests, and documentation.

**Human decisions and review**

The developer created a Slack app and channel-specific incoming webhook, then
configured the secret URL locally and in Vercel.

**Verification evidence**

- The rule data migration applied successfully.
- Typecheck, ESLint, and 16 test files/42 tests passed before final build.
- The local webhook URL was validated without printing it.
- Production Slack delivery remains after merge.

**Problem, incorrect suggestion, or risk found**

TypeScript initially inferred the mixed GitHub/Slack action array as label-only.

**Correction**

The planner now returns an explicit discriminated union, keeping required fields
for each action type and making exhaustiveness visible to the compiler.

**Learning**

Incoming webhooks do not provide a message ID for reconciliation. Definite 429
and 5xx responses can retry, but a network timeout may have succeeded, so the
safer state is `unknown_outcome` requiring review.

**AI_NOTES candidate**

Yes for honest Slack delivery semantics and independent action-ledger behavior.

---

## 2026-07-28 — Phase 5 idempotent GitHub label actions

**Human objective**

Make matching automation rules perform a real GitHub label action exactly once
from the application's perspective.

**AI contribution**

Codex added the action-execution ledger, deterministic keys, short-lived GitHub
App installation authentication, repeat-safe label execution, GitHub failure
classification, worker integration, tests, migration, and documentation.

**Human decisions and review**

The developer approved proceeding after Phase 4 production verification. The
existing GitHub App permissions and private key are reused; no additional secret
or broad permission was introduced.

**Verification evidence**

- The action-ledger migration applied successfully.
- Typecheck, ESLint, 15 test files/40 tests, and production build passed.
- A read-only real integration check authenticated as the GitHub App installation
  and confirmed the demo `bug` label exists.
- The matching production issue test remains after merge/deployment.

**Problem, incorrect suggestion, or risk found**

The first classifier test imported a `server-only` GitHub client, so the test
environment correctly refused the import.

**Correction**

The pure failure classifier was separated from the credential-bearing client.
Tests now cover classification without weakening the server-only boundary.

**Learning**

A database uniqueness key cannot create a cross-service transaction with GitHub.
The practical design combines a pre-call ledger, deterministic keys, a naturally
idempotent label operation, and explicit retry/permanent failure states.

**AI_NOTES candidate**

Yes for explaining honest cross-service idempotency and the server-only boundary.

---

## 2026-07-28 — Phase 4 job worker and rule engine

**Human objective**

Process the durable Phase 3 queue with deterministic automation rules.

**AI contribution**

Codex added versioned automation rules, rule-evaluation history, a seeded demo
rule, atomic `SKIP LOCKED` job claiming, stale-lock recovery, deterministic rule
evaluation, bounded retry handling, an authenticated internal route, tests,
migration, and documentation.

**Human decisions and review**

The developer approved continuing after successful Phase 3 production evidence
and configured a separate internal worker secret locally and in Vercel. The
production worker test remains until this branch is merged and deployed.

**Verification evidence**

- The migration applied successfully and created one demo rule.
- Before processing, the database had one pending job and zero evaluations.
- Typecheck, ESLint, 13 test files/36 tests, and production build passed.
- The build emitted `/api/internal/jobs/process`.

**Problem, incorrect suggestion, or risk found**

No implementation defect was found in the final checks. The main design risk was
accidentally coupling Phase 4 to external GitHub or Slack calls, which would make
job completion and retry behavior harder to reason about.

**Correction**

Phase 4 stops after recording validated rule decisions. External actions are
explicitly deferred to idempotent action ledgers in later phases.

**Learning**

`SKIP LOCKED` is a database concurrency tool: each worker atomically reserves
different rows instead of using an unsafe read-then-update sequence. Rule
versions make repeated evaluation auditable and duplicate-safe.

**AI_NOTES candidate**

Yes for explaining durable claiming, retry state, and the deliberate separation
between deciding an action and executing it.

---

## 2026-07-28 — Phase 3 webhook ingestion

**Human objective**

Proceed from connected repositories to secure GitHub event ingestion.

**AI contribution**

Codex added webhook-event and processing-job tables, RLS policies, raw-body
HMAC verification, payload/header validation, repository ownership resolution,
transactional duplicate-safe persistence, safe logs, route tests, and Phase 3
documentation.

**Human decisions and review**

The developer approved continuing with the documented modular-monolith and
durable-inbox architecture. The developer still needs to create one webhook
secret, configure it in Vercel and GitHub, and perform the real production
delivery test after merge.

**Verification evidence**

- The Phase 3 migration applied successfully to Supabase.
- Typecheck and ESLint passed.
- Vitest passed 9 files and 26 tests before final documentation review.
- Production build and live webhook delivery remain to be verified.

**Problem, incorrect suggestion, or risk found**

The first route test used a normal variable inside a hoisted Vitest mock, causing
the suite to fail before running tests. The earlier migration incident also made
ordinary migration output an unacceptable secret-exposure risk.

**Correction**

The test mock now uses `vi.hoisted`. Migration output was captured and scrubbed
for connection URLs before being displayed; the migration then completed
successfully without exposing credentials.

**Learning**

A webhook endpoint is a security boundary and a durable inbox, not the worker.
It verifies exact request bytes, creates the event and job atomically, then
acknowledges GitHub without waiting for slow external actions.

**AI_NOTES candidate**

Yes for the security ordering, transactional design, and redacted migration
workflow. The Vitest issue is useful implementation evidence but not a major
architectural failure.

---

## 2026-07-28 — Phase 2 GitHub App installation

**Human objective**

Connect the configured GitHub App and Supabase database so signed-in users can
install RepoPilot on selected repositories and see those repositories.

**AI contribution**

Codex added Drizzle schema and migrations, RLS policies, GitHub App environment
validation, cryptographic installation state, transient OAuth token exchange,
GitHub ownership verification, transactional repository synchronization, and
the repository dashboard.

**Human decisions and review**

The developer created the GitHub App, chose Supabase PostgreSQL, configured the
GitHub App and database environment variables, rotated the database password
after exposure, and confirmed the migration prerequisites.

**Verification evidence**

- The migration applied successfully to Supabase.
- Typecheck and ESLint passed.
- Vitest passed 5 files and 14 tests.
- The production build passed and emitted both GitHub installation routes.
- The production callback remains to be tested after merge and deployment.

**Problem, incorrect suggestion, or risk found**

The first migration failure printed the complete database connection URL,
including its password, in tool output. Review also found that an early callback
implementation would synchronize every installation visible to the GitHub user
instead of only the installation returned by the current flow.

**Correction**

The developer immediately rotated the database password and replaced both local
and Vercel connection URLs. The callback was tightened to require the returned
installation ID and verify it against GitHub before saving only that installation.
Future diagnostic output must never print full secret-bearing connection URLs.
Official documentation review then corrected the flow to use GitHub's separate
setup callback for the installation ID before starting user OAuth; OAuth-during-
installation does not document that ID in its callback.

**Learning**

Authentication identifies a person, while a GitHub App installation grants a
bot access to repositories. A callback parameter alone is not proof of ownership;
the app verifies it with a transient GitHub user token and then discards the token.

**AI_NOTES candidate**

Yes. The credential exposure is a real AI/tool-assisted security incident with
a concrete correction, and the installation-scope review shows a meaningful
authorization improvement.

---

## 2026-07-28 — Phase 1 GitHub authentication

**Human objective**

Implement GitHub sign-in and a protected dashboard using the configured Supabase project and GitHub OAuth App.

**AI contribution**

Codex designed and implemented the Supabase SSR clients, OAuth routes, PKCE callback, cookie refresh proxy, protected dashboard, sign-out, safe redirect validation, tests, plan, and documentation.

**Human decisions and review**

The developer selected and configured Supabase, GitHub OAuth, redirect allowlists, Vercel, and the production URL. The developer must still review the diff and perform the real GitHub consent flow locally and after deployment.

**Verification evidence**

- Typecheck and lint passed.
- Vitest passed 3 files and 10 tests.
- Production build passed.
- Landing page returned 200 locally.
- Signed-out dashboard returned a redirect to the authentication-required state.
- Sign-in returned 303 to the configured Supabase host and set a PKCE cookie.
- The developer completed GitHub OAuth, reached the protected dashboard, signed out, confirmed direct dashboard access was blocked, and signed in again.

**Problem, incorrect suggestion, or risk found**

The first patch encountered existing mojibake in the landing page and was safely split before auth code was applied. Review also found the initial proxy matcher unnecessarily coupled the public health/landing routes to Supabase availability. The first real OAuth attempt returned its code to the production root because the localhost callback was not accepted by the Supabase redirect allowlist.

**Correction**

The landing page was replaced with clean UTF-8 content, the proxy matcher was narrowed to `/auth/**` and `/dashboard/**`, and trusted local/production callback patterns were added to the Supabase redirect allowlist.

**AI_NOTES candidate**

Yes. The proxy availability coupling is a concrete AI-introduced design risk found during review and corrected before commit.

---

## Entry template

### YYYY-MM-DD HH:MM — <Task name>

**Human objective**

What outcome did I ask for?

**Prompt summary**

Summarize the instruction given to the AI. Do not paste an entire long conversation unless a small excerpt is genuinely useful.

**AI contribution**

What did Codex propose, generate, edit, test, or review?

**Human decisions and review**

What did I independently choose, reject, change, or verify?

**Verification evidence**

- Commands/tests run:
- Manual flow tested:
- Relevant commit/diff:
- External evidence:

**Problem, incorrect suggestion, or risk found**

State `None observed` when genuinely none was found. Do not invent one.

**Correction**

What changed, and who made/approved the correction?

**Learning**

What do I now understand well enough to explain?

**AI_NOTES candidate**

`Yes` or `No`, with one sentence explaining why.

---

## Initial entry

### Project start — Architecture and context

**Human objective**

Define a deliverable architecture and a disciplined Codex workflow for the 72-hour GitHub automation assessment.

**Prompt summary**

Select a free, practical stack; prioritize end-to-end delivery, security, idempotency, durable processing, learning, and honest AI documentation.

**AI contribution**

AI helped compare stack options, structure the modular-monolith architecture, outline the event/outbox flow, and draft repository context files.

**Human decisions and review**

The candidate must review and explicitly accept or change every decision before implementation. The current proposed decisions are recorded in `docs/DECISIONS.md`.

**Verification evidence**

No application code or live integration has been verified yet.

**Problem, incorrect suggestion, or risk found**

None observed yet. This entry must not be used as the final hardest-bug story.

**Correction**

Not applicable.

**Learning**

Context and instruction files are useful only when they remain synchronized with real implementation and test evidence.

**AI_NOTES candidate**

Yes, for explaining the initial division of work and planning approach; no, for the hardest-bug section.

---

### 2026-07-28 11:01 +05:30 — Phase 0 project foundation

**Human objective**

Create only the Next.js project foundation and CI baseline on `chore/project-foundation`, preserve the context pack, teach the architecture and workflow, and stop before commit or push.

**Prompt summary**

Assess Git safety and tool versions first; follow the approved modular-monolith architecture; add strict TypeScript, App Router, Tailwind, Zod environment validation, Vitest, health and landing routes, module boundaries, CI, README, and truthful evidence.

**AI contribution**

Codex read the required project documents, confirmed a clean `main`, created the requested feature branch, wrote the execution plan, generated an official Next.js reference outside the repository, and manually created the reviewed foundation files. Codex implemented the placeholder UI, health service/route, environment schema, tests, CI workflow, module boundaries, and setup documentation.

**Human decisions and review**

The human supplied and accepted the architecture, Phase 0 scope, branch name, and working rules in the task prompt. The human still needs to review the complete diff, accept or amend the implementation and proposed GitHub artifacts, perform any desired browser-level visual review, and decide when to commit, push, deploy, or configure external services.

**Verification evidence**

- Commands/tests run: `npm run typecheck` passed; `npm run lint` passed with zero warnings; `npm test` passed 2 files and 3 tests; `npm run build` passed.
- Manual flow tested: Next.js development server started on `127.0.0.1:3100`; `/` returned HTTP 200 and included RepoPilot content; `/api/health` returned `{"service":"repopilot","status":"ok"}`.
- Relevant commit/diff: uncommitted changes on `chore/project-foundation`; complete diff reviewed before handoff.
- External evidence: no deployment or external integration was attempted.

**Problem, incorrect suggestion, or risk found**

The official Next.js 16.2.12 dependency tree produced 12 high-severity npm advisories, including 3 in production dependencies through bundled PostCSS and Sharp. npm’s forced fix proposed an incompatible downgrade to Next.js 9.3.3. A PowerShell `Invoke-WebRequest` landing-page check also failed locally with a null-reference error even though the server was healthy. Final review found the initial broad Node engine range would allow odd Node releases unsupported by Vitest 4.

**Correction**

Codex did not apply the unsafe forced downgrade and recorded the unresolved upstream dependency risk for review and future upgrade. The manual landing-page verification was repeated successfully with `curl.exe`; no application change was necessary. The package engine and README were narrowed to supported Node 20, 22, and 24+ release lines.

**Learning**

The project now demonstrates how App Router pages and Route Handlers share one deployment, why business behavior belongs outside routes, how server-only environment access protects secrets, and how local validation maps directly to CI.

**AI_NOTES candidate**

Yes for the Phase 0 collaboration and dependency-risk handling. No for the final
hardest AI wrong turn because no genuine AI-introduced implementation bug had
occurred.

---

### 2026-07-28 17:38 +05:30 — Phase 7 authenticated automation history

**Human objective**

Proceed after production verification of the GitHub-label and Slack flow and
implement the next project phase.

**Prompt summary**

Continue the roadmap using the established production branch/PR workflow and
explain the implementation as a real project.

**AI contribution**

Codex inspected the required architecture, security, roadmap, schema, dashboard,
and prior plan. It created `feature/automation-history-dashboard`, documented
the plan, implemented tenant-scoped metrics and history queries, added a
defense-in-depth view-model mapper, built status/failure UI, and selected a
15-second authenticated polling fallback.

**Human decisions and review**

The human authorized Phase 7. The human still needs to review the dashboard
visually and approve the branch through the pull-request process.

**Verification evidence**

Typecheck and lint passed. After the preview-auth correction, Vitest passed 18
files and 48 tests, including the tenant-isolation and preview-origin tests. The
optimized Next.js production build passed and confirmed `/dashboard` is
dynamically server-rendered. Production visual verification remains for after
deployment.

**Problem, incorrect suggestion, or risk found**

The first draft placed the pure assembler in a module marked `server-only`,
which made isolated unit testing depend on a Next.js runtime boundary.

**Correction**

Codex separated the pure assembler into `dashboard-view-model.ts`, while
keeping database access server-only. This preserves both testability and the
client/server security boundary. During manual preview testing, the human's
screenshot then revealed `callback_failed` on the production domain. Codex
traced this to both auth routes always using `NEXT_PUBLIC_APP_URL`; it added a
tested origin selector that permits Vercel's trusted preview hostname only in
the preview environment while retaining the canonical production origin. A
parallel build/typecheck verification attempt briefly raced over Next.js's
generated `.next` files; Codex reran the normal CI sequence serially, where all
checks passed.

**Learning**

Every query must be scoped by the authenticated user; hiding rows in React is
not authorization. A safe view model also keeps raw payload and ledger internals
out of the browser. OAuth PKCE cookies are origin-bound, so starting on preview
and completing the callback on production cannot establish a session.

**AI_NOTES candidate**

Yes, as evidence of a small AI design correction and the
polling-versus-Realtime trade-off. It is not the hardest wrong turn.

---

### 2026-07-28 18:02 +05:30 — Phase 8 configurable rules

**Human objective**

Proceed to the next phase after verifying the automation-history dashboard in
production.

**Prompt summary**

Continue the roadmap with production-style implementation and beginner-friendly
explanations.

**AI contribution**

Codex inspected the worker's exact rule schemas, ownership columns, dashboard,
foreign keys, and roadmap. It created the Phase 8 branch and plan, implemented
strict form normalization, tenant-scoped rule reads/writes, authenticated Server
Actions, versioned mutations, and dashboard create/edit/toggle forms.

**Human decisions and review**

The human authorized proceeding. The human still needs to review the pull
request and manually verify rule behavior in the preview deployment.

**Verification evidence**

The optimized production build, typecheck, and zero-warning lint passed.
After the double-submit fix, Vitest passed 19 files and 52 tests, including four
rule-input/configuration/identity tests. Diff review confirmed no migration,
environment file, secret, delete action, or unscoped rule update was added.

**Problem, incorrect suggestion, or risk found**

Codex initially described delete as part of the possible UI scope. Schema
inspection showed that deleting a rule would cascade into rule evaluations and
action executions, erasing audit history. Later, the human's preview test found
that clicking Create twice while the first request had no visible pending state
inserted two identical rules. The initial implementation had neither UI
double-submit protection nor server-side create idempotency.

**Correction**

Codex removed deletion from the implementation and documented enable/disable as
the safe lifecycle control. No destructive database action was added. For the
duplicate bug, Codex added pending/disabled mutation buttons plus a
transaction-scoped PostgreSQL advisory lock and case-insensitive duplicate
check, so correctness does not rely only on browser behavior.

**Learning**

A rule form should construct a constrained DSL on the server rather than accept
arbitrary JSON from the browser. Versioning connects future event evaluations
to the configuration that produced them. Disabling a button improves feedback,
but only server-side serialization protects against concurrent duplicate
requests.

**AI_NOTES candidate**

Yes. The double-submit defect is a real AI implementation gap discovered by the
human during preview testing, then corrected at both the UI and database
boundaries. It is a strong candidate for the final hardest-wrong-turn section.

---

### 2026-07-28 18:29 +05:30 — Phase 9 reliability hardening

**Human objective**

Proceed after merging configurable rules and their duplicate-submit correction.

**Prompt summary**

Implement the next roadmap step: unattended processing, failure recovery,
security hardening, and demo readiness.

**AI contribution**

Codex audited the worker claim SQL, retry policy, executors, dashboard query,
status styling, RLS policies, environment validation, and Supabase's current
official Cron/Vault guidance. It reused existing stale-lock recovery, added a
strict manual retry taxonomy and tenant-scoped transition, corrected failure
visibility, built retry UI, and wrote a secret-safe scheduler runbook.

**Human decisions and review**

The human authorized Phase 9. The human must review the pull request, apply the
Vault/Cron production setup without sharing the secret, and verify unattended
processing.

**Verification evidence**

The optimized production build, typecheck, and zero-warning lint passed.
Vitest passed 20 files and 66 tests, including 16 focused manual-retry/dashboard
tests. Diff review confirmed no migration, real secret, permanent/ambiguous
retry path, or ownership-free mutation was added.

**Problem, incorrect suggestion, or risk found**

The audit found that the dashboard counted `retryable_failed` and
`permanently_failed`, but executors actually persist `retrying` and `failed`.
The initial recovery implementation also passed a nullable error code into a
Drizzle equality predicate, which strict TypeScript rejected.

**Correction**

Codex aligned the dashboard taxonomy with persisted states and made the null
rejection explicit before building the atomic retry predicate. It did not add
duplicate stale-recovery logic because the existing claim query already safely
recovers five-minute locks.

**Learning**

Observability labels must be verified against actual stored states. Manual
recovery should be narrower than automatic retry and should preserve attempt
history rather than resetting counters.

**AI_NOTES candidate**

Yes for the status-taxonomy audit and safe-recovery reasoning. The human-found
double-submit remains the stronger hardest-wrong-turn candidate.

---

### 2026-07-30 — Phase 10 optional Gemini enrichment

**Human objective**

Proceed after production verification of the unattended scheduled worker.

**Prompt summary**

Add the planned Gemini enrichment while preserving the reliability and security
of the existing event-driven automation.

**AI contribution**

Codex designed Gemini as a post-success advisory integration, researched the
official REST structured-output contract, added the AI ledger migration,
bounded prompt preparation, strict Zod validation, an eight-second timeout,
sanitized failures, dashboard presentation, tests, and architecture records.

**Human decisions and review**

The human authorized the next phase. The human must create the Gemini API key
privately, configure preview/production variables, review the pull request, and
verify one matching production event.

**Problem, incorrect suggestion, or risk found**

Enriching every accepted webhook would spend money on secondary events such as
`issues.labeled`, and placing AI inside the worker's core try/catch could turn a
successfully completed automation into a failed job.

**Correction**

AI now runs only for matched `opened` issue/pull-request events and only after
the job success transaction. A separate catch boundary prevents AI failures
from invoking core job failure handling.

**Learning**

Optional intelligence belongs outside the deterministic success boundary.
Idempotency must cover external cost as well as database writes.

**AI_NOTES candidate**

Yes. The post-success boundary and avoidance of duplicate AI spend are material
architecture decisions.

---

### 2026-07-30 — Phase 11 final hardening

**Human objective**

Perform the final project hardening and submission-readiness phase.

**Prompt summary**

Create the Phase 11 branch, audit the completed repository, correct final
documentation, prepare evaluator evidence, and verify the release.

**AI contribution**

Codex fetched the actual merged production main, audited tracked credential
patterns, dependency advisories, required documents, stale milestone claims,
and the AI-notes template. It drafted the final retrospective, deployment/demo
checklist, accurate README, and release plan.

**Human decisions and review**

The human authorized Phase 11 after personally verifying the complete production
GitHub, Slack, dashboard, scheduler, and Gemini flow. The human must review the
final narrative and confirm the model label and GitHub App permissions shown in
their service UIs before submission.

**Verification evidence**

The initial tracked-file scan found no high-confidence key, webhook, or private
key patterns. `npm view next version` confirmed `16.2.12` is the latest
available release. `npm audit` reported three high transitive advisories and
offered only a forced breaking downgrade to Next 9, which was rejected.

**Problem, incorrect suggestion, or risk found**

The merged README still described completed worker, label, scheduler, and
Gemini behavior as future phases. `AI_NOTES.md` still contained submission
placeholders. Production also demonstrated that deploying query code before its
migration causes the dashboard to fail.

**Correction**

The final docs now reflect deployed behavior, explicitly require
migration-before-code ordering, disclose the dependency risk, and use the real
double-submit defect as the hardest AI wrong turn.

**Learning**

A successful live system is not submission-ready until its repository evidence
is accurate, reproducible, honest about known risk, and free of placeholders.

**AI_NOTES candidate**

This entry supports the final release narrative; the Phase 8 double-submit
incident remains the selected real AI wrong turn.

---

### 2026-07-30 — Assessment gap closure

**Human objective**

Review every assessment line, record the exact GPT-5.6/free-tier facts, test
remaining production evidence, and implement literal stretch-goal gaps.

**Prompt summary**

Complete AI output in notifications while preserving the production reliability
boundary, then prepare multi-repository and pull-request verification.

**AI contribution**

Codex extracted and visually reviewed the four-page assessment PDF, mapped each
requirement to code/live evidence, identified the dashboard-only AI gap, and
implemented a separate AI Slack follow-up with persistent status and safe
failure handling.

**Human decisions and review**

The human confirmed Codex used the GPT-5.6 family and that all services were
no-card free tiers with no payment. The human authorized closing the remaining
stretch gap.

**Verification evidence**

Before the final full suite, focused typecheck and 73 tests passed. Production
verification remains required after migration/deployment, along with a second
repository and real pull-request event.

**Problem, incorrect suggestion, or risk found**

The initial Gemini phase intentionally showed enrichment only on the dashboard,
but the original PDF literally requested it in both the notification and
dashboard. Reordering Gemini before core Slack would have delayed the required
notification.

**Correction**

The deterministic alert remains first. A successful enrichment now claims a
separate notification state and sends an advisory follow-up. Ambiguous delivery
is visible and terminal.

**Learning**

Final compliance must use the original source wording. A sensible scope decision
can still be a literal stretch-goal gap and should be either disclosed or closed
without weakening core guarantees.

**AI_NOTES candidate**

Yes as evidence of requirement auditing; the Phase 8 duplicate-rule incident
remains the hardest AI wrong turn.

---

### 2026-07-30 — Multi-repository lifecycle correction

**Human objective**

Verify multiple repositories after granting RepoPilot access to a second test
repository.

**Prompt summary**

Diagnose why GitHub showed two selected repositories while the RepoPilot
dashboard showed only the initial repository, then implement the durable fix.

**AI contribution**

Codex traced initial installation synchronization and webhook allowlisting,
identified the ignored `installation_repositories` lifecycle event, and added a
signed, validated, tenant-derived synchronization path with tests.

**Human decisions and review**

The human configured a second repository and supplied the production evidence
that exposed the state drift. Reinstalling the App was rejected in favor of
correct lifecycle support.

**Verification evidence**

Focused typecheck and 75 tests passed before the final suite. Production
redelivery remains the human verification step after merge/deployment.

**Problem, incorrect suggestion, or risk found**

RepoPilot claimed multi-repository support but only synchronized during initial
installation. Later access changes were acknowledged as unsupported, leaving
GitHub and the database inconsistent.

**Correction**

Added repositories are idempotently upserted/reactivated and removed
repositories are deactivated inside one transaction, with ownership derived
from the stored installation.

**Learning**

Supporting multiple entities includes lifecycle synchronization, not just an
array-shaped initial import.

**AI_NOTES candidate**

Yes as an honest late integration gap; the Phase 8 duplicate-rule incident
remains the hardest AI wrong turn.

**Production correction**

The first redelivery returned `400 invalid_payload`. Codex had modeled
`repositories_added` using a full REST repository fixture that required
`owner` and `default_branch`, but GitHub's real maintenance webhook used a
reduced repository object. The schema and regression fixture were corrected to
the real event boundary, while the service derives/preserves missing metadata.
