# 72-Hour Implementation Roadmap

This is an execution order, not a promise to implement every stretch goal.

## Phase 0 — Repository and decision baseline

### Deliver

- Initialize Next.js TypeScript project.
- Add formatting, linting, testing, and environment validation.
- Commit the Codex context pack.
- Create Supabase and Vercel projects.
- Create GitHub OAuth/App registrations.
- Create Slack test workspace/channel and incoming webhook.
- Create `.env.example`.
- Confirm a public placeholder deployment.

### Exit criteria

- Local app runs.
- Production URL loads.
- No secrets are committed.
- First architecture decision record is committed.

## Phase 1 — Authentication and protected shell

### Deliver

- Supabase GitHub sign-in.
- Auth callback.
- Protected dashboard layout.
- Sign-out.
- Profile synchronization.
- Ownership helper for server routes.

### Tests

- unauthenticated user redirected;
- authenticated user can load dashboard;
- server route rejects missing session.

### Exit criteria

The evaluator can sign in to a deployed application.

## Phase 2 — GitHub App installation and repositories

### Deliver

- Install/connect button.
- Safe installation callback state.
- Persist installation.
- Fetch and store selected repositories.
- Repository list and status.

### Tests

- callback without valid state rejected;
- installation linked to current user;
- cross-user repository query blocked.

### Exit criteria

A signed-in user can connect a test repository.

## Phase 3 — Webhook ingestion

### Deliver

- Public webhook route.
- Raw-body HMAC verification.
- Event allowlist.
- `issues` and `pull_request` ingestion.
- Event/job transactional insert.
- Delivery-id uniqueness.
- Structured ingestion logs.

### Tests

- valid signature;
- invalid signature;
- duplicate delivery;
- unsupported event;
- transaction rollback.

### Exit criteria

Real GitHub events appear in the database exactly once.

## Phase 4 — Worker and rule engine

### Deliver

- Protected worker route.
- Atomic job claiming.
- Rule schema and evaluation.
- Default seeded/demo rule.
- Rule evaluation history.
- Retry state machine.

### Tests

- worker secret;
- rule match/non-match;
- concurrent claim protection;
- retry calculation;
- max-attempt failure.

### Exit criteria

Stored events are processed and rule decisions are visible.

## Phase 5 — GitHub write-back

### Deliver

- Installation-token generation.
- Add-label action.
- Idempotent action ledger.
- GitHub error classification.
- Action history.

### Tests

- token service mocked;
- action key deterministic;
- duplicate execution skipped;
- 401/403 permanent handling;
- 429/5xx retry handling.

### Exit criteria

Opening a matching issue causes the bot to add a label once.

## Phase 6 — Slack

### Deliver

- Environment-based Slack Incoming Webhook.
- Slack message builder.
- Test-notification action.
- Slack action history.
- Retry/error classification.

### Exit criteria

The same matching issue sends a Slack alert and records the result.

## Phase 7 — Dashboard and realtime

### Deliver

- Overview metrics.
- Live event log.
- Event/action detail.
- Status badges.
- Failure/retry details.
- Realtime subscription or safe polling fallback.

### Exit criteria

The full automation flow can be observed without refreshing, or with a clearly documented fallback if realtime is unavailable.

## Phase 8 — Configurable rule UI

### Deliver

- Create/edit/enable/disable rule.
- Event/action selection.
- Title keyword condition.
- Label action.
- Slack action.
- Server validation.

### Exit criteria

The evaluator can change the keyword and label without code changes.

## Phase 9 — Hardening

### Deliver

- stale-job recovery;
- sanitized error mapping;
- manual retry for safe failures;
- rate-limit handling;
- security tests;
- production build verification;
- demo script.

### Exit criteria

Unhappy paths are visible and do not lose accepted events.

## Phase 10 — AI stretch goal

Only start after the core exit criteria are met.

### Deliver

- opt-in rule/action;
- Gemini structured output;
- issue/PR summary;
- priority;
- suggested label from an allowlist;
- timeout and fallback;
- stored model/prompt version;
- display in Slack/dashboard.

### Exit criteria

AI failure does not block deterministic actions.

## Phase 11 — Submission

### Deliver

- complete `README.md`;
- final `.env.example`;
- local setup;
- deployment explanation;
- evaluator test steps;
- demo repository details;
- architecture diagram;
- test evidence;
- final `AI_NOTES.md`;
- cleaned `AI_WORK_LOG.md` retained;
- public deployment smoke test;
- secret scan;
- clear commit history.

## Scope-cut order

If time is at risk, cut in this order:

1. Visual polish.
2. Push-event support.
3. GitHub comment action.
4. Multi-Slack configuration.
5. AI auto-label action.
6. AI enrichment entirely.
7. Multi-repository UI polish.

Do not cut:

- public deployment;
- authentication;
- two webhook event types;
- webhook verification;
- durable event storage;
- duplicate prevention;
- GitHub write-back;
- Slack notification;
- authenticated logs;
- README and AI documentation.
