CREATE TABLE "action_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"rule_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"target" jsonb NOT NULL,
	"request_summary" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"external_reference" text,
	"last_http_status" integer,
	"last_error_code" text,
	"last_error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "action_executions" ADD CONSTRAINT "action_executions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_executions" ADD CONSTRAINT "action_executions_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_executions" ADD CONSTRAINT "action_executions_event_id_webhook_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_executions" ADD CONSTRAINT "action_executions_rule_id_automation_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."automation_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "action_executions_idempotency_key_unique" ON "action_executions" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "action_executions_owner_idx" ON "action_executions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "action_executions_status_next_attempt_idx" ON "action_executions" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "action_executions_event_created_idx" ON "action_executions" USING btree ("event_id","created_at");--> statement-breakpoint
ALTER TABLE "action_executions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "action_executions_owner_read" ON "action_executions" FOR SELECT TO authenticated USING (auth.uid() = "user_id");
