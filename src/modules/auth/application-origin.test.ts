import { describe, expect, it } from "vitest";

import { getApplicationOrigin } from "./application-origin";

describe("getApplicationOrigin", () => {
  it("uses the canonical URL outside Vercel previews", () => {
    expect(
      getApplicationOrigin({
        canonicalUrl: "https://repopilot.example.com/path",
        vercelEnvironment: "production",
        vercelUrl: "ignored.vercel.app",
      }),
    ).toBe("https://repopilot.example.com");
  });

  it("uses Vercel's trusted deployment URL for preview OAuth", () => {
    expect(
      getApplicationOrigin({
        canonicalUrl: "https://repopilot.example.com",
        vercelEnvironment: "preview",
        vercelUrl: "repopilot-feature-123.vercel.app",
      }),
    ).toBe("https://repopilot-feature-123.vercel.app");
  });

  it("rejects a non-Vercel preview hostname", () => {
    expect(
      getApplicationOrigin({
        canonicalUrl: "https://repopilot.example.com",
        vercelEnvironment: "preview",
        vercelUrl: "attacker.example.com",
      }),
    ).toBe("https://repopilot.example.com");
  });
});
