import { describe, expect, it } from "vitest";

import { createHealthResponse } from "./health";

describe("createHealthResponse", () => {
  it("returns a stable, non-sensitive service status", () => {
    expect(createHealthResponse()).toEqual({
      service: "repopilot",
      status: "ok",
    });
  });
});
