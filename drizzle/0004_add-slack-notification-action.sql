UPDATE "automation_rules"
SET
  "actions" = "actions" || '[{"type":"slack_notify","config":{"template":"default"}}]'::jsonb,
  "version" = "version" + 1,
  "updated_at" = now()
WHERE "name" = 'Bug issue triage'
  AND NOT "actions" @> '[{"type":"slack_notify"}]'::jsonb;
