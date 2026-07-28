import { NextResponse } from "next/server";

import { githubWebhookEnvironmentSchema } from "@/lib/env.schema";
import { ingestWebhook } from "@/modules/webhooks/ingestion";
import {
  MAX_WEBHOOK_BODY_BYTES,
  parseWebhook,
  WebhookRequestError,
} from "@/modules/webhooks/payload";
import { verifyWebhookSignature } from "@/modules/webhooks/signature";

function jsonResponse(status: number, code: string) {
  return NextResponse.json({ status: code }, { status });
}

function logIngestion(fields: Record<string, string | number | undefined>) {
  console.info(JSON.stringify({ source: "github_webhook", ...fields }));
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_WEBHOOK_BODY_BYTES
  ) {
    return jsonResponse(413, "body_too_large");
  }

  const body = new Uint8Array(await request.arrayBuffer());
  const environment = githubWebhookEnvironmentSchema.safeParse(process.env);
  if (!environment.success) {
    logIngestion({ status: "configuration_error" });
    return jsonResponse(503, "webhook_not_configured");
  }

  if (
    !verifyWebhookSignature(
      body,
      request.headers.get("x-hub-signature-256"),
      environment.data.GITHUB_WEBHOOK_SECRET,
    )
  ) {
    logIngestion({ status: "invalid_signature" });
    return jsonResponse(401, "invalid_signature");
  }

  try {
    const parsed = parseWebhook(
      body,
      request.headers.get("x-github-event"),
      request.headers.get("x-github-delivery"),
    );

    if (parsed.kind === "ping") {
      logIngestion({
        githubDeliveryId: parsed.deliveryId,
        eventType: "ping",
        status: "accepted",
      });
      return jsonResponse(200, "accepted");
    }

    if (parsed.kind === "unsupported") {
      logIngestion({
        githubDeliveryId: parsed.deliveryId,
        eventType: parsed.event,
        status: "ignored",
      });
      return jsonResponse(202, "ignored");
    }

    const result = await ingestWebhook(parsed.webhook);
    logIngestion({
      githubDeliveryId: parsed.webhook.deliveryId,
      eventType: parsed.webhook.event,
      eventAction: parsed.webhook.action,
      status: result.status,
      eventId: result.status === "queued" ? result.eventId : undefined,
    });

    if (result.status === "repository_not_connected") {
      return jsonResponse(202, result.status);
    }

    return jsonResponse(result.status === "queued" ? 202 : 200, result.status);
  } catch (error) {
    if (error instanceof WebhookRequestError) {
      const status = error.code === "body_too_large" ? 413 : 400;
      return jsonResponse(status, error.code);
    }

    logIngestion({ status: "ingestion_failed" });
    return jsonResponse(500, "ingestion_failed");
  }
}
