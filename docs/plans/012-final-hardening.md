# Final Hardening and Submission Readiness

## Purpose

Make the deployed RepoPilot repository accurate, reviewable, and ready for
assessment submission without destabilizing the production workflow.

## Current state

Phases 0–10 are merged and production-tested. GitHub authentication,
installation, signed webhook ingestion, durable scheduled processing,
configurable rules, GitHub labels, Slack notifications, dashboard history, and
optional Gemini enrichment all work in production.

## Scope

### Included

- Audit tracked files for credential patterns and stale claims.
- Run dependency, test, type, lint, build, and diff checks.
- Replace the AI-notes template with truthful project evidence.
- Correct local setup, deployment-order, production status, and demo guidance.
- Create a concise evaluator checklist.

### Excluded

- New product features or database migrations.
- Changing production secrets, GitHub App settings, or Supabase Cron.
- Forced dependency downgrades that do not resolve advisories safely.
- Deleting test history or disabled rules.

## Acceptance criteria

- No placeholder fields remain in `AI_NOTES.md`.
- README matches deployed behavior and documents migration-before-code order.
- Submission checklist covers the required evaluator flow and failure evidence.
- No tracked high-confidence secret pattern is found.
- Typecheck, lint, tests, build, and diff validation pass.

## Architecture and flow

No runtime flow changes. This phase verifies that repository evidence accurately
describes the existing production flow and that the release remains buildable.

## Data model changes

None.

## Security analysis

Use a tracked-file scan for common Supabase, GitHub, Google, Slack, and private
key patterns. Do not print local environment files. Record dependency advisories
honestly and reject unsafe forced downgrades.

## Reliability analysis

The main operational risk is deployment order: migrations must be applied
before code that queries new tables. The final documentation makes that order
explicit and retains the scheduler recovery runbook.

## Implementation milestones

1. Audit repository and dependency state.
2. Correct README and finalize AI disclosure.
3. Add evaluator/demo checklist and learning/work-log evidence.
4. Run all checks, review diff, commit, and push.

## Verification

```text
npm audit --omit=dev --audit-level=high
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
```

Manual checks remain human-owned: public sign-in, connected repository,
matching issue, GitHub label, Slack message, Gemini card, and scheduler timing.

## Rollback or recovery

This phase changes documentation only. Revert its commits if a factual claim is
wrong; no data or production configuration requires rollback.

## Progress

- [x] Read required project and planning context.
- [x] Create branch from merged Phase 10 main.
- [x] Audit tracked secrets, dependencies, and stale documentation.
- [x] Finalize submission documents.
- [x] Run full verification and review.
- [x] Commit and push.

## Decisions and discoveries

- The latest available Next.js is already installed. `npm audit fix --force`
  proposes a breaking downgrade to Next 9, so it is not an acceptable fix.
- Production testing exposed the importance of applying migrations before
  deploying code that queries the new table; this becomes an explicit runbook
  requirement.

## Learning summary

Submission hardening is release engineering: prove what exists, remove stale
claims, disclose known risk, and make the system reproducible. It is not an
excuse to add late features.
