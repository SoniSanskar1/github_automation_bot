import { describe, expect, it } from "vitest";

import { assembleDashboardEvents } from "./dashboard-view-model";

const receivedAt = new Date("2026-07-28T12:00:00.000Z");

describe("assembleDashboardEvents", () => {
  it("keeps only events and actions owned by the authenticated user", () => {
    const events = assembleDashboardEvents(
      "user-1",
      [
        {
          id: "event-1",
          userId: "user-1",
          repositoryUserId: "user-1",
          repository: "owner/repository",
          githubEvent: "issues",
          githubAction: "opened",
          senderLogin: "octocat",
          resourceNumber: 3,
          receivedAt,
        },
        {
          id: "event-2",
          userId: "user-2",
          repositoryUserId: "user-2",
          repository: "other/private",
          githubEvent: "issues",
          githubAction: "opened",
          senderLogin: "other",
          resourceNumber: 7,
          receivedAt,
        },
      ],
      [
        {
          id: "job-1",
          eventId: "event-1",
          status: "succeeded",
          attemptCount: 1,
          lastErrorCode: null,
          lastErrorMessage: null,
        },
      ],
      [{ eventId: "event-1", matched: true }],
      [
        {
          id: "action-1",
          eventId: "event-1",
          userId: "user-1",
          type: "slack_notify",
          status: "succeeded",
          attemptCount: 1,
          lastErrorCode: null,
          lastErrorMessage: null,
          completedAt: receivedAt,
        },
        {
          id: "action-2",
          eventId: "event-1",
          userId: "user-2",
          type: "github_add_label",
          status: "succeeded",
          attemptCount: 1,
          lastErrorCode: null,
          lastErrorMessage: null,
          completedAt: receivedAt,
        },
      ],
      [
        {
          eventId: "event-1",
          userId: "user-1",
          status: "succeeded",
          model: "gemini-2.5-flash",
          promptVersion: 1,
          summary: "A concise summary.",
          priority: "high",
          suggestedLabel: "bug",
          lastErrorMessage: null,
        },
      ],
    );

    expect(events).toHaveLength(1);
    expect(events[0]?.repository).toBe("owner/repository");
    expect(events[0]?.actions.map((action) => action.id)).toEqual([
      "action-1",
    ]);
    expect(events[0]?.aiEnrichment?.summary).toBe("A concise summary.");
  });

  it("provides safe defaults before a job or rule evaluation exists", () => {
    const events = assembleDashboardEvents(
      "user-1",
      [
        {
          id: "event-1",
          userId: "user-1",
          repositoryUserId: "user-1",
          repository: "owner/repository",
          githubEvent: "pull_request",
          githubAction: "opened",
          senderLogin: null,
          resourceNumber: 9,
          receivedAt,
        },
      ],
      [],
      [],
      [],
    );

    expect(events[0]).toMatchObject({
      jobStatus: "not_scheduled",
      jobAttemptCount: 0,
      jobErrorCode: null,
      canManuallyRetry: false,
      matchedRules: 0,
      evaluatedRules: 0,
      actions: [],
      aiEnrichment: null,
    });
  });
});
