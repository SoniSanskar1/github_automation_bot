import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  exchangeGitHubAppCode,
  fetchVerifiedInstallation,
} from "@/modules/github/api";
import {
  INSTALLATION_ID_COOKIE,
  INSTALLATION_STATE_COOKIE,
  createInstallationState,
  installationStatesMatch,
} from "@/modules/github/installation-state";
import { synchronizeGitHubRepositories } from "@/modules/github/repository-sync";
import { toGitHubProfile } from "@/modules/github/user-profile";
import { getGitHubAppConfig } from "@/modules/github/config";

function dashboardRedirect(request: Request, result: string) {
  const url = new URL("/dashboard/repositories", request.url);
  url.searchParams.set("github_connection", result);
  const response = NextResponse.redirect(url, 303);
  response.cookies.set(INSTALLATION_STATE_COOKIE, "", {
    expires: new Date(0),
    path: "/api/github/install",
  });
  response.cookies.set(INSTALLATION_ID_COOKIE, "", {
    expires: new Date(0),
    path: "/api/github/install",
  });
  return response;
}

function secureCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 10 * 60,
    path: "/api/github/install",
  };
}

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(INSTALLATION_STATE_COOKIE)?.value;

  if (!installationStatesMatch(expectedState, state)) {
    return dashboardRedirect(request, "invalid_state");
  }

  if (!code) {
    const installationId = Number(url.searchParams.get("installation_id"));

    if (!Number.isSafeInteger(installationId) || installationId <= 0) {
      return dashboardRedirect(request, "installation_not_found");
    }

    const oauthState = createInstallationState();
    const { clientId } = getGitHubAppConfig();
    const authorizationUrl = new URL("https://github.com/login/oauth/authorize");
    authorizationUrl.searchParams.set("client_id", clientId);
    authorizationUrl.searchParams.set("state", oauthState);

    const response = NextResponse.redirect(authorizationUrl, 303);
    response.cookies.set(
      INSTALLATION_STATE_COOKIE,
      oauthState,
      secureCookieOptions(),
    );
    response.cookies.set(
      INSTALLATION_ID_COOKIE,
      String(installationId),
      secureCookieOptions(),
    );
    return response;
  }

  const installationId = Number(
    cookieStore.get(INSTALLATION_ID_COOKIE)?.value,
  );
  if (!Number.isSafeInteger(installationId) || installationId <= 0) {
    return dashboardRedirect(request, "authorization_missing");
  }

  try {
    const userToken = await exchangeGitHubAppCode(code);
    const installation = await fetchVerifiedInstallation(
      userToken,
      installationId,
    );

    await synchronizeGitHubRepositories(
      toGitHubProfile(user),
      [installation],
    );
    return dashboardRedirect(request, "success");
  } catch {
    return dashboardRedirect(request, "failed");
  }
}
