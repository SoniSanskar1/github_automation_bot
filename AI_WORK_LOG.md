# AI Work Log

Maintain this during implementation. Keep entries concise but specific. This file is evidence for the final `AI_NOTES.md`.

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

Yes for the Phase 0 collaboration and dependency-risk handling. No for the final “hardest AI wrong turn” because no genuine AI-introduced implementation bug has occurred.
