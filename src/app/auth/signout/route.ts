import { NextResponse } from "next/server";

import { getServerEnvironment } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  const environment = getServerEnvironment();

  if (error) {
    return NextResponse.redirect(
      new URL("/?auth_error=signout_failed", environment.NEXT_PUBLIC_APP_URL),
      303,
    );
  }

  return NextResponse.redirect(
    new URL("/", environment.NEXT_PUBLIC_APP_URL),
    303,
  );
}
