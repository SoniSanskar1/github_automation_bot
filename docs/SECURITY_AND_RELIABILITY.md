# Security and Reliability

## 1. Threat model

The system exposes public endpoints and processes external content. Important threats include:

- forged webhook calls;
- replayed/duplicate deliveries;
- installation/repository ownership confusion;
- cross-user dashboard access;
- leaked OAuth/App/Slack/AI secrets;
- malicious issue or PR text;
- duplicate GitHub comments or Slack alerts;
- dropped events;
- worker races;
- stale jobs;
- log injection;
- dependency or configuration mistakes.

## 2. Webhook authenticity

Required algorithm:

1. Read the request body exactly once as raw bytes/text.
2. Read `X-Hub-Signature-256`.
3. Require the `sha256=` prefix.
4. Calculate HMAC-SHA256 with the webhook secret.
5. Compare the received and calculated signatures using constant-time comparison.
6. Reject before JSON parsing or database writes when invalid.

Tests must use known payload/secret/signature fixtures.

## 3. Replay and duplicate protection

GitHub can redeliver the same event.

- Require `X-GitHub-Delivery`.
- Store it under a unique database constraint.
- Treat a duplicate as already accepted.
- Do not create another processing job.
- Record only safe duplicate metrics/logs.

This protects against ordinary redelivery and simple replay using the same delivery id. Signature verification still protects against attackers inventing a new delivery id without the secret.

## 4. Durable ingestion

Event and job creation must happen in one database transaction.

Bad flow:

1. insert event;
2. return success;
3. later attempt to create job.

A crash between steps 2 and 3 loses processing.

Correct flow:

1. begin transaction;
2. insert event;
3. insert job;
4. commit;
5. return accepted.

## 5. Authorization

Every authenticated request must establish:

- current auth user;
- requested resource;
- ownership path from user to installation/repository/resource.

Never accept a `user_id` from the browser as proof of ownership.

Repository-selection webhooks must derive the tenant from the already-stored
GitHub installation id. Added repositories may be upserted only for that owner;
removed repositories are deactivated under the same installation and owner.

Installation callbacks must use signed/unguessable state associated with the current user and an expiry time.

## 6. GitHub App permissions

Start with the minimum needed:

- Metadata: read.
- Issues: read and write.
- Pull requests: read and write. GitHub requires write permission when the
  shared issue-label endpoint targets a pull request.
- Contents: read only if processing push details requires it.

Subscribe only to events used by the application.

Do not request administration, members, secrets, workflows, or contents write permission without a demonstrated requirement.

## 7. Secret handling

Server-only secrets include:

- Supabase service-role key;
- GitHub OAuth client secret;
- GitHub App id;
- GitHub App private key;
- GitHub webhook secret;
- Slack webhook URL;
- Gemini API key;
- worker invocation secret.

Rules:

- Store in deployment environment variables.
- Keep `.env.local` ignored.
- Commit `.env.example` with placeholders only.
- Normalize private-key newlines server-side.
- Never expose secrets through `NEXT_PUBLIC_*`.
- Redact secrets from logs and error responses.
- Rotate any secret accidentally committed.

## 8. Input safety

Issue and pull request content is untrusted.

- Validate structure.
- Escape output through React defaults.
- Do not use `dangerouslySetInnerHTML`.
- Do not execute user templates.
- Do not interpolate content into SQL, shell commands, URLs, or code.
- Limit stored/rendered text lengths.
- Avoid logging complete bodies.
- Treat AI output as untrusted structured data and validate it.

## 9. Idempotent actions

A database uniqueness check alone does not guarantee exactly-once execution when an external call succeeds but the local success update fails.

Mitigations:

- use deterministic keys;
- prefer idempotent GitHub label operations;
- use hidden markers for comments;
- create action ledgers before calls;
- distinguish definite failure from unknown outcome;
- avoid automatic resend after an ambiguous result unless the external state can be checked.

Be honest in documentation: exactly-once effects across independent services are difficult. Explain how the design minimizes duplicates and handles uncertainty.

## 10. Retry taxonomy

### Retryable

- timeout before a definitive response;
- DNS/network interruption;
- HTTP 429;
- external 5xx;
- temporary GitHub token failure;
- database transient failure outside the ingestion transaction.

### Permanent/configuration

- invalid signature;
- invalid payload;
- unsupported event;
- missing repository mapping;
- revoked installation;
- Slack webhook invalid;
- permission denied;
- malformed rule.

Permanent failures should be visible and actionable, not repeatedly retried.

## 11. Backoff and limits

- bounded exponential backoff;
- maximum attempts;
- `next_attempt_at`;
- jitter when useful;
- stale-lock recovery;
- batch-size limit;
- per-invocation time budget.

Avoid an infinite retry loop.

## 12. Observability

Structured log fields should include safe identifiers:

- `requestId`
- `githubDeliveryId`
- `eventId`
- `jobId`
- `actionExecutionId`
- `repositoryId`
- `eventType`
- `eventAction`
- `status`
- `attempt`
- `durationMs`
- `errorCode`

Do not log:

- authorization headers;
- cookies;
- GitHub App JWT;
- installation tokens;
- private keys;
- Slack URL;
- AI key;
- complete raw webhook body.

Dashboard observability should show:

- received;
- queued;
- processing;
- succeeded;
- retrying;
- permanently failed;
- unknown outcome.

Manual recovery is limited to exhausted temporary failure codes. A retry grants
one additional attempt without resetting history. Permanent failures and Slack
`unknown_outcome` are never manually resent. The update is tenant-scoped and
requires the job to remain failed, so repeated submissions cannot queue
multiple retries.

## 13. Rate limits

- Detect 429 and relevant GitHub rate-limit headers.
- Respect retry timing when provided.
- Keep calls minimal.
- Cache installation tokens only server-side and only within safe lifetime.
- Do not call AI more than once for the same input/version.
- Avoid repeated repository metadata fetches per event.

## 14. Failure demonstrations for the evaluator

Prepare testable evidence:

1. Send a webhook with an invalid signature — receives rejection and stores nothing.
2. Redeliver the same delivery id — no duplicate event/action.
3. Configure an invalid Slack URL in a safe test environment — action becomes failed/retryable and appears in dashboard.
4. Temporarily disable a downstream integration — event remains stored and retries.
5. Verify one user cannot request another user's event id.
6. Show `.env.example` and secret-free logs.

## 15. Security review checklist

Before submission:

- [ ] Raw-body signature validation.
- [ ] Constant-time comparison.
- [ ] Delivery-id unique constraint.
- [ ] Event/job transaction.
- [ ] Worker endpoint authorization.
- [ ] Resource ownership checks.
- [ ] Least-privilege GitHub App permissions.
- [ ] No client-side secrets.
- [ ] Log redaction.
- [ ] Zod environment validation.
- [ ] Rule/input validation.
- [ ] Retry cap.
- [ ] Stale-job recovery.
- [ ] Idempotent action ledger.
- [ ] Tests for major unhappy paths.
