# AI Work Log

Maintain this during implementation. Keep entries concise but specific. This file is evidence for the final `AI_NOTES.md`.

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
