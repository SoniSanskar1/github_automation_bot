import { describe, expect, it, vi } from "vitest";

import {
  generateGeminiEnrichment,
  GeminiEnrichmentError,
} from "./client";

const input = {
  eventType: "issues" as const,
  title: "Bug: button fails",
  body: "The save button does nothing.",
  author: "octocat",
};

describe("generateGeminiEnrichment", () => {
  it("returns validated structured output", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      summary: "The save button is not working.",
                      priority: "high",
                      suggestedLabel: "bug",
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await generateGeminiEnrichment(
      input,
      { apiKey: "private-key", model: "gemini-2.5-flash" },
      fetchImplementation,
    );

    expect(result).toEqual({
      summary: "The save button is not working.",
      priority: "high",
      suggestedLabel: "bug",
    });
    expect(fetchImplementation).toHaveBeenCalledOnce();
    expect(fetchImplementation.mock.calls[0]?.[1]?.headers).toMatchObject({
      "x-goog-api-key": "private-key",
    });
  });

  it("converts provider and malformed-response failures to safe errors", async () => {
    const providerFailure = vi.fn<typeof fetch>(
      async () => new Response("provider details", { status: 429 }),
    );
    const malformedResponse = vi.fn<typeof fetch>(
      async () =>
        new Response(
          JSON.stringify({
            candidates: [
              { content: { parts: [{ text: "not-json" }] } },
            ],
          }),
          { status: 200 },
        ),
    );

    await expect(
      generateGeminiEnrichment(
        input,
        { apiKey: "private-key", model: "gemini-2.5-flash" },
        providerFailure,
      ),
    ).rejects.toMatchObject({
      code: "gemini_http_429",
      safeMessage: "Gemini could not enrich this event.",
    } satisfies Partial<GeminiEnrichmentError>);

    await expect(
      generateGeminiEnrichment(
        input,
        { apiKey: "private-key", model: "gemini-2.5-flash" },
        malformedResponse,
      ),
    ).rejects.toMatchObject({
      code: "gemini_invalid_response",
    } satisfies Partial<GeminiEnrichmentError>);
  });
});
