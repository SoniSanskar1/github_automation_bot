CREATE TABLE "github_installations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"github_installation_id" text NOT NULL,
	"account_login" text NOT NULL,
	"account_type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"github_login" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"installation_id" uuid NOT NULL,
	"github_repository_id" text NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"full_name" text NOT NULL,
	"default_branch" text NOT NULL,
	"is_private" boolean NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_installations" ADD CONSTRAINT "github_installations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_auth_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_installation_id_github_installations_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."github_installations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "github_installations_external_id_unique" ON "github_installations" USING btree ("github_installation_id");--> statement-breakpoint
CREATE INDEX "github_installations_user_id_idx" ON "github_installations" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repositories_external_id_unique" ON "repositories" USING btree ("github_repository_id");--> statement-breakpoint
CREATE INDEX "repositories_user_id_idx" ON "repositories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "repositories_installation_id_idx" ON "repositories" USING btree ("installation_id");--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "github_installations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "repositories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "profiles_owner_access" ON "profiles" FOR ALL TO authenticated USING (auth.uid() = "id") WITH CHECK (auth.uid() = "id");--> statement-breakpoint
CREATE POLICY "github_installations_owner_access" ON "github_installations" FOR ALL TO authenticated USING (auth.uid() = "user_id") WITH CHECK (auth.uid() = "user_id");--> statement-breakpoint
CREATE POLICY "repositories_owner_access" ON "repositories" FOR ALL TO authenticated USING (auth.uid() = "user_id") WITH CHECK (auth.uid() = "user_id");
