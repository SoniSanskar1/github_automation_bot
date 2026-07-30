# Repository Selection Synchronization

## Purpose

Keep RepoPilot's connected-repository list synchronized when a user adds or
removes repositories through GitHub App settings after initial installation.

## Current state

Initial installation synchronizes all selected repositories. Later GitHub
`installation_repositories` webhooks are signature-verified but classified as
unsupported, so GitHub access and the application database drift apart.

## Scope

- Parse signed `installation_repositories` added/removed deliveries.
- Resolve the existing installation ownership.
- Upsert added repositories and reactivate existing rows.
- Mark removed repositories inactive without deleting audit history.
- Add parser and route tests plus documentation.

## Acceptance criteria

- Forged maintenance events are rejected by the existing HMAC boundary.
- An added repository becomes active for the installation owner.
- A removed repository becomes inactive and history remains stored.
- Repeated deliveries converge on the same state.
- Unknown installations are safely acknowledged without cross-user writes.

## Architecture and flow

The public webhook route verifies the raw-body signature before parsing. A
repository-selection payload is validated separately from issue/PR events and
sent to a server-only synchronization service. One database transaction applies
all additions/removals under the stored installation's user id.

## Data model changes

None. Existing installation/repository foreign keys, repository external-id
uniqueness, `user_id`, and `is_active` fields are reused.

## Security analysis

- Trust only signed GitHub payloads.
- Never accept a browser-supplied owner id.
- Derive ownership from the stored installation id.
- Reject cross-user repository conflicts.
- Log only delivery ids, counts, and safe status.

## Reliability analysis

Upsert/reactivate and conditional deactivation are naturally idempotent. The
transaction prevents a partially applied selection. Removed rows are retained
for audit history.

## Verification

Run typecheck, lint, tests, build, and diff checks. After deployment, redeliver
the existing `installation_repositories` delivery and confirm two repositories
appear on the dashboard.

## Progress

- [x] Reproduce and identify the unsupported webhook gap.
- [x] Implement parser, service, and route.
- [x] Add tests and documentation.
- [x] Run all checks.
- [ ] Commit and push.

## Decisions and discoveries

Reinstalling the App would hide the lifecycle bug and risk configuration churn.
Supporting GitHub's maintenance webhook is the durable solution.
