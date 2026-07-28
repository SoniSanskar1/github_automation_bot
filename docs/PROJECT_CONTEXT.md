# Project Context

## Working name

RepoPilot — Event-Driven GitHub Automation Bot

The name is provisional and may be replaced without affecting architecture.

## Product statement

RepoPilot allows a GitHub user to install a GitHub App on selected repositories, configure simple event rules, and observe automated GitHub and Slack actions from a live authenticated dashboard.

## Primary demo scenario

A user creates the rule:

> When an issue is opened and its title contains "bug", add the `bug` label and send a Slack alert.

Demo sequence:

1. User signs in using GitHub.
2. User installs the GitHub App on a demo repository.
3. User configures Slack.
4. User creates/enables the rule.
5. Tester opens an issue titled `Bug: login callback fails`.
6. GitHub sends the webhook.
7. The app verifies and stores it.
8. A worker evaluates the rule.
9. The bot adds the `bug` label.
10. Slack receives an alert.
11. The dashboard updates with event, match, actions, status, attempts, and timing.

## Supported event types for the core release

Required:

- `issues` with at least the `opened` action.
- `pull_request` with at least the `opened` action.

Recommended third event if time permits:

- `push`.

## Core action types

Required:

- Add a GitHub label.

Required notification:

- Send Slack message.

Optional:

- Post a GitHub comment.
- AI summary and priority classification.

## Users and tenancy

For the assessment, each authenticated GitHub user is a tenant boundary.

A user may own:

- multiple GitHub App installations;
- multiple connected repositories;
- multiple automation rules;
- one or more Slack configurations;
- event and action history for those repositories.

No user may view or modify another user's repositories, rules, integrations, events, jobs, or action history.

## Non-goals

- General workflow-builder product.
- Arbitrary code execution.
- Organization-wide enterprise governance.
- Billing.
- High-volume queue infrastructure.
- Supporting every GitHub event.
- Supporting every Slack authentication model.
- Fully autonomous AI actions.
- Microservices.

## Product principles

- Working beats broad.
- Durable ingestion before downstream action.
- Deterministic rules before AI.
- Least privilege.
- Visible failures.
- Small, reviewable modules.
- Honest AI collaboration.
