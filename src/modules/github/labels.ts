import "server-only";

import { App } from "octokit";

import { getGitHubAppConfig } from "./config";

export async function addGitHubLabel(input: {
  githubInstallationId: string;
  owner: string;
  repository: string;
  resourceNumber: number;
  label: string;
}) {
  const configuration = getGitHubAppConfig();
  const app = new App({
    appId: configuration.appId,
    privateKey: configuration.privateKey,
  });
  const octokit = await app.getInstallationOctokit(
    Number(input.githubInstallationId),
  );

  await octokit.request(
    "POST /repos/{owner}/{repo}/issues/{issue_number}/labels",
    {
      owner: input.owner,
      repo: input.repository,
      issue_number: input.resourceNumber,
      labels: [input.label],
    },
  );
}
