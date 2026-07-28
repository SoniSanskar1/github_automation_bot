# Supabase Worker Scheduler

RepoPilot's accepted webhooks are durable, but they need the protected worker to
run. Supabase Cron calls that worker every minute. The production URL and bearer
secret are stored encrypted in Supabase Vault, not in the cron definition or
repository.

## Prerequisites

- The Phase 9 branch is merged and deployed.
- Vercel has the production `INTERNAL_WORKER_SECRET`.
- You have the same secret available locally without printing or sharing it.
- Supabase Vault, `pg_cron`, and `pg_net` are enabled.

## 1. Enable extensions

In Supabase, open **Database → Extensions** and enable:

- `pg_cron`
- `pg_net`
- `vault` (enabled by default on hosted projects)

## 2. Create encrypted secrets

Open **SQL Editor** and replace only the two placeholder values:

```sql
select vault.create_secret(
  'https://github-automation-bot-drab.vercel.app/api/internal/jobs/process',
  'repopilot_worker_url',
  'Canonical production worker endpoint'
);

select vault.create_secret(
  'PASTE_THE_EXISTING_INTERNAL_WORKER_SECRET_HERE',
  'repopilot_worker_secret',
  'Bearer secret shared with the Vercel worker route'
);
```

Do not save the real SQL in the repository or share a screenshot containing the
secret. The result should show only created secret UUIDs.

## 3. Schedule the worker

Run:

```sql
select cron.schedule(
  'repopilot-worker-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'repopilot_worker_url'
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'repopilot_worker_secret'
      )
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

The job name is stable. Creating the same name again replaces the existing cron
job on hosted Supabase.

## 4. Verify without exposing secrets

Confirm the job exists:

```sql
select jobid, jobname, schedule, active
from cron.job
where jobname = 'repopilot-worker-every-minute';
```

After at least one minute, inspect recent Cron executions:

```sql
select status, start_time, end_time, return_message
from cron.job_run_details
where jobid = (
  select jobid
  from cron.job
  where jobname = 'repopilot-worker-every-minute'
)
order by start_time desc
limit 5;
```

The Vercel function logs should contain a safe `job_worker` entry with
`status: "completed"`. They must not contain the bearer secret.

## 5. End-to-end proof

1. Create a new matching GitHub issue.
2. Do not invoke the worker manually.
3. Wait up to two minutes.
4. Confirm the GitHub label, Slack notification, and dashboard history.
5. Refresh Supabase Cron history and confirm the scheduled run succeeded.

## Disable or recover

Stop unattended processing without deleting events:

```sql
select cron.unschedule('repopilot-worker-every-minute');
```

Accepted events remain stored as pending and will process after the schedule is
restored. Rotate a compromised worker secret in both Vercel and Vault before
reenabling the schedule.

## Security notes

- Never use a browser-visible key as the worker bearer secret.
- Do not query or screenshot `decrypted_secret` values during verification.
- Keep the worker URL on the stable production domain, not a preview URL.
- A wrong or missing bearer token returns HTTP 401.
- Stale `processing` locks become claimable again after five minutes.

References: [Supabase Cron](https://supabase.com/docs/guides/cron),
[scheduling with pg_net and Vault](https://supabase.com/docs/guides/functions/schedule-functions),
and [Supabase Vault](https://supabase.com/docs/guides/database/vault).
