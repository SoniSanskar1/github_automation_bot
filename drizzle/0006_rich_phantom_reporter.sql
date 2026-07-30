ALTER TABLE "ai_enrichments" ADD COLUMN "notification_status" text DEFAULT 'not_requested' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_enrichments" ADD COLUMN "notification_attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_enrichments" ADD COLUMN "notification_error_code" text;--> statement-breakpoint
ALTER TABLE "ai_enrichments" ADD COLUMN "notification_error_message" text;--> statement-breakpoint
ALTER TABLE "ai_enrichments" ADD COLUMN "notified_at" timestamp with time zone;