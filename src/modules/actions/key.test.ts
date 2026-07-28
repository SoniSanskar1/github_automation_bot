import { describe, expect, it } from "vitest";

import { createActionKey } from "./key";

const input = {
  eventId: "event-id",
  ruleId: "rule-id",
  ruleVersion: 1,
  actionIndex: 0,
  action: {
    type: "github_add_label" as const,
    config: { label: "bug" },
  },
};

describe("action idempotency key", () => {
  it("is deterministic for the same planned action", () => {
    expect(createActionKey(input)).toBe(createActionKey(input));
    expect(createActionKey(input)).toHaveLength(64);
  });

  it("changes when the rule version or action position changes", () => {
    expect(createActionKey(input)).not.toBe(
      createActionKey({ ...input, ruleVersion: 2 }),
    );
    expect(createActionKey(input)).not.toBe(
      createActionKey({ ...input, actionIndex: 1 }),
    );
  });
});
