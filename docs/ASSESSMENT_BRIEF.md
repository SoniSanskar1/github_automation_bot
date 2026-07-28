# Assessment Brief — Event-Driven GitHub Automation Bot

## Problem

Build and deploy a web app plus a bot that reacts to activity in a GitHub repository.

## Required flow

1. A user signs in with GitHub.
2. The user connects a repository they own.
3. The app receives repository webhooks.
4. The app processes the event.
5. The app writes back to GitHub.
6. The app sends a Slack notification.
7. An authenticated dashboard shows events and actions.
8. The user can configure simple automation rules.

## Core requirements

- Publicly reachable deployment.
- GitHub sign-in.
- Repository connection.
- At least two webhook event types.
- Durable event recording.
- At least one GitHub write-back action.
- Slack notification.
- Authenticated dashboard with event/action history.
- Local-run and deployment documentation.

## Stretch goals

- UI-configurable rules.
- AI summarization, label suggestion, or priority triage.
- GitHub App authentication using JWT and installation tokens.
- Multiple repositories per user.
- Structured logs, failure visibility, and retries.

## Quality bar

The system:

- must reject forged webhook requests;
- must resist duplicate/replayed delivery;
- must not silently lose accepted events;
- must not expose secrets;
- should run unattended and make failures diagnosable.

## Constraints

- Complete within 72 hours.
- Use no-card free services.
- Deploy to a real public host.
- All source code and context/instruction files must be submitted.

## Deliverables

- GitHub repository with clear commit history.
- Public deployed URL.
- `README.md`.
- `.env.example` with no secrets.
- Testing/demo instructions.
- AI context/instruction files exactly as used.
- `AI_NOTES.md`, approximately one page.

## AI_NOTES.md must cover

- AI tools/models used.
- Division of work between human and AI.
- Two or three decisions made by the candidate and why.
- The hardest real bug or wrong direction introduced by AI.
- How it was detected and corrected.
- Improvements that would be made with more time.
- Optional short prompt/transcript excerpt.

## Evaluation priority

1. Live end-to-end functionality.
2. Security and reliability.
3. Code quality and clarity.
4. Stretch-goal depth.
5. Quality and honesty of AI collaboration.
