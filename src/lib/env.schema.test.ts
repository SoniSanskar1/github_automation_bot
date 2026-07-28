import { describe, expect, it } from "vitest";

import {
  githubAppEnvironmentSchema,
  githubWebhookEnvironmentSchema,
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

describe("githubAppEnvironmentSchema", () => {
  const validEnvironment = {
    GITHUB_APP_ID: "123456",
    GITHUB_APP_SLUG: "repopilot-test",
    GITHUB_APP_CLIENT_ID: "Iv1.example",
    GITHUB_APP_CLIENT_SECRET: "secret",
    GITHUB_APP_PRIVATE_KEY_BASE64: "base64-value",
  };

  it("accepts a complete GitHub App configuration", () => {
    expect(githubAppEnvironmentSchema.parse(validEnvironment)).toEqual(
      validEnvironment,
    );
  });

  it("rejects a non-numeric GitHub App ID", () => {
    expect(() =>
      githubAppEnvironmentSchema.parse({
        ...validEnvironment,
        GITHUB_APP_ID: "not-an-id",
      }),
    ).toThrow();
  });
});

describe("githubWebhookEnvironmentSchema", () => {
  it("requires a strong server-only webhook secret", () => {
    expect(
      githubWebhookEnvironmentSchema.parse({
        GITHUB_WEBHOOK_SECRET:
          "a-random-webhook-secret-with-more-than-32-characters",
      }),
    ).toBeDefined();
    expect(() =>
      githubWebhookEnvironmentSchema.parse({
        GITHUB_WEBHOOK_SECRET: "too-short",
      }),
    ).toThrow();
  });
});
