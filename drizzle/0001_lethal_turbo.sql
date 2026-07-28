CREATE TABLE "processing_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"last_error_code" text,
	"last_error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"installation_id" uuid NOT NULL,
	"github_delivery_id" text NOT NULL,
	"github_event" text NOT NULL,
	"github_action" text,
	"payload" jsonb NOT NULL,
	"payload_sha256" text NOT NULL,
	"sender_login" text,
	"resource_number" integer,
	"ingestion_status" text DEFAULT 'queued' NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_event_id_webhook_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_installation_id_github_installations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."github_installations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "processing_jobs_event_id_unique" ON "processing_jobs" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "processing_jobs_status_next_attempt_idx" ON "processing_jobs" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "processing_jobs_locked_at_idx" ON "processing_jobs" USING btree ("locked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_delivery_id_unique" ON "webhook_events" USING btree ("github_delivery_id");--> statement-breakpoint
CREATE INDEX "webhook_events_user_received_idx" ON "webhook_events" USING btree ("user_id","received_at");--> statement-breakpoint
CREATE INDEX "webhook_events_repository_received_idx" ON "webhook_events" USING btree ("repository_id","received_at");--> statement-breakpoint
CREATE INDEX "webhook_events_type_action_idx" ON "webhook_events" USING btree ("github_event","github_action");--> statement-breakpoint
ALTER TABLE "webhook_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "processing_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "webhook_events_owner_read" ON "webhook_events" FOR SELECT TO authenticated USING (auth.uid() = "user_id");--> statement-breakpoint
CREATE POLICY "processing_jobs_owner_read" ON "processing_jobs" FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM "webhook_events"
    WHERE "webhook_events"."id" = "processing_jobs"."event_id"
      AND "webhook_events"."user_id" = auth.uid()
  )
);
