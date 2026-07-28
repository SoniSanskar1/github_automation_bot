# Codex Prompt Library

Use one milestone per task. Replace bracketed values.

## Plan a milestone

Read `AGENTS.md` and the documents relevant to [milestone].

Create an ExecPlan under `docs/plans/` before coding. The plan must include acceptance criteria, request/data flow, trust boundaries, schema impact, idempotency, failure handling, tests, and manual verification.

Do not expand scope beyond [explicit scope]. Explain the plan before implementation.

## Implement a milestone

Implement the approved plan at `[plan path]`.

Requirements:

- keep route handlers thin;
- preserve module boundaries;
- add tests for happy and unhappy paths;
- run type check, lint, tests, and build where available;
- review the diff;
- update relevant docs;
- append truthful entries to `AI_WORK_LOG.md` and `docs/LEARNING_LOG.md`;
- finish with a code walkthrough and manual test instructions.

Do not claim external integration success unless it was actually observed.

## Security review

Review the current diff and relevant existing code as an adversarial security reviewer.

Focus on:

- authentication;
- authorization and ownership;
- webhook signature/raw-body correctness;
- replay and duplicate handling;
- client/server secret boundaries;
- GitHub App permission scope;
- worker endpoint protection;
- untrusted GitHub text;
- logging/redaction;
- dependency/runtime assumptions.

Report findings by severity with file and symbol references. Do not edit until after presenting findings, unless the task explicitly requests fixes.

## Reliability review

Review the event pipeline for loss, duplication, races, and ambiguous outcomes.

Trace:

1. GitHub delivery;
2. signature verification;
3. event/job transaction;
4. job claim;
5. rule evaluation;
6. action ledger;
7. GitHub write-back;
8. Slack call;
9. retry;
10. dashboard visibility.

Create at least one failure-injection test for every material risk fixed.

## Explain code

Teach me the implementation of [feature].

Explain:

- architecture role;
- incoming request;
- validation;
- data structures;
- database transaction;
- external API call;
- error mapping;
- retry/idempotency;
- UI-visible result;
- tests.

Map unfamiliar Next.js/TypeScript concepts to Java Spring Boot or Django where useful. Reference exact files and functions.

## Debug an integration

Investigate [symptom].

Do not immediately rewrite the feature.

First:

1. reconstruct the expected flow;
2. inspect logs without exposing secrets;
3. identify the failing boundary;
4. list hypotheses in probability order;
5. add the smallest useful diagnostic or test;
6. reproduce;
7. fix the root cause;
8. add regression coverage;
9. record the AI suggestion, human verification, and correction in `AI_WORK_LOG.md`.

## Pre-submission review

Perform a complete assessment review against `docs/ASSESSMENT_BRIEF.md`.

Produce:

- pass/fail matrix for every core requirement;
- stretch goals actually completed;
- security/reliability findings;
- unverified claims;
- broken setup/documentation;
- secret exposure risks;
- deployment smoke-test checklist;
- prioritized fixes.

Do not mark a requirement passed without code evidence and, where applicable, live verification.
