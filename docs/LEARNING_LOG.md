# Learning Log

Codex should append one concise section after each meaningful milestone.

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
