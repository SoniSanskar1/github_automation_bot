import { describe, expect, it } from "vitest";

import { evaluateConditions, toRuleInput } from "./engine";

describe("rule engine", () => {
  const input = {
    title: "Login BUG breaks mobile",
    author: "OctoCat",
    labels: ["needs-triage"],
  };

  it("matches deterministic title, author, and label conditions", () => {
    expect(
      evaluateConditions(input, [
        {
          field: "title",
          operator: "contains_case_insensitive",
          value: "bug",
        },
        {
          field: "author",
          operator: "equals_case_insensitive",
          value: "octocat",
        },
        { field: "label", operator: "present", value: "needs-triage" },
        { field: "label", operator: "absent", value: "resolved" },
      ]).matched,
    ).toBe(true);
  });

  it("reports a non-match when any condition fails", () => {
    const result = evaluateConditions(input, [
      { field: "label", operator: "present", value: "resolved" },
    ]);

    expect(result.matched).toBe(false);
    expect(result.conditions[0]?.matched).toBe(false);
  });

  it("normalizes issue payloads into safe rule input", () => {
    expect(
      toRuleInput("issues", {
        issue: {
          title: "Bug report",
          user: { login: "octocat" },
          labels: [{ name: "bug" }],
        },
      }),
    ).toEqual({
      title: "Bug report",
      author: "octocat",
      labels: ["bug"],
    });
  });
});
