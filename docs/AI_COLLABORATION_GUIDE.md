# AI Collaboration Guide

## Purpose

The assessment explicitly evaluates how AI was used, not merely whether AI-generated code exists.

The evidence should show that the candidate:

- used AI productively;
- understood the architecture;
- reviewed generated code;
- tested assumptions;
- caught mistakes;
- made independent decisions;
- can explain the final implementation.

## Recommended division of work

### Human-owned responsibilities

The candidate must actively own and be able to explain:

- architecture choice;
- service selection;
- data ownership;
- security boundaries;
- webhook trust model;
- idempotency strategy;
- retry policy;
- scope trade-offs;
- environment/service configuration;
- test acceptance;
- code review;
- production verification;
- final submission narrative.

### AI-assisted responsibilities

Codex may assist with:

- project scaffolding;
- migrations;
- type definitions;
- route/service implementation;
- test generation;
- test fixture creation;
- refactoring;
- UI components;
- error taxonomy;
- documentation drafts;
- diff review;
- debugging hypotheses;
- code walkthroughs.

### Tasks AI cannot complete independently

- creating or safely managing real secrets;
- making a service choice without human acceptance;
- proving a live integration works without observed evidence;
- claiming a test ran when it did not;
- inventing the candidate's decisions;
- inventing a "hardest bug";
- deciding to cut core reliability for a stretch goal.

## Working method

For each milestone:

1. Human states the acceptance criteria.
2. Codex reads the relevant context files.
3. Codex produces a plan before major code changes.
4. Human reviews architecture/security assumptions.
5. Codex implements a small milestone.
6. Codex runs tests and reviews the diff.
7. Human performs the external/live verification.
8. Results and corrections are recorded in `AI_WORK_LOG.md`.
9. A learning explanation is appended to `docs/LEARNING_LOG.md`.
10. Commit only after the developer can explain the change.

## What to capture for AI_NOTES.md

### Tool and model usage

Capture:

- exact AI tool names;
- model names visible in the UI;
- what each was used for;
- approximate split between candidate and AI.

Do not invent percentages unless they are meaningful. A practical description is better:

> I used Codex for scaffolding, implementation drafts, tests, and diff review. I personally chose the architecture and services, configured GitHub/Supabase/Vercel/Slack, reviewed every change, executed the live integration tests, and corrected security and retry behavior.

### Human decisions

Strong decision examples:

1. Modular monolith rather than microservices.
2. GitHub App rather than using the OAuth user token for automation.
3. Transactional Postgres event/job outbox rather than synchronous processing.
4. Deterministic rules before optional AI.
5. Environment-level Slack webhook for core scope rather than a rushed Slack OAuth flow.

For each selected decision, state:

- alternatives considered;
- why the chosen option fit the constraints;
- trade-off accepted.

### Hardest AI wrong turn

This must be a real event.

Good candidates include:

- AI parsed JSON before verifying the webhook signature, so the raw body changed.
- AI used a normal string comparison instead of constant-time comparison.
- AI performed Slack/GitHub calls inside the webhook route.
- AI checked duplicates in application code without a database unique constraint.
- AI used a GitHub OAuth access token instead of a GitHub App installation token.
- AI put a server secret in a `NEXT_PUBLIC_` variable.
- AI wrote a worker query that allowed concurrent workers to claim the same job.
- AI assumed a framework API or runtime behavior that was incorrect.
- AI generated a test that mocked away the actual bug.

These are examples only. Do not claim one unless it actually happens.

Capture:

1. The prompt/task.
2. The AI suggestion or generated code.
3. Why it was wrong or risky.
4. How it was noticed: test, logs, docs, manual inspection, duplicate behavior, deployment error.
5. The correction.
6. The permanent prevention: test, constraint, or `AGENTS.md` rule.

### With-more-time improvements

Good options:

- Slack OAuth and encrypted per-user installations.
- Dead-letter management and replay UI.
- GitHub check runs.
- richer rule conditions;
- organization support;
- stronger end-to-end fixtures;
- distributed tracing;
- AI prompt evaluation;
- deployment portability;
- queue service for higher throughput.

## Evidence quality

Prefer evidence such as:

- commit hash;
- failing and passing test name;
- screenshot or log reference;
- GitHub delivery id;
- action execution id;
- deployment error;
- diff summary.

Never put real secrets or full sensitive payloads in AI documentation.

## Final AI_NOTES quality bar

The final page should sound like an engineer's retrospective, not marketing copy.

It should be:

- specific;
- honest;
- concise;
- technically concrete;
- balanced about AI strengths and weaknesses;
- clear about human accountability.
