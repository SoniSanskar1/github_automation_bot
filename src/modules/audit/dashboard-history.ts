import "server-only";

import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  or,
} from "drizzle-orm";

import { getDatabase } from "@/db/client";
import {
  actionExecutions,
  aiEnrichments,
  automationRules,
  processingJobs,
  repositories,
  ruleEvaluations,
  webhookEvents,
} from "@/db/schema";
import {
  assembleDashboardEvents,
  type DashboardEvent,
} from "@/modules/audit/dashboard-view-model";

const RECENT_EVENT_LIMIT = 25;

export type DashboardOverview = {
  repositories: number;
  activeRules: number;
  eventsToday: number;
  successfulActions: number;
  actionsNeedingAttention: number;
};

function startOfUtcDay(now: Date) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export async function getDashboardOverview(
  userId: string,
  now = new Date(),
): Promise<DashboardOverview> {
  const database = getDatabase();
  const attentionStatuses = [
    "failed",
    "retrying",
    "unknown_outcome",
  ];

  const [
    [repositoryTotal],
    [ruleTotal],
    [eventTotal],
    [successTotal],
    [attentionTotal],
  ] = await Promise.all([
    database
      .select({ value: count() })
      .from(repositories)
      .where(
        and(eq(repositories.userId, userId), eq(repositories.isActive, true)),
      ),
    database
      .select({ value: count() })
      .from(automationRules)
      .where(
        and(
          eq(automationRules.userId, userId),
          eq(automationRules.isEnabled, true),
        ),
      ),
    database
      .select({ value: count() })
      .from(webhookEvents)
      .where(
        and(
          eq(webhookEvents.userId, userId),
          gte(webhookEvents.receivedAt, startOfUtcDay(now)),
        ),
      ),
    database
      .select({ value: count() })
      .from(actionExecutions)
      .where(
        and(
          eq(actionExecutions.userId, userId),
          eq(actionExecutions.status, "succeeded"),
        ),
      ),
    database
      .select({ value: count() })
      .from(actionExecutions)
      .where(
        and(
          eq(actionExecutions.userId, userId),
          or(
            ...attentionStatuses.map((status) =>
              eq(actionExecutions.status, status),
            ),
          ),
        ),
      ),
  ]);

  return {
    repositories: repositoryTotal?.value ?? 0,
    activeRules: ruleTotal?.value ?? 0,
    eventsToday: eventTotal?.value ?? 0,
    successfulActions: successTotal?.value ?? 0,
    actionsNeedingAttention: attentionTotal?.value ?? 0,
  };
}

export async function listDashboardEvents(
  userId: string,
): Promise<DashboardEvent[]> {
  const database = getDatabase();
  const eventRows = await database
    .select({
      id: webhookEvents.id,
      userId: webhookEvents.userId,
      repositoryUserId: repositories.userId,
      repository: repositories.fullName,
      githubEvent: webhookEvents.githubEvent,
      githubAction: webhookEvents.githubAction,
      senderLogin: webhookEvents.senderLogin,
      resourceNumber: webhookEvents.resourceNumber,
      receivedAt: webhookEvents.receivedAt,
    })
    .from(webhookEvents)
    .innerJoin(repositories, eq(webhookEvents.repositoryId, repositories.id))
    .where(
      and(
        eq(webhookEvents.userId, userId),
        eq(repositories.userId, userId),
      ),
    )
    .orderBy(desc(webhookEvents.receivedAt))
    .limit(RECENT_EVENT_LIMIT);

  if (eventRows.length === 0) {
    return [];
  }

  const eventIds = eventRows.map((event) => event.id);
  const [jobRows, evaluationRows, actionRows, aiEnrichmentRows] =
    await Promise.all([
    database
      .select({
        id: processingJobs.id,
        eventId: processingJobs.eventId,
        status: processingJobs.status,
        attemptCount: processingJobs.attemptCount,
        lastErrorCode: processingJobs.lastErrorCode,
        lastErrorMessage: processingJobs.lastErrorMessage,
      })
      .from(processingJobs)
      .innerJoin(webhookEvents, eq(processingJobs.eventId, webhookEvents.id))
      .where(
        and(
          inArray(processingJobs.eventId, eventIds),
          eq(webhookEvents.userId, userId),
        ),
      ),
    database
      .select({
        eventId: ruleEvaluations.eventId,
        matched: ruleEvaluations.matched,
      })
      .from(ruleEvaluations)
      .innerJoin(webhookEvents, eq(ruleEvaluations.eventId, webhookEvents.id))
      .where(
        and(
          inArray(ruleEvaluations.eventId, eventIds),
          eq(webhookEvents.userId, userId),
        ),
      ),
    database
      .select({
        id: actionExecutions.id,
        eventId: actionExecutions.eventId,
        userId: actionExecutions.userId,
        type: actionExecutions.actionType,
        status: actionExecutions.status,
        attemptCount: actionExecutions.attemptCount,
        lastErrorCode: actionExecutions.lastErrorCode,
        lastErrorMessage: actionExecutions.lastErrorMessage,
        completedAt: actionExecutions.completedAt,
      })
      .from(actionExecutions)
      .where(
        and(
          inArray(actionExecutions.eventId, eventIds),
          eq(actionExecutions.userId, userId),
        ),
      ),
    database
      .select({
        eventId: aiEnrichments.eventId,
        userId: aiEnrichments.userId,
        status: aiEnrichments.status,
        model: aiEnrichments.model,
        promptVersion: aiEnrichments.promptVersion,
        summary: aiEnrichments.summary,
        priority: aiEnrichments.priority,
        suggestedLabel: aiEnrichments.suggestedLabel,
        lastErrorMessage: aiEnrichments.lastErrorMessage,
      })
      .from(aiEnrichments)
      .where(
        and(
          inArray(aiEnrichments.eventId, eventIds),
          eq(aiEnrichments.userId, userId),
        ),
      )
      .orderBy(desc(aiEnrichments.promptVersion)),
  ]);

  return assembleDashboardEvents(
    userId,
    eventRows,
    jobRows,
    evaluationRows,
    actionRows,
    aiEnrichmentRows,
  );
}
