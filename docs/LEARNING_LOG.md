# Learning Log

Codex should append one concise section after each meaningful milestone.

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
