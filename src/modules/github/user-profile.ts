import type { User } from "@supabase/supabase-js";

import type { GitHubProfile } from "./repository-sync";

function optionalMetadataString(
  metadata: User["user_metadata"],
  key: string,
) {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function toGitHubProfile(user: User): GitHubProfile {
  const githubLogin =
    optionalMetadataString(user.user_metadata, "user_name") ??
    optionalMetadataString(user.user_metadata, "preferred_username");

  if (!githubLogin) {
    throw new Error("github_login_missing");
  }

  return {
    id: user.id,
    githubLogin,
    displayName:
      optionalMetadataString(user.user_metadata, "full_name") ??
      optionalMetadataString(user.user_metadata, "name"),
    avatarUrl: optionalMetadataString(user.user_metadata, "avatar_url"),
  };
}
