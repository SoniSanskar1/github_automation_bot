import "server-only";

import { eq } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { actionExecutions } from "@/db/schema";
import { classifyGitHubFailure } from "@/modules/github/failure";
import { addGitHubLabel } from "@/modules/github/labels";
import { nextRetryAt } from "@/modules/jobs/retry";

export type PlannedLabelAction = {
  userId: string;
  repositoryId: string;
  eventId: string;
  ruleId: string;
  idempotencyKey: string;
  label: string;
};

export class GitHubActionExecutionError extends Error {
  constructor(
    readonly code: string,
    readonly safeMessage: string,
    readonly permanent: boolean,
  ) {
    super(code);
  }
}

export async function executeLabelAction(
  plan: PlannedLabelAction,
  target: {
    githubInstallationId: string;
    owner: string;
    repository: string;
    resourceNumber: number;
  },
) {
  const database = getDatabase();
  const [execution] = await database
    .select({
      id: actionExecutions.id,
      status: actionExecutions.status,
      attemptCount: actionExecutions.attemptCount,
    })
    .from(actionExecutions)
    .where(eq(actionExecutions.idempotencyKey, plan.idempotencyKey))
    .limit(1);

  if (!execution || execution.status === "succeeded") {
    return;
  }

  const attemptCount = execution.attemptCount + 1;
  await database
    .update(actionExecutions)
    .set({
      status: "processing",
      attemptCount,
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(actionExecutions.id, execution.id));

  try {
    await addGitHubLabel({ ...target, label: plan.label });
    await database
      .update(actionExecutions)
      .set({
        status: "succeeded",
        externalReference: `${target.owner}/${target.repository}#${target.resourceNumber}`,
        completedAt: new Date(),
        lastHttpStatus: 200,
        lastErrorCode: null,
        lastErrorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(actionExecutions.id, execution.id));
  } catch (error) {
    const failure = classifyGitHubFailure(error);
    await database
      .update(actionExecutions)
      .set({
        status: failure.permanent ? "failed" : "retrying",
        nextAttemptAt: failure.permanent
          ? new Date()
          : nextRetryAt(attemptCount),
        completedAt: failure.permanent ? new Date() : null,
        lastHttpStatus: failure.httpStatus,
        lastErrorCode: failure.code,
        lastErrorMessage: failure.message,
        updatedAt: new Date(),
      })
      .where(eq(actionExecutions.id, execution.id));

    throw new GitHubActionExecutionError(
      failure.code,
      failure.message,
      failure.permanent,
    );
  }
}
