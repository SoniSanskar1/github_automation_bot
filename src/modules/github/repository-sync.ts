import "server-only";

import { and, eq } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import {
  githubInstallations,
  profiles,
  repositories,
} from "@/db/schema";

import type { VerifiedInstallation } from "./api";
import type { ValidatedRepositorySelection } from "@/modules/webhooks/payload";

export type GitHubProfile = {
  id: string;
  githubLogin: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export async function synchronizeGitHubRepositories(
  profile: GitHubProfile,
  verifiedInstallations: VerifiedInstallation[],
) {
  const database = getDatabase();

  await database.transaction(async (transaction) => {
    await transaction
      .insert(profiles)
      .values(profile)
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          githubLogin: profile.githubLogin,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          updatedAt: new Date(),
        },
      });

    for (const installation of verifiedInstallations) {
      const externalInstallationId = String(installation.id);
      const [existingInstallation] = await transaction
        .select({ userId: githubInstallations.userId })
        .from(githubInstallations)
        .where(
          eq(
            githubInstallations.githubInstallationId,
            externalInstallationId,
          ),
        )
        .limit(1);

      if (existingInstallation && existingInstallation.userId !== profile.id) {
        throw new Error("github_installation_owned_by_another_user");
      }

      const [savedInstallation] = await transaction
        .insert(githubInstallations)
        .values({
          userId: profile.id,
          githubInstallationId: externalInstallationId,
          accountLogin: installation.account.login,
          accountType: installation.account.type,
        })
        .onConflictDoUpdate({
          target: githubInstallations.githubInstallationId,
          set: {
            accountLogin: installation.account.login,
            accountType: installation.account.type,
            status: "active",
            updatedAt: new Date(),
          },
        })
        .returning({ id: githubInstallations.id });

      if (!savedInstallation) {
        throw new Error("github_installation_not_saved");
      }

      await transaction
        .update(repositories)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(repositories.userId, profile.id),
            eq(repositories.installationId, savedInstallation.id),
          ),
        );

      for (const repository of installation.repositories) {
        const externalRepositoryId = String(repository.id);
        const [existingRepository] = await transaction
          .select({ userId: repositories.userId })
          .from(repositories)
          .where(eq(repositories.githubRepositoryId, externalRepositoryId))
          .limit(1);

        if (existingRepository && existingRepository.userId !== profile.id) {
          throw new Error("github_repository_owned_by_another_user");
        }

        await transaction
          .insert(repositories)
          .values({
            userId: profile.id,
            installationId: savedInstallation.id,
            githubRepositoryId: externalRepositoryId,
            owner: repository.owner.login,
            name: repository.name,
            fullName: repository.full_name,
            defaultBranch: repository.default_branch,
            isPrivate: repository.private,
          })
          .onConflictDoUpdate({
            target: repositories.githubRepositoryId,
            set: {
              installationId: savedInstallation.id,
              owner: repository.owner.login,
              name: repository.name,
              fullName: repository.full_name,
              defaultBranch: repository.default_branch,
              isPrivate: repository.private,
              isActive: true,
              updatedAt: new Date(),
            },
          });
      }
    }
  });
}

export async function listRepositoriesForUser(userId: string) {
  return getDatabase()
    .select({
      id: repositories.id,
      fullName: repositories.fullName,
      defaultBranch: repositories.defaultBranch,
      isPrivate: repositories.isPrivate,
    })
    .from(repositories)
    .where(and(eq(repositories.userId, userId), eq(repositories.isActive, true)))
    .orderBy(repositories.fullName);
}

export async function synchronizeRepositorySelection(
  selection: ValidatedRepositorySelection,
) {
  const database = getDatabase();
  const [installation] = await database
    .select({
      id: githubInstallations.id,
      userId: githubInstallations.userId,
    })
    .from(githubInstallations)
    .where(
      and(
        eq(
          githubInstallations.githubInstallationId,
          selection.githubInstallationId,
        ),
        eq(githubInstallations.status, "active"),
      ),
    )
    .limit(1);

  if (!installation) {
    return { status: "installation_not_connected" as const };
  }

  await database.transaction(async (transaction) => {
    for (const repository of selection.added) {
      const externalRepositoryId = String(repository.id);
      const [existingRepository] = await transaction
        .select({ userId: repositories.userId })
        .from(repositories)
        .where(eq(repositories.githubRepositoryId, externalRepositoryId))
        .limit(1);

      if (
        existingRepository &&
        existingRepository.userId !== installation.userId
      ) {
        throw new Error("github_repository_owned_by_another_user");
      }

      await transaction
        .insert(repositories)
        .values({
          userId: installation.userId,
          installationId: installation.id,
          githubRepositoryId: externalRepositoryId,
          owner: repository.owner.login,
          name: repository.name,
          fullName: repository.full_name,
          defaultBranch: repository.default_branch,
          isPrivate: repository.private,
        })
        .onConflictDoUpdate({
          target: repositories.githubRepositoryId,
          set: {
            installationId: installation.id,
            owner: repository.owner.login,
            name: repository.name,
            fullName: repository.full_name,
            defaultBranch: repository.default_branch,
            isPrivate: repository.private,
            isActive: true,
            updatedAt: new Date(),
          },
        });
    }

    for (const repositoryId of selection.removedRepositoryIds) {
      await transaction
        .update(repositories)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(repositories.userId, installation.userId),
            eq(repositories.installationId, installation.id),
            eq(repositories.githubRepositoryId, repositoryId),
          ),
        );
    }
  });

  return {
    status: "repositories_synchronized" as const,
    added: selection.added.length,
    removed: selection.removedRepositoryIds.length,
  };
}
