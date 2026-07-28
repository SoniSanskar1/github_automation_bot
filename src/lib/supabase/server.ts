import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicEnvironment } from "@/lib/env.public";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const environment = getSupabasePublicEnvironment();

  return createServerClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Server Components cannot write cookies. The proxy refreshes them,
            // while Route Handlers can write them normally.
            if (
              !(error instanceof Error) ||
              !error.message.includes("Cookies can only be modified")
            ) {
              throw error;
            }
          }
        },
      },
    },
  );
}
