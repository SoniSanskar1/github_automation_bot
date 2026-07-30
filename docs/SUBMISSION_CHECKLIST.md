# Assessment Evidence and Demo Guide

This is the final check I used against the supplied assessment brief. The
original brief is preserved as `Assessment Requirement Doc.pdf`; the Markdown
summary is in `docs/ASSESSMENT_BRIEF.md`.

## Requirement coverage

| Assessment requirement | Status | Evidence |
| --- | --- | --- |
| Public web application | Complete | [Production deployment](https://github-automation-bot-drab.vercel.app/) and [health route](https://github-automation-bot-drab.vercel.app/api/health) |
| GitHub sign-in | Complete | Supabase GitHub OAuth, PKCE callback, cookie session, protected dashboard, and sign-out |
| Connect owned repositories | Complete | GitHub App installation with selected-repository synchronization |
| Two webhook event types | Complete | Signed `issues` and `pull_request` events are accepted and recorded |
| GitHub write-back | Complete | Matching rules add labels with short-lived GitHub App installation tokens |
| Slack notification | Complete | Matching rules send an escaped message through a server-only Incoming Webhook |
| Authenticated history | Complete | Dashboard shows events, jobs, rule evaluations, actions, failures, retries, and AI state |
| Local and deployment documentation | Complete | `README.md`, `.env.example`, scheduler runbook, and this demo guide |

## Stretch goals completed

| Stretch goal | Evidence |
| --- | --- |
| UI-configurable rules | Create, edit, enable, and disable issue/PR rules by repository, event, title keyword, label, and Slack option |
| AI enrichment | Gemini summary, priority, and allowlisted label suggestion shown in the dashboard and Slack follow-up |
| GitHub App authentication | Private-key JWT is exchanged for short-lived installation tokens |
| Multiple repositories | Installation changes synchronize added and removed repository access |
| Failure visibility and retries | Structured logs, persisted job/action states, bounded retries, and a guarded manual retry |

## Reliability and security checks

- Webhook signatures are checked against the raw request body before JSON
  parsing.
- The signed installation and repository must belong to an active connection.
- GitHub delivery IDs are unique, so redelivery is acknowledged without
  creating a second event.
- Event and pending-job records are inserted in one transaction before GitHub
  receives `202`.
- Workers use a protected bearer secret and atomically claim due jobs.
- External actions use deterministic idempotency keys.
- Slack ambiguous outcomes are visible and are not blindly resent.
- Dashboard queries and mutations are scoped to the authenticated user.
- Secrets are server-only, `.env.local` is ignored, and `.env.example`
  contains placeholders.

## Five-minute production demo

No shared test credentials are required. Use a GitHub account and a repository
you control.

1. Open the [production application](https://github-automation-bot-drab.vercel.app/)
   and sign in with GitHub.
2. Install RepoPilot on one or more selected repositories.
3. Open **Automation rules** and create or enable a rule for an opened issue or
   pull request. Use a title keyword and an existing repository label.
4. Create a matching issue or pull request on GitHub.
5. In GitHub App **Recent deliveries**, confirm that the webhook returned
   `202`.
6. Wait for the scheduled worker, then confirm the GitHub label and Slack
   notification.
7. Open **History** and show the matched rule, action results, Gemini summary,
   priority, suggested label, and AI Slack status.
8. Redeliver the same GitHub delivery and confirm that no duplicate event or
   action is created.
9. Disable the rule and create another matching event to confirm that no action
   is planned.

## Automated verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The suite currently contains 75 tests across 22 files. CI runs the same checks
for pull requests and pushes to `main`.

## Known limitations

- Dashboard data refreshes every 15 seconds instead of using Realtime.
- Slack uses one environment-level Incoming Webhook rather than per-user OAuth.
- The health route checks application availability, not every external
  dependency.
- AI suggestions are advisory and restricted to an allowlist.
- PostgreSQL is suitable for the current workload but is not intended to replace
  a high-throughput message broker indefinitely.
