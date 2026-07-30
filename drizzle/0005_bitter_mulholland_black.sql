CREATE TABLE "ai_enrichments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"model" text NOT NULL,
	"prompt_version" integer NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"summary" text,
	"priority" text,
	"suggested_label" text,
	"last_error_code" text,
	"last_error_message" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_enrichments" ADD CONSTRAINT "ai_enrichments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_enrichments" ADD CONSTRAINT "ai_enrichments_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_enrichments" ADD CONSTRAINT "ai_enrichments_event_id_webhook_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."webhook_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_enrichments_event_prompt_version_unique" ON "ai_enrichments" USING btree ("event_id","prompt_version");--> statement-breakpoint
CREATE INDEX "ai_enrichments_owner_idx" ON "ai_enrichments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_enrichments_event_idx" ON "ai_enrichments" USING btree ("event_id");--> statement-breakpoint
ALTER TABLE "ai_enrichments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "ai_enrichments_owner_read" ON "ai_enrichments"
FOR SELECT TO authenticated
USING (auth.uid() = "user_id");
