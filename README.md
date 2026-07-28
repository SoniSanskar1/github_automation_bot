# RepoPilot — Event-Driven GitHub Automation Bot

RepoPilot is being built as a reliable, event-driven GitHub automation product. It will connect selected repositories, accept verified GitHub events, evaluate deterministic rules, perform idempotent GitHub actions, notify Slack, and expose authenticated processing history.

## Current milestone

Phase 0 establishes the engineering baseline:

- Next.js App Router, React, strict TypeScript, and Tailwind CSS;
- Zod-based server environment validation;
- a public landing page and `/api/health` endpoint;
- Vitest, ESLint, type checking, production builds, and GitHub Actions CI;
- modular-monolith directory boundaries for future features.

Authentication, repository installation, webhook processing, persistence, Slack, rules, AI, and live dashboard behavior are not implemented yet.

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

Copy `.env.example` to `.env.local` only when you begin configuring integrations. Never commit `.env.local` or real credentials. Phase 0 runs without integration secrets.

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` and `http://localhost:3000/api/health`.

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

## Environment configuration

`.env.example` documents planned browser-safe and server-only configuration. `src/lib/env.schema.ts` owns validation, while `src/lib/env.ts` is explicitly server-only. Integration-specific values are optional until the milestone that consumes them; that milestone must make its required variables mandatory.

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

A public Vercel deployment and external Supabase, GitHub, and Slack configuration are not part of this local foundation change. They remain required roadmap work and must be verified with real external evidence before being documented as complete.

## Known limitations

- The landing page is an unauthenticated placeholder.
- The health endpoint reports process availability only.
- No external service, database, event, action, or retry flow exists yet.

## AI usage

See `AI_NOTES.md`, `AI_WORK_LOG.md`, `docs/LEARNING_LOG.md`, and `AGENTS.md`.
