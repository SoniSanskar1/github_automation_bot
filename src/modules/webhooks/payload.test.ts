import { describe, expect, it } from "vitest";

import {
  MAX_WEBHOOK_BODY_BYTES,
  parseWebhook,
  WebhookRequestError,
} from "./payload";

const deliveryId = "8a4c1530-c6d2-11ef-b864-0242ac120002";

function body(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value));
}

function issuePayload() {
  return {
    action: "opened",
    installation: { id: 123 },
    repository: { id: 456 },
    sender: { login: "octocat" },
    issue: { number: 7 },
  };
}

describe("parseWebhook", () => {
  it("extracts the safe routing fields from an issue event", () => {
    const result = parseWebhook(body(issuePayload()), "issues", deliveryId);

    expect(result).toMatchObject({
      kind: "event",
      webhook: {
        deliveryId,
        event: "issues",
        action: "opened",
        githubInstallationId: "123",
        githubRepositoryId: "456",
        senderLogin: "octocat",
        resourceNumber: 7,
      },
    });
  });

  it("accepts ping and ignores unsupported event types", () => {
    expect(parseWebhook(body({ zen: "Keep it logically awesome." }), "ping", deliveryId))
      .toEqual({ kind: "ping", deliveryId });
    expect(parseWebhook(body({ ref: "main" }), "push", deliveryId)).toEqual({
      kind: "unsupported",
      deliveryId,
      event: "push",
    });
  });

  it("rejects malformed headers, payloads, and oversized bodies", () => {
    expect(() => parseWebhook(body(issuePayload()), "issues", "not-a-uuid"))
      .toThrow(WebhookRequestError);
    expect(() => parseWebhook(body({ action: "opened" }), "issues", deliveryId))
      .toThrow("invalid_payload");
    expect(() =>
      parseWebhook(
        new Uint8Array(MAX_WEBHOOK_BODY_BYTES + 1),
        "issues",
        deliveryId,
      ),
    ).toThrow("body_too_large");
  });
});
