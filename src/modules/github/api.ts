import "server-only";

import { Octokit } from "octokit";
import { z } from "zod";

import { getGitHubAppConfig } from "./config";

const installationSchema = z.object({
  id: z.number().int().positive(),
  account: z.object({
    login: z.string().min(1),
    type: z.string().min(1),
  }),
});

const repositorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  full_name: z.string().min(1),
  private: z.boolean(),
  default_branch: z.string().min(1),
  owner: z.object({ login: z.string().min(1) }),
});

export type VerifiedInstallation = z.infer<typeof installationSchema> & {
  repositories: z.infer<typeof repositorySchema>[];
};

export async function exchangeGitHubAppCode(code: string) {
  const config = getGitHubAppConfig();
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
    }),
  });
  const payload = z
    .object({ access_token: z.string().min(1) })
    .parse(await response.json());
  return payload.access_token;
}

export async function fetchVerifiedInstallation(
  userToken: string,
  expectedInstallationId: number,
) {
  const octokit = new Octokit({
    auth: userToken,
    request: {
      headers: {
        "X-GitHub-Api-Version": "2026-03-10",
      },
    },
  });
  const installations = z
    .array(installationSchema)
    .parse(
      await octokit.paginate("GET /user/installations", { per_page: 100 }),
    );

  const installation = installations.find(
    ({ id }) => id === expectedInstallationId,
  );

  if (!installation) {
    throw new Error("github_installation_not_accessible");
  }

  const repositories = z.array(repositorySchema).parse(
    await octokit.paginate(
      "GET /user/installations/{installation_id}/repositories",
      {
        installation_id: installation.id,
        per_page: 100,
      },
    ),
  );
  return { ...installation, repositories };
}
