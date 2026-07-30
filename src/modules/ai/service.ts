import "server-only";

import { and, eq } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { aiEnrichments } from "@/db/schema";
import { geminiEnvironmentSchema } from "@/lib/env.schema";
import {
  sendSlackMessage,
  SlackDeliveryError,
} from "@/modules/slack/client";
import { buildAiSlackMessage } from "@/modules/slack/message";

import {
  generateGeminiEnrichment,
  GeminiEnrichmentError,
} from "./client";
import {
  AI_PROMPT_VERSION,
  type AiEnrichmentResult,
  toAiEventInput,
} from "./prompt";

type EnrichmentRequest = {
  userId: string;
  repositoryId: string;
  eventId: string;
  eventType: string;
  payload: unknown;
  repository: string;
  resourceNumber: number;
  notifySlack: boolean;
};

async function notifySlackOfEnrichment(
  enrichmentId: string,
  request: EnrichmentRequest,
  result: {
    summary: string;
    priority: string;
    suggestedLabel: string;
  },
) {
  if (!request.notifySlack) return;

  const database = getDatabase();
  const [claimed] = await database
    .update(aiEnrichments)
    .set({
      notificationStatus: "processing",
      notificationAttemptCount: 1,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(aiEnrichments.id, enrichmentId),
        eq(aiEnrichments.notificationStatus, "not_requested"),
      ),
    )
    .returning({ id: aiEnrichments.id });

  if (!claimed) return;

  try {
    await sendSlackMessage(
      buildAiSlackMessage({
        repository: request.repository,
        resourceNumber: request.resourceNumber,
        eventType: request.eventType,
        ...result,
      }),
    );
    await database
      .update(aiEnrichments)
      .set({
        notificationStatus: "succeeded",
        notificationErrorCode: null,
        notificationErrorMessage: null,
        notifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(aiEnrichments.id, enrichmentId));
  } catch (error) {
    const failure =
      error instanceof SlackDeliveryError
        ? error
        : new SlackDeliveryError(
            "slack_not_configured",
            "AI Slack notification is not configured.",
            true,
            false,
          );

    await database
      .update(aiEnrichments)
      .set({
        notificationStatus: failure.unknownOutcome
          ? "unknown_outcome"
          : "failed",
        notificationErrorCode: failure.code,
        notificationErrorMessage: failure.safeMessage,
        updatedAt: new Date(),
      })
      .where(eq(aiEnrichments.id, enrichmentId));
  }
}

export async function attemptEventEnrichment(
  request: EnrichmentRequest,
) {
  const database = getDatabase();
  const environment = geminiEnvironmentSchema.safeParse(process.env);
  const model = environment.success
    ? environment.data.GEMINI_MODEL
    : "gemini-2.5-flash";

  const [claimed] = await database
    .insert(aiEnrichments)
    .values({
      userId: request.userId,
      repositoryId: request.repositoryId,
      eventId: request.eventId,
      model,
      promptVersion: AI_PROMPT_VERSION,
      status: "processing",
    })
    .onConflictDoNothing()
    .returning({ id: aiEnrichments.id });

  // Another worker or an earlier delivery already owns this event/version.
  if (!claimed) return;

  const complete = (
    values: Partial<
      Pick<
        typeof aiEnrichments.$inferInsert,
        | "status"
        | "summary"
        | "priority"
        | "suggestedLabel"
        | "lastErrorCode"
        | "lastErrorMessage"
      >
    >,
  ) =>
    database
      .update(aiEnrichments)
      .set({ ...values, completedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(aiEnrichments.id, claimed.id),
          eq(aiEnrichments.status, "processing"),
        ),
      );

  if (!environment.success) {
    await complete({
      status: "skipped",
      lastErrorCode: "gemini_not_configured",
      lastErrorMessage: "Gemini enrichment is not configured.",
    });
    return;
  }

  const input = toAiEventInput(request.eventType, request.payload);
  if (!input) {
    await complete({
      status: "failed",
      lastErrorCode: "gemini_invalid_event",
      lastErrorMessage: "This event could not be prepared for AI enrichment.",
    });
    return;
  }

  let result: AiEnrichmentResult;
  try {
    await database
      .update(aiEnrichments)
      .set({ attemptCount: 1, updatedAt: new Date() })
      .where(eq(aiEnrichments.id, claimed.id));

    result = await generateGeminiEnrichment(input, {
      apiKey: environment.data.GEMINI_API_KEY,
      model: environment.data.GEMINI_MODEL,
    });

    await complete({
      status: "succeeded",
      summary: result.summary,
      priority: result.priority,
      suggestedLabel: result.suggestedLabel,
      lastErrorCode: null,
      lastErrorMessage: null,
    });
  } catch (error) {
    const safe =
      error instanceof GeminiEnrichmentError
        ? error
        : new GeminiEnrichmentError(
            "gemini_internal_failure",
            "AI enrichment could not be completed.",
          );

    await complete({
      status: "failed",
      lastErrorCode: safe.code,
      lastErrorMessage: safe.safeMessage,
    });
    return;
  }

  await notifySlackOfEnrichment(claimed.id, request, result);
}
