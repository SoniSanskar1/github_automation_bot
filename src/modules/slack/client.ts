import "server-only";

import { slackEnvironmentSchema } from "@/lib/env.schema";

export class SlackDeliveryError extends Error {
  constructor(
    readonly code: string,
    readonly safeMessage: string,
    readonly permanent: boolean,
    readonly unknownOutcome: boolean,
    readonly httpStatus?: number,
  ) {
    super(code);
  }
}

export async function sendSlackMessage(message: { text: string }) {
  const { SLACK_WEBHOOK_URL } = slackEnvironmentSchema.parse(process.env);

  let response: Response;
  try {
    response = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new SlackDeliveryError(
      "slack_unknown_outcome",
      "Slack delivery outcome is unknown and requires review.",
      true,
      true,
    );
  }

  if (response.ok) return;

  const retryable = response.status === 429 || response.status >= 500;
  throw new SlackDeliveryError(
    `slack_http_${response.status}`,
    retryable
      ? "Slack temporarily rejected the notification."
      : "Slack rejected the configured notification.",
    !retryable,
    false,
    response.status,
  );
}
