# Data Model

This is the target logical model. Exact column names may evolve through migrations, but ownership, uniqueness, and state semantics should remain explicit.

## `profiles`

Application profile linked to the Supabase Auth user.

Key fields:

- `id` — UUID, same as auth user id
- `github_login`
- `display_name`
- `avatar_url`
- `created_at`
- `updated_at`

Ownership: the user.

## `github_installations`

GitHub App installations associated with a user.

Key fields:

- `id` — internal UUID
- `user_id`
- `github_installation_id` — unique external id
- `account_login`
- `account_type`
- `status`
- `created_at`
- `updated_at`

Unique:

- `github_installation_id`

## `repositories`

Repositories accessible through an installation.

Key fields:

- `id`
- `user_id`
- `installation_id`
- `github_repository_id`
- `owner`
- `name`
- `full_name`
- `default_branch`
- `is_private`
- `is_active`
- `created_at`
- `updated_at`

Unique:

- `github_repository_id`
- or `(installation_id, github_repository_id)`

Index:

- `user_id`
- `installation_id`

## `automation_rules`

User-configured rules.

Key fields:

- `id`
- `user_id`
- `repository_id`
- `name`
- `description`
- `event_type`
- `event_action`
- `conditions_json`
- `actions_json`
- `version`
- `is_enabled`
- `created_at`
- `updated_at`

Indexes:

- `(repository_id, event_type, event_action, is_enabled)`

The version increments when behavior changes so evaluation idempotency remains meaningful.

## `webhook_events`

Immutable record of an accepted GitHub delivery.

Key fields:

- `id`
- `user_id`
- `repository_id`
- `installation_id`
- `github_delivery_id`
- `github_event`
- `github_action`
- `payload_json`
- `payload_sha256`
- `sender_login`
- `resource_number`
- `received_at`
- `ingestion_status`

Unique:

- `github_delivery_id`

Indexes:

- `(user_id, received_at desc)`
- `(repository_id, received_at desc)`
- `(github_event, github_action)`

The raw payload may contain user content. Avoid rendering it directly and avoid logging it.

## `processing_jobs`

Durable processing queue.

Key fields:

- `id`
- `event_id`
- `status`
- `attempt_count`
- `max_attempts`
- `next_attempt_at`
- `locked_at`
- `locked_by`
- `last_error_code`
- `last_error_message`
- `started_at`
- `completed_at`
- `created_at`
- `updated_at`

Unique:

- `event_id` for one main processing job per event.

Indexes:

- `(status, next_attempt_at)`
- `locked_at`

## `rule_evaluations`

Audit of whether a rule matched an event.

Key fields:

- `id`
- `event_id`
- `rule_id`
- `rule_version`
- `matched`
- `explanation_json`
- `evaluated_at`

Unique:

- `(event_id, rule_id, rule_version)`

## `action_executions`

Ledger for every planned external or internal action.

Key fields:

- `id`
- `event_id`
- `rule_id`
- `action_type`
- `idempotency_key`
- `target_json`
- `request_summary_json`
- `status`
- `attempt_count`
- `next_attempt_at`
- `external_reference`
- `last_http_status`
- `last_error_code`
- `last_error_message`
- `started_at`
- `completed_at`
- `created_at`
- `updated_at`

Unique:

- `idempotency_key`

Indexes:

- `(status, next_attempt_at)`
- `(event_id, created_at)`
- `(user/repository ownership path as needed)`

## `ai_enrichments`

Optional structured AI enrichment.

Key fields:

- `id`
- `event_id`
- `model`
- `prompt_version`
- `user_id`
- `repository_id`
- `summary`
- `priority`
- `suggested_label`
- `notification_status`
- `notification_attempt_count`
- `notification_error_code`
- `notification_error_message`
- `notified_at`
- `status`
- `attempt_count`
- `last_error_code`
- `last_error_message`
- `completed_at`
- `created_at`
- `updated_at`

Unique:

- `(event_id, prompt_version)`

The unique key claims one external call per event/prompt version. Do not store
raw prompts, raw provider responses, hidden reasoning, or chain-of-thought.
Store only validated structured output and sanitized failure information.
Notification fields provide a separate observable boundary for the optional
Slack follow-up; `unknown_outcome` is terminal to avoid duplicate messages.

## Slack configuration

### Initial assessment option

Use one server-held Slack Incoming Webhook URL configured through environment variables.

This is simpler and safer for the 72-hour build.

### Stretch option

Add encrypted per-user/per-repository Slack connections only after the core system works. Do not store plaintext webhook URLs in a table readable by ordinary application queries.

## Deletion behavior

- Deleting a user should cascade or anonymize owned configuration according to the final privacy approach.
- Historical events should not become orphaned.
- Removing a repository connection should disable rules and future processing, not silently delete failure evidence.
- GitHub App uninstall events should mark installations and repositories inactive.

## Row-level security

Where client-side Supabase access is used, enforce RLS so authenticated users can access only rows connected to their auth user id.

Server-side service-role access must still apply explicit user scoping for dashboard requests. A service-role key bypassing RLS is not authorization.
