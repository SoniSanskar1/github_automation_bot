CREATE TABLE "automation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"event_type" text NOT NULL,
	"event_action" text NOT NULL,
	"conditions" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"rule_id" uuid NOT NULL,
	"rule_version" integer NOT NULL,
	"matched" boolean NOT NULL,
	"explanation" jsonb NOT NULL,
	"evaluated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_evaluations" ADD CONSTRAINT "rule_evaluations_event_id_webhook_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_evaluations" ADD CONSTRAINT "rule_evaluations_rule_id_automation_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."automation_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "automation_rules_owner_idx" ON "automation_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "automation_rules_lookup_idx" ON "automation_rules" USING btree ("repository_id","event_type","event_action","is_enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "rule_evaluations_event_rule_version_unique" ON "rule_evaluations" USING btree ("event_id","rule_id","rule_version");--> statement-breakpoint
CREATE INDEX "rule_evaluations_event_idx" ON "rule_evaluations" USING btree ("event_id");--> statement-breakpoint
ALTER TABLE "automation_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rule_evaluations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "automation_rules_owner_access" ON "automation_rules" FOR ALL TO authenticated USING (auth.uid() = "user_id") WITH CHECK (auth.uid() = "user_id");--> statement-breakpoint
CREATE POLICY "rule_evaluations_owner_read" ON "rule_evaluations" FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM "webhook_events" AS "event"
    INNER JOIN "automation_rules" AS "rule" ON "rule"."id" = "rule_evaluations"."rule_id"
    WHERE "event"."id" = "rule_evaluations"."event_id"
      AND "event"."user_id" = auth.uid()
      AND "rule"."user_id" = auth.uid()
  )
);--> statement-breakpoint
INSERT INTO "automation_rules" (
  "user_id",
  "repository_id",
  "name",
  "description",
  "event_type",
  "event_action",
  "conditions",
  "actions"
)
SELECT
  "user_id",
  "id",
  'Bug issue triage',
  'Demo rule: identify newly opened issues whose title contains bug.',
  'issues',
  'opened',
  '[{"field":"title","operator":"contains_case_insensitive","value":"bug"}]'::jsonb,
  '[{"type":"github_add_label","config":{"label":"bug"}}]'::jsonb
FROM "repositories"
WHERE "is_active" = true;
