# RepoPilot — Event-Driven GitHub Automation Bot

RepoPilot is a deployed event-driven GitHub automation product. It connects
selected repositories, accepts verified GitHub events, evaluates configurable
deterministic rules, performs idempotent GitHub actions, notifies Slack, adds
optional Gemini triage, and exposes authenticated processing history.

## Live application

- Application: https://github-automation-bot-drab.vercel.app/
- Health check: https://github-automation-bot-drab.vercel.app/api/health

## Delivered scope

- GitHub sign-in through Supabase Auth.
- GitHub App installation and selected-repository synchronization.
- Signed, allowlisted, duplicate-safe issue and pull-request webhooks.
- Durable PostgreSQL event/job processing invoked by Supabase Cron.
- Configurable, versioned rules for opened issues and pull requests.
- Idempotent GitHub label actions and safe Slack notifications.
- Tenant-scoped dashboard history, failures, and guarded retry.
- Optional post-success Gemini summary, priority, and label suggestion.

## Architecture

The application is a modular monolith: UI, HTTP Route Handlers, and internal business modules share one Next.js codebase and will deploy as one Vercel application. Domain logic belongs under `src/modules`; route handlers authenticate or verify callers, validate inputs, call services, and map results to HTTP responses.

See [the architecture](docs/ARCHITECTURE.md), [security and reliability requirements](docs/SECURITY_AND_RELIABILITY.md), and [the implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md).

## Prerequisites

- Node.js 20.9+, 22.x, or 24+ (Node.js 24 is used by CI)
- npm 11 or a version compatible with the checked-in lockfile

## Local setup

Install the locked dependencies:

```bash
npm ci
```

Copy `.env.example` to `.env.local` and provide the public Supabase URL and publishable key. Never commit `.env.local` or real credentials.

Required for authentication and GitHub App installation:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
DATABASE_URL=postgresql://runtime-transaction-pooler-url
DATABASE_MIGRATION_URL=postgresql://migration-session-pooler-url
GITHUB_APP_ID=123456
GITHUB_APP_SLUG=your-app-slug
GITHUB_APP_CLIENT_ID=Iv1.your-client-id
GITHUB_APP_CLIENT_SECRET=your-client-secret
GITHUB_APP_PRIVATE_KEY_BASE64=base64-encoded-private-key
GITHUB_WEBHOOK_SECRET=at-least-32-random-characters
INTERNAL_WORKER_SECRET=a-different-random-32-character-secret
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your-placeholder
GEMINI_API_KEY=your-server-only-key
GEMINI_MODEL=gemini-2.5-flash
```

Apply database migrations with `npm run db:migrate`. Use the transaction
pooler URL on port 6543 for `DATABASE_URL` and the session pooler URL on port
5432 for `DATABASE_MIGRATION_URL`.

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` and `http://localhost:3000/api/health`.

For production, configure the same variables in Vercel and set
`NEXT_PUBLIC_APP_URL` to the canonical production origin. Apply migrations
**before** deploying application code that queries new tables.

Configure the GitHub App with both its **Setup URL** and first **Callback URL**
set to:

```text
https://github-automation-bot-drab.vercel.app/api/github/install/callback
```

Leave **Request user authorization (OAuth) during installation** unchecked.
RepoPilot deliberately starts OAuth after the setup callback has safely stored
the installation ID.

For webhook ingestion, set the GitHub App webhook URL to:

```text
https://github-automation-bot-drab.vercel.app/api/github/webhooks
```

Use the same random `GITHUB_WEBHOOK_SECRET` in GitHub and Vercel. Enable the
webhook and subscribe only to **Issues** and **Pull requests**. The endpoint
also accepts GitHub's signed `ping` event used to confirm configuration.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Pull requests and pushes to `main` run the same checks in `.github/workflows/ci.yml`.

## Health endpoint

`GET /api/health` returns a static, non-sensitive response:

```json
{
  "service": "repopilot",
  "status": "ok"
}
```

It intentionally has no database or third-party dependency, so it reports
process availability rather than complete integration health.

## Authentication flow

1. `POST /auth/signin` starts GitHub OAuth through Supabase.
2. GitHub returns to Supabase's provider callback.
3. Supabase redirects to `GET /auth/callback`.
4. The callback exchanges the PKCE code for a cookie session.
5. `/dashboard` verifies the current user on the server.
6. `POST /auth/signout` clears the current browser session.

Only internal post-login paths are accepted, preventing the callback from becoming an open redirect.

## Webhook ingestion flow

1. GitHub sends the raw request with signature, event, and delivery headers.
2. The route rejects oversized requests and verifies the HMAC before parsing.
3. Only `issues`, `pull_request`, and setup `ping` events are accepted.
4. The signed repository and installation IDs are matched to an active connection.
5. One immutable event and one pending job are inserted in a transaction.
6. A repeated GitHub delivery ID is acknowledged without duplicate rows.

