import { timingSafeEqual } from "node:crypto";

export function isAuthorizedWorker(
  authorizationHeader: string | null,
  secret: string,
) {
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authorizationHeader ?? "");

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}
