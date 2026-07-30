# Submission and Demo Checklist

## Repository evidence

- [ ] `main` contains the final reviewed pull request.
- [ ] CI typecheck, lint, tests, and production build are green.
- [ ] No `.env.local`, private key, webhook URL, API key, or database password
      is tracked.
- [ ] `README.md`, `.env.example`, `AI_NOTES.md`, and `AI_WORK_LOG.md` are
      included.
- [ ] The public deployment and health URLs load.

## Production configuration

- [ ] Supabase Auth GitHub provider and redirect URLs use the production origin.
- [ ] GitHub App setup/callback and webhook URLs use the stable production
      origin.
- [ ] GitHub App subscribes only to Issues and Pull requests with the required
      read/write permissions.
- [ ] Vercel production variables are configured without `NEXT_PUBLIC_` on
      secrets.
- [ ] All migrations are applied before deploying code that queries them.
- [ ] Supabase Vault contains the worker URL and bearer secret.
- [ ] Supabase Cron is active once per minute and recent HTTP responses are 200.

## Five-minute evaluator demo

1. Open the public app and sign in with GitHub.
2. Show the connected repository and enabled “Bug issue triage” rule.
3. Open a GitHub issue whose title contains `bug`.
4. Explain that GitHub receives `202` after signature verification and durable
   event/job insertion; downstream work is asynchronous.
5. Within two minutes, show the bot-applied label and Slack notification.
6. Refresh the dashboard and show:
   - opened and labeled events;
   - one matched rule;
   - succeeded GitHub and Slack actions;
   - Gemini summary, priority, advisory label suggestion, and AI Slack status.
7. Show the separate Slack AI follow-up and explain that it is advisory.
8. Explain that the labeled event correctly performs no actions and that
   duplicate delivery/action constraints prevent repeated work.

## Failure and security evidence

- [ ] Show tests for invalid webhook signatures, duplicate deliveries,
      unsupported events, worker authorization, retry policy, and tenant
      filtering.
- [ ] Explain Slack `unknown_outcome`: it is not blindly resent because delivery
      cannot be confirmed.
- [ ] Explain safe manual retry: only exhausted temporary job failures qualify.
- [ ] Explain why Gemini failure cannot change a successful core job.
- [ ] Show `.env.example` placeholders and the tracked-file secret-scan result,
      never real secret values.

## Known limitations to state honestly

- Dashboard freshness uses authenticated 15-second polling.
- One environment-level Slack destination is used instead of multi-tenant Slack
  OAuth.
- The health route verifies process availability, not database/provider health.
- AI suggestions are advisory and restricted to an allowlist.
- Latest Next.js currently carries transitive PostCSS/Sharp advisories for which
  npm offers only an invalid breaking downgrade; monitor upstream releases.
