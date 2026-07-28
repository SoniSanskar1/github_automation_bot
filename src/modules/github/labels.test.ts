import { describe, expect, it } from "vitest";

import { classifyGitHubFailure } from "./failure";

describe("GitHub failure classification", () => {
  it("treats permission and validation failures as permanent", () => {
    expect(classifyGitHubFailure({ status: 403 })).toMatchObject({
      code: "github_http_403",
      permanent: true,
    });
    expect(classifyGitHubFailure({ status: 422 }).permanent).toBe(true);
  });

  it("retries rate limits, server errors, and network failures", () => {
    expect(classifyGitHubFailure({ status: 429 }).permanent).toBe(false);
    expect(classifyGitHubFailure({ status: 503 }).permanent).toBe(false);
    expect(classifyGitHubFailure(new Error("network")).permanent).toBe(false);
  });
});
