import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGitHubAppConfig } from "@/modules/github/config";
import {
  createInstallationState,
  INSTALLATION_STATE_COOKIE,
} from "@/modules/github/installation-state";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/?auth_error=authentication_required", request.url),
      303,
    );
  }

  const state = createInstallationState();
  const { slug } = getGitHubAppConfig();
  const installUrl = new URL(
    `https://github.com/apps/${slug}/installations/new`,
  );
  installUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(installUrl, 303);
  response.cookies.set(INSTALLATION_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/api/github/install",
  });
  return response;
}
