# Slack Notifications

## Goal

Send one durable Slack notification for each matched demo rule while preserving
independent GitHub and Slack action history.

## Design

- Reuse the action ledger with a deterministic key for `slack_notify`.
- Build a concise message from validated issue/PR metadata.
- Escape Slack control characters in untrusted titles and author names.
- Treat HTTP 429 and 5xx as retryable.
- Treat clear 4xx configuration failures as permanent.
- Treat network/timeout outcomes as `unknown_outcome` and do not resend
  automatically because Slack may have accepted the message.
- Increment the demo rule to version 2 and add the default Slack action.

## Verification

1. Configure `SLACK_WEBHOOK_URL` locally and in Vercel.
2. Create a new issue with `bug` in its title.
3. Invoke the worker.
4. Confirm the GitHub label and one Slack message.
5. Confirm two successful action rows: label and Slack.
6. Invoke the worker again and confirm no duplicate message.

## Progress

- [x] Create `feature/slack-notifications`.
- [x] Implement Slack boundary and action execution.
- [x] Apply rule data migration.
- [x] Run automated verification.
- [ ] Verify production.
