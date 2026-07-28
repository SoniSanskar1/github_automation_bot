import { describe, expect, it } from "vitest";

import { toGitHubProfile } from "./user-profile";

describe("toGitHubProfile", () => {
  it("maps trusted Supabase GitHub metadata", () => {
    const profile = toGitHubProfile({
      id: "a4d7d7a1-d8b1-481e-88e4-399070082ca2",
      user_metadata: {
        user_name: "octocat",
        full_name: "The Octocat",
        avatar_url: "https://avatars.githubusercontent.com/u/1",
      },
    } as never);

    expect(profile).toEqual({
      id: "a4d7d7a1-d8b1-481e-88e4-399070082ca2",
      githubLogin: "octocat",
      displayName: "The Octocat",
      avatarUrl: "https://avatars.githubusercontent.com/u/1",
    });
  });

  it("rejects a user without a GitHub login", () => {
    expect(() =>
      toGitHubProfile({
        id: "a4d7d7a1-d8b1-481e-88e4-399070082ca2",
        user_metadata: {},
      } as never),
    ).toThrow("github_login_missing");
  });
});
