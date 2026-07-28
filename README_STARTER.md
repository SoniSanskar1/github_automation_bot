# RepoPilot — Event-Driven GitHub Automation Bot

> Rename this file to `README.md` when implementation starts. Replace all placeholders with verified information.

## Overview

RepoPilot connects to selected GitHub repositories, receives repository events, evaluates automation rules, performs GitHub actions, sends Slack notifications, and displays a live authenticated activity log.

## Live application

- Application: `[deployed URL]`
- Demo repository: `[repository URL or instructions]`

## Demonstrated flow

1. Sign in using GitHub.
2. Install/connect the GitHub App.
3. Select a repository.
4. Create or enable a rule.
5. Open a matching issue or pull request.
6. Observe the GitHub action.
7. Observe the Slack notification.
8. Inspect event/action status in the dashboard.

## Architecture

Summarize the implemented architecture and link to `docs/ARCHITECTURE.md`.

## Reliability and security

Document actual implemented controls:

- webhook HMAC validation;
- delivery idempotency;
- transactional event/job storage;
- action idempotency;
- retries;
- visible failures;
- secret handling;
- ownership checks.

Do not list controls that are not implemented.

## Local setup

### Prerequisites

- Node.js `[version]`
- package manager `[name/version]`
- Supabase project or local Supabase setup
- GitHub OAuth/App configuration
- Slack Incoming Webhook

### Install

```bash
[install command]
```

### Environment

Copy `.env.example` to `.env.local` and provide local values.

Never commit `.env.local`.

### Database

```bash
[migration command]
[optional seed command]
```

### Run

```bash
[dev command]
```

### Test

```bash
[typecheck command]
[lint command]
[test command]
[build command]
```

## GitHub configuration

Document exact:

- homepage URL;
- callback URL;
- setup/installation URL;
- webhook URL;
- subscribed events;
- permissions.

Do not include secrets.

## Slack configuration

Document how to create/select the test channel and configure the server-side webhook variable.

## Deployment

Explain:

- Vercel deployment;
- Supabase setup;
- migrations;
- production environment variables;
- GitHub callback/webhook URLs;
- scheduler/worker setup;
- production verification.

## Evaluator test instructions

Provide a brief, deterministic test script and any throwaway credentials that are safe to share.

## Known limitations

Be explicit.

## AI usage

See `AI_NOTES.md`, `AI_WORK_LOG.md`, and `AGENTS.md`.
