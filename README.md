# RepoPilot — Event-Driven GitHub Automation Bot

RepoPilot is being built as a reliable, event-driven GitHub automation product. It will connect selected repositories, accept verified GitHub events, evaluate deterministic rules, perform idempotent GitHub actions, notify Slack, and expose authenticated processing history.

## Live application

- Application: https://github-automation-bot-drab.vercel.app/
- Health check: https://github-automation-bot-drab.vercel.app/api/health

## Current milestone

Phase 2 adds GitHub App installation and repository persistence:

- verified GitHub App installation for authenticated users;
- Drizzle-managed Supabase PostgreSQL tables and row-level security;
- transactionally synchronized repository access;
- a user-scoped repository list on the dashboard;
- transient GitHub user tokens that are never stored.

Webhook processing, rules, Slack, AI enrichment, and live event history are not implemented yet.

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
```

Apply database migrations with `npm run db:migrate`. Use the transaction
pooler URL on port 6543 for `DATABASE_URL` and the session pooler URL on port
5432 for `DATABASE_MIGRATION_URL`.

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` and `http://localhost:3000/api/health`.

For production, configure the same variables in Vercel and set `NEXT_PUBLIC_APP_URL` to the canonical production origin.

Configure the GitHub App with both its **Setup URL** and first **Callback URL**
set to:

```text
https://github-automation-bot-drab.vercel.app/api/github/install/callback
```

Leave **Request user authorization (OAuth) during installation** unchecked.
RepoPilot deliberately starts OAuth after the setup callback has safely stored
the installation ID.

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

It intentionally has no database or third-party dependency during Phase 0.

## Authentication flow

1. `POST /auth/signin` starts GitHub OAuth through Supabase.
2. GitHub returns to Supabase's provider callback.
3. Supabase redirects to `GET /auth/callback`.
4. The callback exchanges the PKCE code for a cookie session.
5. `/dashboard` verifies the current user on the server.
6. `POST /auth/signout` clears the current browser session.

Only internal post-login paths are accepted, preventing the callback from becoming an open redirect.

## Environment configuration

`.env.example` documents planned browser-safe and server-only configuration. `src/lib/env.schema.ts` owns validation, while `src/lib/env.ts` is explicitly server-only. Supabase authentication validates its public URL and publishable key when the integration is used.

Never prefix a secret with `NEXT_PUBLIC_`, because Next.js may include those values in browser bundles.

## Project structure

```text
src/
├── app/                 # App Router pages, layouts, and HTTP routes
├── db/                  # Future Drizzle schema and database access
├── lib/                 # Shared infrastructure such as environment validation
└── modules/             # Domain-focused business logic
```

The approved domain boundaries are documented in `src/modules/README.md`.

## Deployment status

The application is publicly deployed on Vercel. Phase 2 must be merged and
redeployed before its GitHub App installation callback can be verified in
production. Webhooks remain disabled until the next milestone provides a
signature-verifying endpoint.

## Known limitations

- The health endpoint reports process availability only.
- Repository access is refreshed when the installation flow runs; webhook-based
  updates arrive in the next milestone.
- No event, action, or retry flow exists yet.

## AI usage

See `AI_NOTES.md`, `AI_WORK_LOG.md`, `docs/LEARNING_LOG.md`, and `AGENTS.md`.
