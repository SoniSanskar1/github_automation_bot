import "server-only";

import { and, eq } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { aiEnrichments } from "@/db/schema";
import { geminiEnvironmentSchema } from "@/lib/env.schema";

import {
  generateGeminiEnrichment,
  GeminiEnrichmentError,
} from "./client";
import {
  AI_PROMPT_VERSION,
  toAiEventInput,
} from "./prompt";

type EnrichmentRequest = {
  userId: string;
  repositoryId: string;
  eventId: string;
  eventType: string;
  payload: unknown;
};

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

  try {
    await database
      .update(aiEnrichments)
      .set({ attemptCount: 1, updatedAt: new Date() })
      .where(eq(aiEnrichments.id, claimed.id));

    const result = await generateGeminiEnrichment(input, {
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
  }
}
