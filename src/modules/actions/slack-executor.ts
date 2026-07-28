import "server-only";

import { eq } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { actionExecutions } from "@/db/schema";
import { nextRetryAt } from "@/modules/jobs/retry";
import {
  sendSlackMessage,
  SlackDeliveryError,
} from "@/modules/slack/client";
import { buildSlackMessage } from "@/modules/slack/message";

export type PlannedSlackAction = {
  type: "slack_notify";
  userId: string;
  repositoryId: string;
  eventId: string;
  ruleId: string;
  idempotencyKey: string;
};

export class SlackActionExecutionError extends Error {
  constructor(
    readonly code: string,
    readonly safeMessage: string,
    readonly permanent: boolean,
  ) {
    super(code);
  }
}

export async function executeSlackAction(
  plan: PlannedSlackAction,
  target: {
    repository: string;
    resourceNumber: number;
    eventType: string;
    title: string;
    author: string;
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

  if (
    !execution ||
    execution.status === "succeeded" ||
    execution.status === "unknown_outcome"
  ) {
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
    await sendSlackMessage(buildSlackMessage(target));
    await database
      .update(actionExecutions)
      .set({
        status: "succeeded",
        externalReference: `${target.repository}#${target.resourceNumber}`,
        completedAt: new Date(),
        lastHttpStatus: 200,
        lastErrorCode: null,
        lastErrorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(actionExecutions.id, execution.id));
  } catch (error) {
    const failure =
      error instanceof SlackDeliveryError
        ? error
        : new SlackDeliveryError(
            "slack_not_configured",
            "Slack notification is not configured.",
            true,
            false,
          );
    const status = failure.unknownOutcome
      ? "unknown_outcome"
      : failure.permanent
        ? "failed"
        : "retrying";

    await database
      .update(actionExecutions)
      .set({
        status,
        nextAttemptAt:
          status === "retrying" ? nextRetryAt(attemptCount) : new Date(),
        completedAt: status === "retrying" ? null : new Date(),
        lastHttpStatus: failure.httpStatus,
        lastErrorCode: failure.code,
        lastErrorMessage: failure.safeMessage,
        updatedAt: new Date(),
      })
      .where(eq(actionExecutions.id, execution.id));

    throw new SlackActionExecutionError(
      failure.code,
      failure.safeMessage,
      failure.permanent,
    );
  }
}
