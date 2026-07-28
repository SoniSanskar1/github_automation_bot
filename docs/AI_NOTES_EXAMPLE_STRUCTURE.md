# AI Notes Example Structure — Do Not Submit as Fact

This file demonstrates the level of specificity expected. It is not evidence and must not be copied as a claim unless it matches actual events.

## Tools and approach

Name the exact AI tool/model. Explain that AI assisted with bounded tasks such as scaffolding, tests, refactors, and review, while the candidate owned architecture, service configuration, security decisions, live verification, and final acceptance.

## Decisions

Use two or three decisions with alternatives and trade-offs.

Example structure:

> I chose a PostgreSQL-backed job/outbox model instead of adding Redis and a separate queue. The application already required PostgreSQL, and one transaction could persist the webhook event and processing job before acknowledgment. This reduced free-tier and deployment complexity. The trade-off is that this is not intended for high-throughput workloads.

## Hardest wrong turn

A strong entry identifies exact code behavior and evidence.

Example structure only:

> While implementing webhook validation, AI suggested parsing the body with `request.json()` before calculating the HMAC. I caught this when a real GitHub delivery failed signature validation even though the secret was correct. Parsing and reserializing JSON does not preserve the exact signed bytes. I changed the route to read `request.text()` once, verify the signature over that raw text, and only then parse JSON. I added valid/invalid signature fixture tests and added the raw-body rule to `AGENTS.md`.

Do not use this example if it did not happen.

## Improvements

Select concrete improvements based on actual limitations, not a generic wish list.
