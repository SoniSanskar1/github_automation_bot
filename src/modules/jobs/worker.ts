import "server-only";

import { randomUUID } from "node:crypto";

import { and, eq, sql } from "drizzle-orm";
import { ZodError } from "zod";

import { getDatabase } from "@/db/client";
import {
  actionExecutions,
  automationRules,
  githubInstallations,
  processingJobs,
  repositories,
  ruleEvaluations,
  webhookEvents,
} from "@/db/schema";
import {
  executeLabelAction,
  GitHubActionExecutionError,
  type PlannedLabelAction,
} from "@/modules/actions/executor";
import { createActionKey } from "@/modules/actions/key";
import {
  executeSlackAction,
  SlackActionExecutionError,
  type PlannedSlackAction,
} from "@/modules/actions/slack-executor";
import {
  evaluateConditions,
  InvalidEventPayloadError,
  ruleActionsSchema,
  toRuleInput,
} from "@/modules/rules/engine";

import { nextRetryAt, shouldRetry } from "./retry";

const DEFAULT_BATCH_SIZE = 10;

type ClaimedJob = {
  jobId: string;
  eventId: string;
  attemptCount: number;
  maxAttempts: number;
};

type WorkerSummary = {
  claimed: number;
  succeeded: number;
  retrying: number;
  failed: number;
};

class MissingEventError extends Error {
  constructor() {
    super("missing_event");
  }
}

function safeError(error: unknown) {
  if (error instanceof InvalidEventPayloadError) {
    return {
      code: "invalid_event_payload",
      message: "The stored event payload cannot be evaluated.",
      permanent: true,
    };
  }

  if (error instanceof ZodError) {
    return {
      code: "invalid_rule_configuration",
      message: "An enabled automation rule has invalid configuration.",
      permanent: true,
    };
  }

  if (error instanceof MissingEventError) {
    return {
      code: "missing_event",
      message: "The processing job has no event.",
      permanent: true,
    };
  }

  if (error instanceof GitHubActionExecutionError) {
    return {
      code: error.code,
      message: error.safeMessage,
      permanent: error.permanent,
    };
  }

  if (error instanceof SlackActionExecutionError) {
    return {
      code: error.code,
      message: error.safeMessage,
      permanent: error.permanent,
    };
  }

  return {
    code: "temporary_processing_failure",
    message: "The job could not be processed and may be retried.",
    permanent: false,
  };
}

export async function claimProcessingJobs(
  workerId: string,
  batchSize = DEFAULT_BATCH_SIZE,
) {
  const database = getDatabase();
  const rows = await database.execute<ClaimedJob>(sql`
    WITH candidates AS (
      SELECT "id"
      FROM "processing_jobs"
      WHERE (
        (
          "status" IN ('pending', 'retrying')
          AND "next_attempt_at" <= now()
        )
        OR (
          "status" = 'processing'
          AND "locked_at" < now() - interval '5 minutes'
        )
      )
      AND "attempt_count" < "max_attempts"
      ORDER BY "next_attempt_at", "created_at"
      FOR UPDATE SKIP LOCKED
      LIMIT ${batchSize}
    )
    UPDATE "processing_jobs" AS job
    SET
      "status" = 'processing',
      "attempt_count" = job."attempt_count" + 1,
      "locked_at" = now(),
      "locked_by" = ${workerId},
      "started_at" = COALESCE(job."started_at", now()),
      "updated_at" = now()
    FROM candidates
    WHERE job."id" = candidates."id"
    RETURNING
      job."id" AS "jobId",
      job."event_id" AS "eventId",
      job."attempt_count" AS "attemptCount",
      job."max_attempts" AS "maxAttempts"
  `);

  return Array.from(rows);
}

