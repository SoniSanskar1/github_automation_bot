import { describe, expect, it } from "vitest";

import { buildRuleConfiguration, parseRuleFormData } from "./rule-input";

function validFormData() {
  const formData = new FormData();
  formData.set("repositoryId", "86b843c0-8a6c-11f1-9475-c9787e1dd816");
  formData.set("name", "  Urgent issue triage  ");
  formData.set("description", "  Adds the urgent label  ");
  formData.set("eventType", "issues");
  formData.set("titleKeyword", "  urgent  ");
  formData.set("label", "  priority-high  ");
  formData.set("sendSlack", "on");
  return formData;
}

describe("rule form input", () => {
  it("normalizes bounded form fields and checkbox state", () => {
    expect(parseRuleFormData(validFormData())).toEqual({
      repositoryId: "86b843c0-8a6c-11f1-9475-c9787e1dd816",
      name: "Urgent issue triage",
      description: "Adds the urgent label",
      eventType: "issues",
      eventAction: "opened",
      titleKeyword: "urgent",
      label: "priority-high",
      sendSlack: true,
    });
  });

  it("builds only worker-approved conditions and actions", () => {
    expect(buildRuleConfiguration(parseRuleFormData(validFormData()))).toEqual({
      conditions: [
        {
          field: "title",
          operator: "contains_case_insensitive",
          value: "urgent",
        },
      ],
      actions: [
        { type: "github_add_label", config: { label: "priority-high" } },
        { type: "slack_notify", config: { template: "default" } },
      ],
    });
  });

  it("rejects unsupported event types and empty labels", () => {
    const formData = validFormData();
    formData.set("eventType", "push");
    formData.set("label", " ");

    expect(() => parseRuleFormData(formData)).toThrow();
  });
});
