import { NextResponse, type NextRequest } from "next/server";

import { getServerEnvironment } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSafeInternalPath } from "@/modules/auth/safe-redirect";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const authorizationCode = requestUrl.searchParams.get("code");
  const nextPath = getSafeInternalPath(requestUrl.searchParams.get("next"));
  const environment = getServerEnvironment();

  if (authorizationCode) {
    const supabase = await createSupabaseServerClient();
    const { error } =
      await supabase.auth.exchangeCodeForSession(authorizationCode);

    if (!error) {
      return NextResponse.redirect(
        new URL(nextPath, environment.NEXT_PUBLIC_APP_URL),
        303,
      );
    }
  }

  return NextResponse.redirect(
    new URL("/?auth_error=callback_failed", environment.NEXT_PUBLIC_APP_URL),
    303,
  );
}
