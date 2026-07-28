import { describe, expect, it } from "vitest";

import { isAuthorizedWorker } from "./authorization";

describe("worker authorization", () => {
  const secret = "worker-secret-that-is-longer-than-32-characters";

  it("accepts only the exact bearer secret", () => {
    expect(isAuthorizedWorker(`Bearer ${secret}`, secret)).toBe(true);
    expect(isAuthorizedWorker(`Bearer wrong-${secret}`, secret)).toBe(false);
    expect(isAuthorizedWorker(null, secret)).toBe(false);
  });
});
