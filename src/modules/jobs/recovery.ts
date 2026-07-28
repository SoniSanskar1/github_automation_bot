import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { processingJobs, webhookEvents } from "@/db/schema";
import { isManuallyRetryableFailure } from "@/modules/jobs/manual-retry";

export type RetryRequestResult =
  | "retry_scheduled"
  | "not_retryable"
  | "not_available";

export async function requestJobRetry(
  userId: string,
  jobId: string,
): Promise<RetryRequestResult> {
  const database = getDatabase();
  const [job] = await database
    .select({
      id: processingJobs.id,
      eventId: processingJobs.eventId,
      status: processingJobs.status,
      lastErrorCode: processingJobs.lastErrorCode,
    })
    .from(processingJobs)
    .innerJoin(webhookEvents, eq(processingJobs.eventId, webhookEvents.id))
    .where(
      and(
        eq(processingJobs.id, jobId),
        eq(webhookEvents.userId, userId),
      ),
    )
    .limit(1);

  if (!job) return "not_available";
  if (
    job.status !== "failed" ||
    !job.lastErrorCode ||
    !isManuallyRetryableFailure(job.lastErrorCode)
  ) {
    return "not_retryable";
  }
  const retryableErrorCode = job.lastErrorCode;

  return database.transaction(async (transaction) => {
    const [scheduled] = await transaction
      .update(processingJobs)
      .set({
        status: "pending",
        maxAttempts: sql`GREATEST(${processingJobs.maxAttempts}, ${processingJobs.attemptCount} + 1)`,
        nextAttemptAt: new Date(),
        completedAt: null,
        lockedAt: null,
        lockedBy: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(processingJobs.id, job.id),
          eq(processingJobs.status, "failed"),
          eq(processingJobs.lastErrorCode, retryableErrorCode),
        ),
      )
      .returning({ id: processingJobs.id });

    if (!scheduled) return "not_retryable";

    await transaction
      .update(webhookEvents)
      .set({ ingestionStatus: "queued" })
      .where(
        and(
          eq(webhookEvents.id, job.eventId),
          eq(webhookEvents.userId, userId),
        ),
      );

    return "retry_scheduled";
  });
}
