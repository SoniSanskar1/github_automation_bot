import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createWebhookSignature } from "@/modules/webhooks/signature";

const { ingestWebhook } = vi.hoisted(() => ({
  ingestWebhook: vi.fn(),
}));

vi.mock("@/modules/webhooks/ingestion", () => ({ ingestWebhook }));

import { POST } from "./route";

const secret = "route-test-secret-that-is-at-least-32-characters";
const deliveryId = "8a4c1530-c6d2-11ef-b864-0242ac120002";

function webhookRequest(
  payload: unknown,
  event = "issues",
  signatureOverride?: string,
) {
  const encodedBody = new TextEncoder().encode(JSON.stringify(payload));
  return new Request("http://localhost/api/github/webhooks", {
    method: "POST",
    body: encodedBody,
    headers: {
      "content-type": "application/json",
      "x-github-delivery": deliveryId,
      "x-github-event": event,
      "x-hub-signature-256":
        signatureOverride ?? createWebhookSignature(encodedBody, secret),
    },
  });
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

describe("GitHub webhook route", () => {
  beforeEach(() => {
    vi.stubEnv("GITHUB_WEBHOOK_SECRET", secret);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    ingestWebhook.mockResolvedValue({
      status: "queued",
      eventId: "event-id",
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    ingestWebhook.mockReset();
  });

  it("queues an authentic supported delivery", async () => {
    const response = await POST(webhookRequest(issuePayload()));

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ status: "queued" });
    expect(ingestWebhook).toHaveBeenCalledOnce();
  });

  it("rejects a forged signature before ingestion", async () => {
    const response = await POST(
      webhookRequest(issuePayload(), "issues", `sha256=${"0".repeat(64)}`),
    );

    expect(response.status).toBe(401);
    expect(ingestWebhook).not.toHaveBeenCalled();
  });

  it("acknowledges an authentic unsupported event without storing it", async () => {
    const response = await POST(webhookRequest({ ref: "main" }, "push"));

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ status: "ignored" });
    expect(ingestWebhook).not.toHaveBeenCalled();
  });
});
