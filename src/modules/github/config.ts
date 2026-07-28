import "server-only";

import { githubAppEnvironmentSchema } from "@/lib/env.schema";

export function getGitHubAppConfig() {
  const environment = githubAppEnvironmentSchema.parse(process.env);

  return {
    appId: environment.GITHUB_APP_ID,
    slug: environment.GITHUB_APP_SLUG,
    clientId: environment.GITHUB_APP_CLIENT_ID,
    clientSecret: environment.GITHUB_APP_CLIENT_SECRET,
    privateKey: Buffer.from(
      environment.GITHUB_APP_PRIVATE_KEY_BASE64,
      "base64",
    ).toString("utf8"),
  };
}
