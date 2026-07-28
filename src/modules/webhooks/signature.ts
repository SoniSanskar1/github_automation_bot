import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_PREFIX = "sha256=";
const SHA256_HEX_LENGTH = 64;

export function createWebhookSignature(
  body: Uint8Array,
  secret: string,
): string {
  return `${SIGNATURE_PREFIX}${createHmac("sha256", secret)
    .update(body)
    .digest("hex")}`;
}

export function verifyWebhookSignature(
  body: Uint8Array,
  receivedSignature: string | null,
  secret: string,
): boolean {
  if (
    !receivedSignature?.startsWith(SIGNATURE_PREFIX) ||
    receivedSignature.length !== SIGNATURE_PREFIX.length + SHA256_HEX_LENGTH
  ) {
    return false;
  }

  const expected = Buffer.from(createWebhookSignature(body, secret));
  const received = Buffer.from(receivedSignature);

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}
