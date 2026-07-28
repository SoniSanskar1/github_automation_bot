import {
  supabasePublicEnvironmentSchema,
  type SupabasePublicEnvironment,
} from "./env.schema";

let validatedSupabaseEnvironment: SupabasePublicEnvironment | undefined;

export function getSupabasePublicEnvironment(): SupabasePublicEnvironment {
  validatedSupabaseEnvironment ??= supabasePublicEnvironmentSchema.parse({
    // Direct references allow Next.js to inline browser-safe values correctly.
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  return validatedSupabaseEnvironment;
}
