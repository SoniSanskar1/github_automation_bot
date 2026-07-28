import { describe, expect, it } from "vitest";

import { nextRetryAt, shouldRetry } from "./retry";

describe("job retry policy", () => {
  const now = new Date("2026-07-28T10:00:00.000Z");

  it("uses bounded backoff delays", () => {
    expect(nextRetryAt(1, now).toISOString()).toBe(
      "2026-07-28T10:00:30.000Z",
    );
    expect(nextRetryAt(2, now).toISOString()).toBe(
      "2026-07-28T10:02:00.000Z",
    );
    expect(nextRetryAt(4, now).toISOString()).toBe(
      "2026-07-28T10:30:00.000Z",
    );
  });

  it("stops at the configured maximum attempts", () => {
    expect(shouldRetry(4, 5)).toBe(true);
    expect(shouldRetry(5, 5)).toBe(false);
  });
});
