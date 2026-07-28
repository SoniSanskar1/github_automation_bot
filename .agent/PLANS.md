# Codex Execution Plans

Use an execution plan for a feature that touches multiple modules, changes security or data flow, adds an external integration, or is expected to take more than one focused coding session.

Create plans under `docs/plans/<sequence>-<feature>.md`.

## Required plan structure

# <Feature name>

## Purpose

Describe the user-visible outcome and why it matters to the assessment.

## Current state

Describe the relevant existing code, routes, tables, and integrations. Reference concrete files and symbols.

## Scope

### Included

List exactly what will be delivered.

### Excluded

List tempting adjacent work that must not be added during this plan.

## Acceptance criteria

Use observable, testable statements.

## Architecture and flow

Explain:

- entry point
- authentication or trust boundary
- validation
- data writes
- background processing
- external calls
- user-visible result
- failure behavior

Include a Mermaid sequence diagram when useful.

## Data model changes

List tables, columns, indexes, constraints, ownership, and migration strategy.

## Security analysis

Cover:

- forged input
- replay/duplicates
- authorization
- secret handling
- logging
- least privilege

## Reliability analysis

Cover:

- durability
- idempotency
- retries
- ambiguous downstream outcomes
- visibility of failure

## Implementation milestones

For each milestone include:

- files
- work
- tests
- expected observable result

## Verification

List exact automated commands and manual steps.

## Rollback or recovery

Explain how to revert or recover without corrupting data.

## Progress

Maintain a checklist while implementing.

## Decisions and discoveries

Record decisions, surprises, incorrect assumptions, and changes to the plan.

## Learning summary

Explain the completed flow to a developer who understands Java/Python backend concepts but is learning this TypeScript/Next.js stack.
