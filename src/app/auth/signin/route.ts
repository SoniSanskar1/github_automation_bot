import { NextResponse, type NextRequest } from "next/server";

import { getServerEnvironment } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getApplicationOrigin } from "@/modules/auth/application-origin";
import { getSafeInternalPath } from "@/modules/auth/safe-redirect";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const requestedNextPath = form.get("next");
  const nextPath = getSafeInternalPath(
    typeof requestedNextPath === "string" ? requestedNextPath : null,
  );
  const environment = getServerEnvironment();
  const applicationOrigin = getApplicationOrigin({
    canonicalUrl: environment.NEXT_PUBLIC_APP_URL,
    vercelEnvironment: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
  });
  const callbackUrl = new URL("/auth/callback", applicationOrigin);
  callbackUrl.searchParams.set("next", nextPath);

  const supabase = await createSupabaseServerClient();
  const { data: authorization, error } =
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: callbackUrl.toString(),
        skipBrowserRedirect: true,
      },
    });

  if (error || !authorization.url) {
    return NextResponse.redirect(
      new URL("/?auth_error=signin_failed", applicationOrigin),
      303,
    );
  }

  return NextResponse.redirect(authorization.url, 303);
}
