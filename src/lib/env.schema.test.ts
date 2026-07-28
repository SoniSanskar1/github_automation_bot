import { describe, expect, it } from "vitest";

import { serverEnvironmentSchema } from "./env.schema";

describe("serverEnvironmentSchema", () => {
  it("provides safe local defaults during the foundation phase", () => {
    const environment = serverEnvironmentSchema.parse({});

    expect(environment).toMatchObject({
      LOG_LEVEL: "info",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
  });

  it("rejects malformed URLs before an integration uses them", () => {
    expect(() =>
      serverEnvironmentSchema.parse({
        SLACK_WEBHOOK_URL: "not-a-url",
      }),
    ).toThrow();
  });
});
