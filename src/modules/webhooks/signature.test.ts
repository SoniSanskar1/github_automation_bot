import { describe, expect, it } from "vitest";

import {
  createWebhookSignature,
  verifyWebhookSignature,
} from "./signature";

describe("GitHub webhook signature verification", () => {
  const secret = "a-test-secret-that-is-at-least-32-characters";
  const body = new TextEncoder().encode('{"action":"opened"}');

  it("accepts a matching HMAC-SHA256 signature", () => {
    const signature = createWebhookSignature(body, secret);

    expect(verifyWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("rejects modified bodies and malformed signatures", () => {
    const signature = createWebhookSignature(body, secret);
    const modifiedBody = new TextEncoder().encode('{"action":"closed"}');

    expect(verifyWebhookSignature(modifiedBody, signature, secret)).toBe(false);
    expect(verifyWebhookSignature(body, "sha1=wrong", secret)).toBe(false);
    expect(verifyWebhookSignature(body, null, secret)).toBe(false);
  });
});
