import { z } from "zod";

const ruleFormSchema = z.object({
  ruleId: z.string().uuid().optional(),
  repositoryId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  eventType: z.enum(["issues", "pull_request"]),
  titleKeyword: z.string().trim().min(1).max(200),
  label: z.string().trim().min(1).max(100),
  sendSlack: z.literal("on").optional(),
});

export type RuleFormInput = {
  ruleId?: string;
  repositoryId: string;
  name: string;
  description: string | null;
  eventType: "issues" | "pull_request";
  eventAction: "opened";
  titleKeyword: string;
  label: string;
  sendSlack: boolean;
};

export function parseRuleFormData(formData: FormData): RuleFormInput {
  const result = ruleFormSchema.parse({
    ruleId: formData.get("ruleId") || undefined,
    repositoryId: formData.get("repositoryId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    eventType: formData.get("eventType"),
    titleKeyword: formData.get("titleKeyword"),
    label: formData.get("label"),
    sendSlack: formData.get("sendSlack") || undefined,
  });

  return {
    ...result,
    description: result.description || null,
    eventAction: "opened",
    sendSlack: result.sendSlack === "on",
  };
}

export function buildRuleConfiguration(input: RuleFormInput) {
  return {
    conditions: [
      {
        field: "title" as const,
        operator: "contains_case_insensitive" as const,
        value: input.titleKeyword,
      },
    ],
    actions: [
      {
        type: "github_add_label" as const,
        config: { label: input.label },
      },
      ...(input.sendSlack
        ? [
            {
              type: "slack_notify" as const,
              config: { template: "default" as const },
            },
          ]
        : []),
    ],
  };
}

export function createRuleIdentity(
  userId: string,
  repositoryId: string,
  name: string,
) {
  return `${userId}:${repositoryId}:${name.trim().toLowerCase()}`;
}
