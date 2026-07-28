export type GitHubFailure = {
  code: string;
  message: string;
  permanent: boolean;
  httpStatus?: number;
};

export function classifyGitHubFailure(error: unknown): GitHubFailure {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : undefined;

  if (status === 401 || status === 403 || status === 404 || status === 422) {
    return {
      code: `github_http_${status}`,
      message: "GitHub rejected the configured label action.",
      permanent: true,
      httpStatus: status,
    };
  }

  return {
    code: status ? `github_http_${status}` : "github_network_error",
    message: "GitHub label delivery failed temporarily.",
    permanent: false,
    httpStatus: status,
  };
}
