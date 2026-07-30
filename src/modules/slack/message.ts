function escapeSlackText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function buildAiSlackMessage(input: {
  repository: string;
  resourceNumber: number;
  eventType: string;
  summary: string;
  priority: string;
  suggestedLabel: string;
}) {
  const resource =
    input.eventType === "pull_request" ? "pull request" : "issue";
  const url = `https://github.com/${input.repository}/${
    resource === "issue" ? "issues" : "pull"
  }/${input.resourceNumber}`;

  return {
    text: [
      `RepoPilot AI enrichment for ${resource} ${input.repository}#${input.resourceNumber}`,
      `Summary: ${escapeSlackText(input.summary)}`,
      `Priority: ${escapeSlackText(input.priority)}`,
      `Suggested label: ${escapeSlackText(input.suggestedLabel)} (advisory only)`,
      url,
    ].join("\n"),
  };
}

export function buildSlackMessage(input: {
  repository: string;
  resourceNumber: number;
  eventType: string;
  title: string;
  author: string;
}) {
  const resource = input.eventType === "pull_request" ? "pull request" : "issue";
  const url = `https://github.com/${input.repository}/${
    resource === "issue" ? "issues" : "pull"
  }/${input.resourceNumber}`;

  return {
    text: [
      `RepoPilot matched ${resource} ${input.repository}#${input.resourceNumber}`,
      `Title: ${escapeSlackText(input.title)}`,
      `Author: ${escapeSlackText(input.author)}`,
      url,
    ].join("\n"),
  };
}
