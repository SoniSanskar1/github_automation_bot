# Configurable Automation Rules

## Purpose

Allow an authenticated user to configure RepoPilot's deterministic automation
without editing SQL or deploying code.

## Current state

The worker already reads enabled rows from `automation_rules` and validates
conditions/actions with Zod. The dashboard shows rule counts but has no
management UI. A version-2 demo rule is present in the connected repository.

## Scope

### Included

- List rules for repositories owned by the authenticated user.
- Create and edit an opened issue or pull-request rule.
- Configure one case-insensitive title keyword.
- Configure one GitHub label and optional Slack notification.
- Enable or disable a rule without deleting its history.
- Increment the rule version for every edit or status change.
- Server-side validation and repository/rule ownership checks.

### Excluded

- Rule deletion, because the current foreign key would cascade into audit rows.
- Arbitrary JSON, regex, templates, scripts, URLs, or custom event actions.
- Multiple conditions, comments, AI actions, and drag-and-drop workflows.

## Acceptance criteria

- Signed-out callers cannot mutate rules.
- A user cannot list or mutate another user's rule or repository.
- Invalid input is rejected before database writes.
- Creating or editing produces the exact JSON consumed by the worker.
- Editing and toggling atomically increments `version`.
- Disabling stops future matches while retaining existing history.

## Architecture and flow

Forms call Next.js Server Actions. Each action verifies the Supabase session,
parses a strict form schema, and calls a server-only rule service. The service
rechecks ownership in the SQL predicate, writes normalized JSON, and returns a
sanitized result. The action revalidates and redirects back to the dashboard.

## Data model changes

None. Existing `automation_rules` columns and indexes are sufficient. Rules are
retained rather than deleted so evaluation/action foreign keys remain intact.

## Security analysis

- User identity comes only from the verified server session.
- Repository and rule IDs are untrusted form values and are checked against
  `user_id` and active repository ownership.
- Zod allowlists event types and action shapes and bounds every string.
- No user-provided code, SQL, regex, URL, or executable template is accepted.
- Errors returned to the UI are fixed status codes, not database details.

## Reliability analysis

- Writes are single SQL statements after validation.
- Version increments happen in the update statement, avoiding lost increments.
- Disable replaces delete and preserves audit history.
- Existing events are not reprocessed when a rule changes.

## Implementation milestones

1. Add form normalization and configuration tests.
2. Add tenant-scoped rule list/create/update/toggle services.
3. Add authenticated Server Actions and dashboard forms.
4. Update documentation and run all checks.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Manual preview:

1. Create a disabled test rule.
2. Edit its keyword/label and confirm the version increases.
3. Enable it and create a matching issue.
4. Run the worker and verify the configured label and optional Slack action.
5. Disable it and confirm a later matching issue plans no action.

## Rollback or recovery

Revert the application changes. No migration is added. Rules created through
the UI can be disabled; they should not be deleted because history references
them.

## Progress

- [x] Inspect current rule and ownership design.
- [x] Create branch and plan.
- [x] Implement rule input, service, and tests.
- [x] Build management UI.
- [x] Update documentation.
- [x] Run complete verification.

## Decisions and discoveries

- Rule deletion was removed from scope after inspection showed it would cascade
  into rule evaluations and action executions, erasing audit evidence.

## Learning summary

The form is not the rule engine itself. It is a safe input layer that accepts a
small set of understandable fields. The server converts those fields into the
JSON already validated and executed by the worker. Server Actions resemble
authenticated controllers; the management module resembles a service/repository
layer. Version increments preserve which configuration evaluated each event.
