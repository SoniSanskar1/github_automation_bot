# AI Notes

## Tools and working approach

I used **Codex in the desktop app, from the GPT-5.6 model family**, for
architecture review, implementation drafts, tests, debugging hypotheses,
documentation, and diff review. I remained responsible for service selection,
production configuration, secrets, GitHub/Supabase/Vercel/Slack setup, accepting
trade-offs, reviewing changes, and running the live integration tests.
All external services used no-card free tiers; I did not enter a credit card or
make any payment for the project.

The work was divided into small milestones. For each phase, Codex read the
repository instructions, proposed a bounded plan, implemented on a feature
branch, ran automated checks, and documented the result. I reviewed pull
requests and personally verified the real GitHub, Slack, scheduler, dashboard,
and Gemini behavior. `AI_WORK_LOG.md` retains the detailed collaboration record.

## Decisions I made

### Modular monolith and PostgreSQL-backed jobs

I chose one Next.js application with internal modules instead of microservices,
and a transactional PostgreSQL event/job queue instead of adding a message
broker. This fit the 72-hour and free-tier constraints while preserving durable
ingestion, atomic claims, retries, and understandable deployment. The trade-off
is that this is designed for assessment-scale traffic rather than independent
service scaling.

### Separate human and bot identities

I used Supabase GitHub OAuth for the signed-in human and a GitHub App installation
token for bot actions. A single OAuth token would have been simpler, but the App
provides selected-repository access, least-privilege permissions, and short-lived
credentials. The trade-off is a more involved installation/callback flow.

### Deterministic automation before optional AI

Rules, GitHub labels, and Slack complete before Gemini is attempted. AI output
is validated, advisory, and never automatically applied. This prevents provider
latency or malformed output from breaking required automation. It also means an
AI failure is shown separately instead of failing the core job.

## Hardest AI wrong turn

The clearest AI-introduced implementation defect appeared in the configurable
rule UI. The initial implementation allowed a user to double-click **Create
rule** while the first request was processing, producing duplicate rules.
Automated unit tests had not simulated that real browser timing.

I detected it during preview testing when two identical “Phase 8 test rule”
records appeared. The first correction added pending button feedback, but UI
state alone was not a sufficient concurrency guarantee. The final correction
added server-side serialization with a transaction-scoped advisory lock and a
duplicate-name check. The UI also disables the button while submitting and
surfaces a clear duplicate message. This incident reinforced that client-side
controls improve experience, while database/server boundaries enforce
correctness.

## What I would improve with more time

My first improvements would be Playwright coverage for OAuth-adjacent dashboard
flows and rapid repeated submissions, an operator UI for dead-letter recovery,
and Slack OAuth with encrypted per-user destinations. I would also add AI prompt
evaluation fixtures and a recovery policy for AI ledger rows interrupted while
`processing`. For higher traffic, I would evaluate a managed queue only after
measuring PostgreSQL worker limits.

## Final reflection

AI accelerated repetitive implementation, test generation, documentation, and
cross-file review. It was most effective when its output was treated as a draft
and checked against database constraints, official service behavior, automated
tests, and live production evidence. Human judgment mattered most for security
boundaries, deployment order, reliability trade-offs, and deciding when the
system was genuinely complete.
