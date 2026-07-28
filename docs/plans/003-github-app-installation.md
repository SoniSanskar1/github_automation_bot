# GitHub App Installation and Repository Connection

## Purpose

Allow an authenticated RepoPilot user to install the GitHub App, prove access to the resulting installation, persist the installation and selected repositories, and view only their own connected repositories.

## Current state

Supabase GitHub authentication and a protected dashboard are deployed. No application tables, Drizzle configuration, GitHub App API client, installation callback, or repository persistence exists.

## Scope

### Included

- Drizzle ORM, PostgreSQL driver, schema, migration, and migration scripts.
- Profiles, GitHub installations, and repository tables.
- Row-level security plus explicit server query scoping.
- Authenticated installation start endpoint with expiring state cookie.
- GitHub App OAuth callback and transient user-token exchange.
- Verification using installations accessible to the authorized GitHub user.
- Repository synchronization and dashboard repository list.
- Tests for state validation, external payload validation, and tenant query scoping.

### Excluded

- Webhook ingestion or activation.
- Rule configuration.
- Processing jobs.
- GitHub write-back.
- Slack or AI.
- Storing GitHub user or installation access tokens.

## Acceptance criteria

- A signed-out caller cannot start or complete installation.
- Missing, expired, or mismatched state is rejected.
- A GitHub installation is stored only after GitHub confirms user access.
- Installation and selected repositories persist transactionally.
- Repeated synchronization updates rather than duplicates records.
- Repositories removed from installation access become inactive.
- Dashboard queries always include the authenticated user ID.
- One user cannot retrieve another user's repositories.
- Typecheck, lint, tests, build, and migration checks pass.

## Architecture and flow

```mermaid
sequenceDiagram
    actor User
    participant App as Next.js
    participant GitHub
    participant DB as Supabase PostgreSQL

    User->>App: POST /api/github/install/start
    App->>App: Verify session; create state cookie
    App-->>User: Redirect to GitHub App installation
    User->>GitHub: Select repositories and authorize
    GitHub-->>App: Setup callback with installation ID and state
    App->>GitHub: Start user OAuth with fresh state
    GitHub-->>App: OAuth callback with code and state
    App->>App: Verify session, state, and stored installation ID
    App->>GitHub: Exchange code for transient user token
    App->>GitHub: List accessible app installations/repositories
    App->>DB: Transaction: profile + installations + repositories
    App-->>User: Redirect to dashboard
```

## Data model changes

- `profiles`: one row per Supabase Auth UUID; deleted with the auth user.
- `github_installations`: unique GitHub installation ID, owned by one application user for this assessment.
- `repositories`: unique GitHub repository ID, linked to an installation and user.
- Foreign keys cascade configuration records when their owner is removed.
- Removed repository access sets `is_active = false` instead of deleting history.
- RLS restricts rows to `auth.uid() = user_id`.

## Security analysis

- Installation state uses cryptographically random bytes, an HTTP-only SameSite cookie, expiration, and constant-time comparison.
- The callback never trusts a raw installation ID. A transient GitHub App user token lists installations the user can access.
- GitHub responses are parsed with Zod before persistence.
- User and installation access tokens are never stored or logged.
- Private key, client secret, and database URLs remain server-only.
- Database reads and writes include explicit user IDs even though the server database role can bypass RLS.

## Reliability analysis

- Profile, installation, and repository synchronization occurs in one database transaction.
- External IDs have unique constraints.
- Upserts make callback retries repeat-safe.
- Missing repositories are deactivated rather than deleted.
- GitHub errors produce sanitized user-facing categories.

## Implementation milestones

1. Database schema, migrations, and environment validation.
2. Installation state and GitHub API boundary.
3. Transactional synchronization service.
4. Start/callback routes and dashboard integration.
5. Tests, documentation, migration, and end-to-end verification.

## Verification

```bash
npm run db:generate
npm run db:migrate
npm run typecheck
npm run lint
npm test
npm run build
```

Manual:

1. Signed-out start request is rejected.
2. Authenticated user installs the app on a test repository.
3. Callback opens the dashboard with the repository visible.
4. Repeating sync creates no duplicate rows.
5. A direct query/path cannot expose another user's repository.

## Rollback or recovery

The migration creates only Phase 2 tables. Before production data exists it can be reversed with a new explicit down migration or by dropping the new tables in dependency order. Once event history exists, repository/install rows must be deactivated rather than destructively deleted.

## Progress

- [x] Verify Phase 1 merge and external prerequisites.
- [x] Create the feature branch.
- [x] Add database and GitHub dependencies.
- [x] Add schema and migration.
- [x] Implement verified installation flow.
- [x] Add repository dashboard.
- [x] Add tests and documentation.
- [x] Run migration and full verification.
- [ ] Review complete diff and manually test the production callback.

## Decisions and discoveries

- Use a setup callback to capture the installation ID, then GitHub App user
  authorization to verify access instead of trusting that callback parameter.
- Keep GitHub tokens transient.
- Use transaction pooling at runtime and session pooling for migrations.
- Defer webhook activation until the signed webhook endpoint exists.
- Synchronize only the callback installation after confirming that it belongs
  to the transiently authorized GitHub user.
- Rotate database credentials immediately if a failed tool prints a connection
  URL; URL-encode special password characters before saving connection strings.

## Learning summary

GitHub OAuth identifies the human. GitHub App installation grants repository-scoped bot permissions. The callback must connect those two trust domains before application ownership can be persisted.
