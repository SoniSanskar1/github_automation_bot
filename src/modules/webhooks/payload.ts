import { createHash } from "node:crypto";

import { z } from "zod";

export const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024;

const deliveryIdSchema = z.uuid();
const eventNameSchema = z.string().min(1).max(100);
const externalIdSchema = z.number().int().positive().safe();

const basePayloadSchema = z.object({
  action: z.string().min(1).max(100),
  installation: z.object({ id: externalIdSchema }),
  repository: z.object({ id: externalIdSchema }),
  sender: z.object({ login: z.string().min(1).max(255) }),
});

const issuePayloadSchema = basePayloadSchema.extend({
  issue: z.object({ number: z.number().int().positive() }),
});

const pullRequestPayloadSchema = basePayloadSchema.extend({
  pull_request: z.object({ number: z.number().int().positive() }),
});

const repositorySelectionRepositorySchema = z.object({
  id: externalIdSchema,
  name: z.string().min(1).max(255),
  full_name: z.string().min(1).max(510),
  private: z.boolean(),
  default_branch: z.string().min(1).max(255),
  owner: z.object({ login: z.string().min(1).max(255) }),
});

const repositorySelectionPayloadSchema = z.object({
  action: z.enum(["added", "removed"]),
  installation: z.object({ id: externalIdSchema }),
  repositories_added: z.array(repositorySelectionRepositorySchema),
  repositories_removed: z.array(
    z.object({ id: externalIdSchema }).passthrough(),
  ),
  sender: z.object({ login: z.string().min(1).max(255) }),
});

export type SupportedWebhookEvent = "issues" | "pull_request";

export type ValidatedWebhook = {
  deliveryId: string;
  event: SupportedWebhookEvent;
  action: string;
  githubInstallationId: string;
  githubRepositoryId: string;
  senderLogin: string;
  resourceNumber: number;
  payload: unknown;
  payloadSha256: string;
};

export type ValidatedRepositorySelection = {
  deliveryId: string;
  githubInstallationId: string;
  action: "added" | "removed";
  added: Array<z.infer<typeof repositorySelectionRepositorySchema>>;
  removedRepositoryIds: string[];
  senderLogin: string;
};

export type ParsedWebhook =
  | { kind: "ping"; deliveryId: string }
  | { kind: "unsupported"; deliveryId: string; event: string }
  | {
      kind: "repository_selection";
      selection: ValidatedRepositorySelection;
    }
  | { kind: "event"; webhook: ValidatedWebhook };

export class WebhookRequestError extends Error {
  constructor(
    readonly code:
      | "body_too_large"
      | "invalid_json"
      | "invalid_payload"
      | "missing_delivery"
      | "missing_event",
  ) {
    super(code);
  }
}

export function parseWebhook(
  body: Uint8Array,
  eventHeader: string | null,
  deliveryHeader: string | null,
): ParsedWebhook {
  if (body.byteLength > MAX_WEBHOOK_BODY_BYTES) {
    throw new WebhookRequestError("body_too_large");
  }

  const deliveryResult = deliveryIdSchema.safeParse(deliveryHeader);
  if (!deliveryResult.success) {
    throw new WebhookRequestError("missing_delivery");
  }

  const eventResult = eventNameSchema.safeParse(eventHeader);
  if (!eventResult.success) {
    throw new WebhookRequestError("missing_event");
  }

  if (eventResult.data === "ping") {
    return { kind: "ping", deliveryId: deliveryResult.data };
  }

  if (eventResult.data === "installation_repositories") {
    let payload: unknown;
    try {
      payload = JSON.parse(new TextDecoder().decode(body));
    } catch {
      throw new WebhookRequestError("invalid_json");
    }

    const result = repositorySelectionPayloadSchema.safeParse(payload);
    if (!result.success) {
      throw new WebhookRequestError("invalid_payload");
    }

    return {
      kind: "repository_selection",
      selection: {
        deliveryId: deliveryResult.data,
        githubInstallationId: String(result.data.installation.id),
        action: result.data.action,
        added: result.data.repositories_added,
        removedRepositoryIds: result.data.repositories_removed.map(
          (repository) => String(repository.id),
        ),
        senderLogin: result.data.sender.login,
      },
    };
  }

  if (
    eventResult.data !== "issues" &&
    eventResult.data !== "pull_request"
  ) {
    return {
      kind: "unsupported",
      deliveryId: deliveryResult.data,
      event: eventResult.data,
    };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(body));
  } catch {
    throw new WebhookRequestError("invalid_json");
  }

  const payloadResult =
    eventResult.data === "issues"
      ? issuePayloadSchema.safeParse(payload)
      : pullRequestPayloadSchema.safeParse(payload);

  if (!payloadResult.success) {
    throw new WebhookRequestError("invalid_payload");
  }

  const validatedPayload = payloadResult.data;
  const resourceNumber =
    eventResult.data === "issues"
      ? (validatedPayload as z.infer<typeof issuePayloadSchema>).issue.number
      : (validatedPayload as z.infer<typeof pullRequestPayloadSchema>)
          .pull_request.number;

  return {
    kind: "event",
    webhook: {
      deliveryId: deliveryResult.data,
      event: eventResult.data,
      action: validatedPayload.action,
      githubInstallationId: String(validatedPayload.installation.id),
      githubRepositoryId: String(validatedPayload.repository.id),
      senderLogin: validatedPayload.sender.login,
      resourceNumber,
      payload,
      payloadSha256: createHash("sha256").update(body).digest("hex"),
    },
  };
}
