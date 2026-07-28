import { describe, expect, it } from "vitest";

import { getSafeInternalPath } from "./safe-redirect";

describe("getSafeInternalPath", () => {
  it("allows an internal application path", () => {
    expect(getSafeInternalPath("/dashboard?view=recent")).toBe(
      "/dashboard?view=recent",
    );
  });

  it.each([
    "https://attacker.example",
    "//attacker.example",
    "/\\attacker.example",
    "dashboard",
    null,
  ])("rejects unsafe redirect value %s", (requestedPath) => {
    expect(getSafeInternalPath(requestedPath)).toBe("/dashboard");
  });
});
