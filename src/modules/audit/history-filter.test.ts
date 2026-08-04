import { describe, expect, it } from "vitest";

import { filterHistoryEvents } from "./history-filter";

const events = [
  { id: "issue-1", githubEvent: "issues" },
  { id: "pr-1", githubEvent: "pull_request" },
  { id: "issue-2", githubEvent: "issues" },
];

describe("filterHistoryEvents", () => {
  it("keeps every event for the default filter", () => {
    expect(filterHistoryEvents(events, "all")).toEqual(events);
  });

  it("shows only issue events", () => {
    expect(filterHistoryEvents(events, "issues").map(({ id }) => id)).toEqual([
      "issue-1",
      "issue-2",
    ]);
  });

  it("shows only pull request events", () => {
    expect(
      filterHistoryEvents(events, "pull_request").map(({ id }) => id),
    ).toEqual(["pr-1"]);
  });
});
