import "server-only";

import { and, eq } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import {
  githubInstallations,
  processingJobs,
  repositories,
  webhookEvents,
} from "@/db/schema";

import type { ValidatedWebhook } from "./payload";
import { insertEventAndJob } from "./transaction";

export type IngestionResult =
  | { status: "queued"; eventId: string }
  | { status: "duplicate" }
  | { status: "repository_not_connected" };

export async function ingestWebhook(
  webhook: ValidatedWebhook,
): Promise<IngestionResult> {
  const database = getDatabase();
  const [ownership] = await database
    .select({
      userId: repositories.userId,
      repositoryId: repositories.id,
      installationId: githubInstallations.id,
    })
    .from(repositories)
    .innerJoin(
      githubInstallations,
      eq(repositories.installationId, githubInstallations.id),
    )
    .where(
      and(
        eq(repositories.githubRepositoryId, webhook.githubRepositoryId),
        eq(
          githubInstallations.githubInstallationId,
          webhook.githubInstallationId,
        ),
        eq(repositories.isActive, true),
        eq(githubInstallations.status, "active"),
      ),
    )
    .limit(1);

  if (!ownership) {
    return { status: "repository_not_connected" };
  }

  return database.transaction(async (transaction) => {
    return insertEventAndJob({
      insertEvent: async () => {
        const [event] = await transaction
          .insert(webhookEvents)
          .values({
            userId: ownership.userId,
            repositoryId: ownership.repositoryId,
            installationId: ownership.installationId,
            githubDeliveryId: webhook.deliveryId,
            githubEvent: webhook.event,
            githubAction: webhook.action,
            payload: webhook.payload,
            payloadSha256: webhook.payloadSha256,
            senderLogin: webhook.senderLogin,
            resourceNumber: webhook.resourceNumber,
          })
          .onConflictDoNothing({ target: webhookEvents.githubDeliveryId })
          .returning({ id: webhookEvents.id });

        return event?.id;
      },
      insertJob: async (eventId) => {
        await transaction.insert(processingJobs).values({ eventId });
      },
    });
  });
}
