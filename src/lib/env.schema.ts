import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.url().optional(),
);

export const serverEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: optionalUrl.default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .startsWith("sb_publishable_")
    .optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DATABASE_URL: optionalUrl,
  DATABASE_MIGRATION_URL: optionalUrl,
  GITHUB_OAUTH_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
  GITHUB_APP_ID: z.string().min(1).optional(),
  GITHUB_APP_SLUG: z.string().min(1).optional(),
  GITHUB_APP_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_APP_CLIENT_SECRET: z.string().min(1).optional(),
  GITHUB_APP_PRIVATE_KEY_BASE64: z.string().min(1).optional(),
  GITHUB_WEBHOOK_SECRET: z.string().min(1).optional(),
  GITHUB_APP_INSTALLATION_CALLBACK_URL: optionalUrl,
  INTERNAL_WORKER_SECRET: z.string().min(1).optional(),
  SLACK_WEBHOOK_URL: optionalUrl,
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).optional(),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export const supabasePublicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .startsWith("sb_publishable_"),
});

export type SupabasePublicEnvironment = z.infer<
  typeof supabasePublicEnvironmentSchema
>;

export const githubAppEnvironmentSchema = z.object({
  GITHUB_APP_ID: z.string().regex(/^\d+$/),
  GITHUB_APP_SLUG: z.string().min(1),
  GITHUB_APP_CLIENT_ID: z.string().min(1),
  GITHUB_APP_CLIENT_SECRET: z.string().min(1),
  GITHUB_APP_PRIVATE_KEY_BASE64: z.string().min(1),
});

export const githubWebhookEnvironmentSchema = z.object({
  GITHUB_WEBHOOK_SECRET: z.string().min(32),
});

export const internalWorkerEnvironmentSchema = z.object({
  INTERNAL_WORKER_SECRET: z.string().min(32),
});

export const slackEnvironmentSchema = z.object({
  SLACK_WEBHOOK_URL: z
    .url()
    .refine((value) => new URL(value).protocol === "https:", {
      message: "Slack webhook must use HTTPS.",
    }),
});

export const geminiEnvironmentSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z
    .string()
    .regex(/^[A-Za-z0-9._-]+$/)
    .default("gemini-2.5-flash"),
});
