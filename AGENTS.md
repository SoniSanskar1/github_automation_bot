# AGENTS.md

## Project mission

Build and deploy a reliable, secure, event-driven GitHub automation product within a 72-hour assessment window.

The product must let a user:

1. Sign in using GitHub.
2. Install/connect the GitHub App to one or more repositories.
3. Receive GitHub webhook events.
4. Match events against configurable rules.
5. Perform at least one write-back action on GitHub.
6. send a Slack notification.
7. View live event and action history behind authentication.
8. Understand failures, retries, and duplicate-delivery handling.

The deployed end-to-end workflow is more important than adding many incomplete features.

## Read these files before implementation

For every new session, read:

1. `docs/ASSESSMENT_BRIEF.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/ARCHITECTURE.md`
4. `docs/SECURITY_AND_RELIABILITY.md`
5. `docs/IMPLEMENTATION_ROADMAP.md`
6. `docs/DECISIONS.md`
7. `docs/AI_COLLABORATION_GUIDE.md`

For a complex feature or significant refactor, also read `.agent/PLANS.md` and create or update an execution plan under `docs/plans/`.

## Delivery priorities

Use this priority order:

1. Working public deployment.
2. Valid GitHub authentication and repository installation.
3. Correct webhook signature verification.
4. Durable event recording.
5. Duplicate-delivery protection.
6. Reliable processing and retry visibility.
7. GitHub write-back.
8. Slack notification.
9. Authenticated live dashboard.
10. Configurable rules.
11. AI enrichment.
12. Additional polish.

Never sacrifice a working core flow to implement a stretch goal.

## Approved architecture

Use a modular monolith.

- Next.js App Router
- React
- TypeScript with strict mode
- Tailwind CSS
- shadcn/ui where useful
- Supabase Auth with GitHub OAuth for user sign-in
- GitHub App for repository installation and bot actions
- Supabase PostgreSQL
- Drizzle ORM and migrations
- Supabase Realtime for dashboard updates
- GitHub Octokit
- Zod for input and environment validation
- Pino-compatible structured logging
- PostgreSQL-backed job/outbox processing
- Supabase scheduled HTTP invocation for retry processing
- Slack Incoming Webhook initially
- Gemini only after all core requirements work
- Vitest for unit/integration tests
- Playwright for critical browser flows
- Vercel for the Next.js deployment

Do not introduce microservices, Kafka, RabbitMQ, Redis, Kubernetes, Docker-only deployment, or a separate backend unless a documented blocker proves the approved architecture cannot satisfy a requirement.

## Module boundaries

Keep business logic out of route handlers and React components.

Expected modules:

- `src/modules/auth`
- `src/modules/github`
- `src/modules/webhooks`
- `src/modules/events`
- `src/modules/rules`
- `src/modules/jobs`
- `src/modules/actions`
- `src/modules/slack`
- `src/modules/ai`
- `src/modules/audit`
- `src/lib`
- `src/db`

Route handlers should:

1. Authenticate or verify the caller.
2. Validate input.
3. Call a service/use case.
4. Map the result to an HTTP response.

## Learning and explanation requirement

The developer is learning while building. Do not only produce code.

Before changing code:

- State the objective.
- Explain the relevant request/data flow.
- List the files expected to change.
- Identify security or reliability concerns.
- State assumptions instead of silently inventing behavior.

After changing code:

- Explain each changed file.
- Explain important functions and control flow in normal English.
- Explain why the approach was selected.
- Show how to test it manually.
- List automated checks run and their results.
- Identify remaining risks or follow-up work.
- Add a short learning note to `docs/LEARNING_LOG.md`.

Do not explain every syntax token. Focus on architecture, framework behavior, data flow, failure modes, and non-obvious implementation choices.

## AI evidence requirement

The assessment requires honest disclosure of AI collaboration.

For every meaningful Codex task, append an entry to `AI_WORK_LOG.md` containing:

- Date/time
- Human objective
- Prompt summary
- What AI proposed or changed
- What the human reviewed or decided
- Tests/evidence used to verify it
- Incorrect suggestion, bug, or risk discovered
- Correction made
- Whether this is a candidate for final `AI_NOTES.md`