The route does not call GitHub, Slack, Gemini, or the rule engine. Those slower
operations run asynchronously in the protected worker.

## Worker and rule flow

1. An authorized caller sends `POST /api/internal/jobs/process` with the internal
   bearer secret.
2. One atomic SQL statement claims due jobs and prevents concurrent workers from
   claiming the same row.
3. The worker loads the event and enabled repository rules.
4. Conditions are validated and evaluated against normalized issue/PR fields.
5. Versioned rule evaluations and job success are stored transactionally.
6. Temporary failures are retried with bounded backoff; invalid data or rules
   become permanent failures.

The demonstration rule matches newly opened issues whose title contains `bug`,
adds the configured label with a GitHub App installation token, and optionally
sends Slack.

## GitHub action execution

For each matched label action, RepoPilot derives a SHA-256 key from the event,
rule/version, action position, and validated configuration. It creates the action
ledger before calling GitHub, skips actions already marked successful, generates
a short-lived installation token, and adds the configured label.

PostgreSQL and GitHub cannot share one transaction, so strict exactly-once
external effects are not possible. Label addition is naturally idempotent:
repeating the same label request converges on one label while the local unique
key preserves one action history row.

## Slack notifications

The version-2 demo rule plans both `github_add_label` and `slack_notify`.
Successful actions are skipped independently, so a Slack retry never repeats an
already-completed GitHub label. Untrusted titles and authors are escaped before
Slack formatting. Ambiguous network outcomes are not automatically resent
because an incoming webhook does not return a message identifier for checking
whether Slack accepted the request.

## Gemini enrichment

After a matched opened issue or pull request completes its deterministic actions
and job-success transaction, the worker may call Gemini. A unique
`(event_id, prompt_version)` ledger prevents duplicate provider calls. Repository
content is bounded and treated as untrusted data; structured output is validated
against a summary, priority enum, and label allowlist. Missing configuration,
timeouts, provider failures, or malformed output are shown as AI-only states and
cannot change the successful GitHub/Slack result.

## Automation history dashboard

`/dashboard` verifies the Supabase session and uses the authenticated user id for
every history query. It displays overview metrics and the newest 25 events with
their processing job, rule-evaluation counts, and action ledger entries. The
page refreshes its server-rendered data every 15 seconds, providing a safe live
view without granting the browser direct database-table access.

Temporary failures that exhaust automatic attempts expose a tenant-scoped
**Retry temporary failure once** control. It grants exactly one additional job
attempt and retains the historical count. Permanent validation, authorization,
and configuration failures cannot be retried. Slack `unknown_outcome` is
review-only because resending could duplicate a notification.

## Rule configuration

The dashboard creates the exact validated condition/action JSON consumed by the
worker. Browser forms cannot submit arbitrary scripts, regex, SQL, URLs, or
action JSON. Every mutation verifies the Supabase session and rechecks both rule
and repository ownership on the server. Edits and status changes increment the
rule version. Create buttons expose pending state, while a transaction-scoped
advisory lock prevents repeated requests from creating duplicate rule names for
the same repository. Rules are disabled instead of deleted because deletion
would remove referenced evaluation and action history under the current schema.

## Environment configuration

`.env.example` documents planned browser-safe and server-only configuration. `src/lib/env.schema.ts` owns validation, while `src/lib/env.ts` is explicitly server-only. Supabase authentication validates its public URL and publishable key when the integration is used.

Never prefix a secret with `NEXT_PUBLIC_`, because Next.js may include those values in browser bundles.

## Project structure

```text
src/
├── app/                 # App Router pages, actions, and HTTP routes
├── components/          # Dashboard UI
├── db/                  # Drizzle schema and database access
├── lib/                 # Environment and Supabase infrastructure
└── modules/             # Domain-focused business logic
```

The approved domain boundaries are documented in `src/modules/README.md`.

## Deployment status

The application is publicly deployed on Vercel. Phases 0–10 are merged,
configured, and production-tested. Live evidence includes authenticated
repository access, `202` webhook delivery, unattended scheduler execution,
GitHub label write-back, Slack notification, dashboard audit history, and
successful Gemini enrichment.

## Known limitations

- The health endpoint reports process availability only.
- Dashboard updates use 15-second polling rather than Supabase Realtime.
- Slack uses one environment-level destination rather than per-user OAuth.
- The latest available Next.js release currently includes transitive
  PostCSS/Sharp advisories; npm proposes only an invalid breaking downgrade, so
  upstream patched releases must be monitored instead of forcing that change.

See [the Supabase scheduler runbook](docs/SUPABASE_SCHEDULER.md) to store the
worker URL/secret in Vault and invoke the protected worker every minute.

## Evaluator demo

See the [submission and demo checklist](docs/SUBMISSION_CHECKLIST.md) for the
five-minute production walkthrough, security evidence, and known limitations.

## AI usage

See `AI_NOTES.md`, `AI_WORK_LOG.md`, `docs/LEARNING_LOG.md`, and `AGENTS.md`.
