# AI Notes

## Tools and working approach

I used **Codex in the desktop app with the GPT-5.6 model family**. It helped me
review the architecture, draft implementation changes, write tests, investigate
bugs, and review documentation and diffs.

I made the final decisions and configured GitHub, Supabase, Vercel, Slack, and
Gemini myself. I also reviewed each pull request and tested the complete flow in
production instead of relying only on generated tests. I used a separate branch
for each feature and merged it only after the checks and preview deployment
passed. Every service was on a no-card free tier; I did not enter payment
details or spend money on the project. The detailed history is preserved in
`AI_WORK_LOG.md`.

## Decisions I made

### Modular monolith and PostgreSQL-backed jobs

I chose one Next.js application with internal modules instead of microservices.
I also used PostgreSQL as the durable event and job queue instead of adding a
message broker. This kept deployment understandable and free while still
providing transactions, atomic job claims, and retries. It is a good fit for the
assessment workload, although a much larger system might eventually need
independently scalable workers or a managed queue.

### Separate human and bot identities

I used Supabase GitHub OAuth for user sign-in and GitHub App installation tokens
for bot actions. Using one OAuth token would have been simpler, but the GitHub
App gives selected-repository access, narrower permissions, and short-lived
credentials. The trade-off was a more complicated installation and callback
flow.

### Deterministic automation before optional AI

I made deterministic rules, GitHub labels, and Slack the core workflow. Gemini
runs only after those actions succeed, and its output is validated and treated
as advice. A Gemini timeout or malformed response therefore cannot turn a
successful automation into a failed one.

## Hardest AI wrong turn

The hardest AI-introduced bug was in the rule form. The first version allowed me
to click **Create rule** twice while the request was still running, which
created two identical rules. The unit tests had not reproduced that browser
timing.

I found it while testing the preview deployment, where two copies of my
“Phase 8 test rule” appeared. Disabling the button fixed the visible behavior
but was not enough to guarantee correctness. I added a server-side
transaction-scoped advisory lock and checked for an existing rule name inside
the transaction. The UI still disables the button and shows a clear duplicate
message, but the database boundary is what now prevents the race.

## What I would improve with more time

With more time, I would add Playwright tests for the dashboard and rapid repeated
submissions, an operator screen for failed-job recovery, and Slack OAuth with an
encrypted destination per user. I would also add repeatable prompt-evaluation
fixtures and recovery for AI work interrupted in the `processing` state. I
would consider a managed queue only after measuring the limits of the current
PostgreSQL worker.

## Final reflection

AI saved time on repetitive implementation, test generation, and cross-file
review, but I treated its output as a draft. The most useful checks were
database constraints, automated tests, preview deployments, and real GitHub and
Slack behavior. The project improved whenever I tested assumptions instead of
accepting them because the generated code looked correct.
