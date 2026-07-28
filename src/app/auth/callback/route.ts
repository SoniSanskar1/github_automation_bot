import { NextResponse, type NextRequest } from "next/server";

import { getServerEnvironment } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getApplicationOrigin } from "@/modules/auth/application-origin";
import { getSafeInternalPath } from "@/modules/auth/safe-redirect";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const authorizationCode = requestUrl.searchParams.get("code");
  const nextPath = getSafeInternalPath(requestUrl.searchParams.get("next"));
  const environment = getServerEnvironment();
  const applicationOrigin = getApplicationOrigin({
    canonicalUrl: environment.NEXT_PUBLIC_APP_URL,
    vercelEnvironment: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
  });

  if (authorizationCode) {
    const supabase = await createSupabaseServerClient();
    const { error } =
      await supabase.auth.exchangeCodeForSession(authorizationCode);

    if (!error) {
      return NextResponse.redirect(
        new URL(nextPath, applicationOrigin),
        303,
      );
    }
  }

  return NextResponse.redirect(
    new URL("/?auth_error=callback_failed", applicationOrigin),
    303,
  );
}
