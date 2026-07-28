import { describe, expect, it } from "vitest";

import {
  serverEnvironmentSchema,
  supabasePublicEnvironmentSchema,
} from "./env.schema";

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

  it("requires valid public Supabase authentication settings", () => {
    const validEnvironment = {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        "sb_publishable_example-for-validation",
    };

    expect(() => supabasePublicEnvironmentSchema.parse({})).toThrow();
    expect(supabasePublicEnvironmentSchema.parse(validEnvironment)).toEqual(
      validEnvironment,
    );
  });
});