async function markJobSucceeded(job: ClaimedJob, workerId: string) {
  const database = getDatabase();
  const [event] = await database
    .select({
      id: webhookEvents.id,
      userId: webhookEvents.userId,
      repositoryId: webhookEvents.repositoryId,
      githubEvent: webhookEvents.githubEvent,
      githubAction: webhookEvents.githubAction,
      payload: webhookEvents.payload,
      resourceNumber: webhookEvents.resourceNumber,
      githubInstallationId: githubInstallations.githubInstallationId,
      repositoryOwner: repositories.owner,
      repositoryName: repositories.name,
    })
    .from(webhookEvents)
    .innerJoin(
      repositories,
      eq(webhookEvents.repositoryId, repositories.id),
    )
    .innerJoin(
      githubInstallations,
      eq(webhookEvents.installationId, githubInstallations.id),
    )
    .where(eq(webhookEvents.id, job.eventId))
    .limit(1);

  if (!event) {
    throw new MissingEventError();
  }
  if (!event.resourceNumber) {
    throw new InvalidEventPayloadError();
  }

  const rules = await database
    .select({
      id: automationRules.id,
      version: automationRules.version,
      conditions: automationRules.conditions,
      actions: automationRules.actions,
    })
    .from(automationRules)
    .where(
      and(
        eq(automationRules.repositoryId, event.repositoryId),
        eq(automationRules.eventType, event.githubEvent),
        eq(automationRules.eventAction, event.githubAction ?? ""),
        eq(automationRules.isEnabled, true),
      ),
    );

  const input = toRuleInput(event.githubEvent, event.payload);
  const evaluatedRules = rules.map((rule) => {
    const result = evaluateConditions(input, rule.conditions);
    const actions = ruleActionsSchema.parse(rule.actions);

    return {
      evaluation: {
        eventId: event.id,
        ruleId: rule.id,
        ruleVersion: rule.version,
        matched: result.matched,
        explanation: {
          conditions: result.conditions,
          plannedActionTypes: result.matched
            ? actions.map((action) => action.type)
            : [],
        },
      },
      actions,
    };
  });

  const plans = evaluatedRules.flatMap(
    ({ evaluation, actions }): Array<
      PlannedLabelAction | PlannedSlackAction
    > => {
      if (!evaluation.matched) return [];

      return actions.map((action, actionIndex) => {
        const common = {
          userId: event.userId,
          repositoryId: event.repositoryId,
          eventId: event.id,
          ruleId: evaluation.ruleId,
          idempotencyKey: createActionKey({
            eventId: event.id,
            ruleId: evaluation.ruleId,
            ruleVersion: evaluation.ruleVersion,
            actionIndex,
            action,
          }),
        };

        return action.type === "github_add_label"
          ? {
              ...common,
              type: "github_add_label" as const,
              label: action.config.label,
            }
          : { ...common, type: "slack_notify" as const };
      });
    },
  );

  await database.transaction(async (transaction) => {
    if (evaluatedRules.length > 0) {
      await transaction
        .insert(ruleEvaluations)
        .values(evaluatedRules.map(({ evaluation }) => evaluation))
        .onConflictDoNothing();
    }

    if (plans.length > 0) {
      await transaction
        .insert(actionExecutions)
        .values(
          plans.map((plan) => ({
            userId: plan.userId,
            repositoryId: plan.repositoryId,
            eventId: plan.eventId,
            ruleId: plan.ruleId,
            actionType: plan.type,
            idempotencyKey: plan.idempotencyKey,
            target: {
              owner: event.repositoryOwner,
              repository: event.repositoryName,
              resourceNumber: event.resourceNumber,
            },
            requestSummary:
              plan.type === "github_add_label"
                ? { label: plan.label }
                : { template: "default" },
          })),
        )
        .onConflictDoNothing({ target: actionExecutions.idempotencyKey });
    }
  });

  for (const plan of plans) {
    if (plan.type === "github_add_label") {
      await executeLabelAction(plan, {
        githubInstallationId: event.githubInstallationId,
        owner: event.repositoryOwner,
        repository: event.repositoryName,
        resourceNumber: event.resourceNumber,
      });
    } else {
      await executeSlackAction(plan, {
        repository: `${event.repositoryOwner}/${event.repositoryName}`,
        resourceNumber: event.resourceNumber,
        eventType: event.githubEvent,
        title: input.title,
        author: input.author,
      });
    }
  }

  await database.transaction(async (transaction) => {
    await transaction
      .update(webhookEvents)
      .set({ ingestionStatus: "processed" })
      .where(eq(webhookEvents.id, event.id));

    const [completed] = await transaction
      .update(processingJobs)
      .set({
        status: "succeeded",
        completedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        lastErrorCode: null,
        lastErrorMessage: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(processingJobs.id, job.jobId),
          eq(processingJobs.status, "processing"),
          eq(processingJobs.lockedBy, workerId),
        ),
      )
      .returning({ id: processingJobs.id });

    if (!completed) {
      throw new Error("job_lock_lost");
    }
  });
}

async function markJobFailure(
  job: ClaimedJob,
  workerId: string,
  error: unknown,
) {
  const database = getDatabase();
  const safe = safeError(error);
  const retry =
    !safe.permanent && shouldRetry(job.attemptCount, job.maxAttempts);
  const status = retry ? "retrying" : "failed";

  await database.transaction(async (transaction) => {
    await transaction
      .update(processingJobs)
      .set({
        status,
        nextAttemptAt: retry ? nextRetryAt(job.attemptCount) : new Date(),
        completedAt: retry ? null : new Date(),
        lockedAt: null,
        lockedBy: null,
        lastErrorCode: safe.code,
        lastErrorMessage: safe.message,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(processingJobs.id, job.jobId),
          eq(processingJobs.lockedBy, workerId),
        ),
      );

    await transaction
      .update(webhookEvents)
      .set({ ingestionStatus: status })
      .where(eq(webhookEvents.id, job.eventId));
  });

  return status;
}

export async function processPendingJobs(
  workerId = randomUUID(),
  batchSize = DEFAULT_BATCH_SIZE,
): Promise<WorkerSummary> {
  const jobs = await claimProcessingJobs(workerId, batchSize);
  const summary: WorkerSummary = {
    claimed: jobs.length,
    succeeded: 0,
    retrying: 0,
    failed: 0,
  };

  for (const job of jobs) {
    try {
      await markJobSucceeded(job, workerId);
      summary.succeeded += 1;
    } catch (error) {
      const status = await markJobFailure(job, workerId, error);
      summary[status] += 1;
    }
  }

  return summary;
}