Never fabricate a bug, decision, test result, or human contribution.

Do not finalize the "hardest AI wrong turn" section of `AI_NOTES.md` until a real incident has occurred and been documented.

## Security rules

- Never print, commit, expose, or return secrets.
- Never place private keys, OAuth secrets, webhook secrets, Slack URLs, service-role keys, or AI keys in client-side code.
- Validate required environment variables at startup/server use.
- Verify GitHub webhooks using the unmodified raw request body and `X-Hub-Signature-256`.
- Use constant-time signature comparison.
- Treat `X-GitHub-Delivery` as the delivery idempotency key and enforce a database uniqueness constraint.
- Allowlist supported GitHub event types and actions.
- Confirm that an installation/repository belongs to the authenticated user before exposing or mutating its data.
- Use least-privilege GitHub App permissions.
- Do not log authorization headers, cookies, raw secrets, or complete sensitive payloads.
- Dashboard data queries must be scoped to the authenticated user.
- Internal worker endpoints must require a server-held secret.
- Use parameterized database queries through Drizzle.
- Validate all external payloads with Zod or explicit type guards.

## Reliability rules

- Persist an accepted webhook event and its processing job in one database transaction.
- Return quickly after durable ingestion; do not block the webhook response on GitHub, Slack, or AI calls.
- Every external action must have a deterministic idempotency key and a unique database constraint.
- Use explicit states such as `pending`, `processing`, `succeeded`, `retryable_failed`, `permanently_failed`, and `unknown_outcome`.
- Use bounded exponential backoff.
- Store attempt count, next-attempt time, last error category, and sanitized error message.
- Make failures and retries visible in the dashboard.
- AI enrichment must never block deterministic rules or required notifications.
- Prefer inherently idempotent GitHub actions such as adding an existing label.
- For posted comments, include a hidden deterministic marker and check for it before retrying.
- Never silently swallow an exception.

## Coding conventions

- TypeScript strict mode must remain enabled.
- Avoid `any`; justify unavoidable uses in comments.
- Prefer small pure functions for rule matching and action planning.
- Use discriminated unions for GitHub event variants and action results.
- Use UTC in persisted timestamps.
- Keep UI components separate from server-only modules.
- Mark server-only modules appropriately and never import them into client components.
- Use descriptive names; avoid generic `data`, `item`, or `handler` when a domain name is available.
- Comments should explain why, not repeat what the code says.
- Add or update tests with every business-rule, security, retry, or idempotency change.

## Database change rules

- Every schema change must be represented by a migration.
- Add foreign keys and indexes deliberately.
- Add unique constraints for business idempotency.
- Do not edit an already-applied migration; create a new migration.
- Explain ownership and deletion behavior for every new table.
- Do not store GitHub App private keys or Slack URLs in ordinary user-readable tables without encryption. Prefer environment-level configuration for the assessment unless per-user Slack configuration is explicitly implemented securely.

## Testing requirements

Minimum automated coverage:

- Valid webhook signature.
- Invalid webhook signature.
- Duplicate delivery.
- Unsupported event.
- Rule match and non-match.
- Idempotent GitHub action planning.
- Retryable downstream failure.
- Permanent downstream failure.
- User data isolation.
- Worker authorization.

Before declaring a task complete, run the relevant commands defined in `package.json`, normally:

- type check
- lint
- unit/integration tests
- production build

Do not claim success when a command was not run. State any environment limitation precisely.

## Git and change management

- Keep commits small and meaningful.
- Use conventional, descriptive commit messages.
- Do not combine unrelated refactors with feature work.
- Never rewrite or delete the user's work without explaining why.
- Review the complete diff before declaring completion.
- Keep `README.md`, `.env.example`, architecture docs, and AI documentation synchronized with implementation.
- Do not commit real `.env` files, keys, credentials, generated build output, or local database files.

## Definition of done

A feature is done only when:

1. Acceptance behavior is implemented.
2. Security and failure paths were considered.
3. Relevant automated tests pass.
4. Manual verification steps are documented.
5. Logs do not expose secrets.
6. Documentation is updated.
7. `AI_WORK_LOG.md` records the collaboration.
8. The developer receives a concise code walkthrough.
