import { z } from "zod";

const titleConditionSchema = z.object({
  field: z.literal("title"),
  operator: z.literal("contains_case_insensitive"),
  value: z.string().min(1).max(200),
});

const authorConditionSchema = z.object({
  field: z.literal("author"),
  operator: z.literal("equals_case_insensitive"),
  value: z.string().min(1).max(255),
});

const labelConditionSchema = z.object({
  field: z.literal("label"),
  operator: z.enum(["present", "absent"]),
  value: z.string().min(1).max(100),
});

export const ruleConditionsSchema = z
  .array(
    z.union([
      titleConditionSchema,
      authorConditionSchema,
      labelConditionSchema,
    ]),
  )
  .min(1)
  .max(10);

export const ruleActionsSchema = z
  .array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("github_add_label"),
        config: z.object({ label: z.string().min(1).max(100) }),
      }),
      z.object({
        type: z.literal("slack_notify"),
        config: z.object({ template: z.literal("default") }),
      }),
    ]),
  )
  .min(1)
  .max(5);

const resourceSchema = z.object({
  title: z.string().max(1000),
  user: z.object({ login: z.string().min(1).max(255) }),
  labels: z
    .array(z.object({ name: z.string().min(1).max(100) }))
    .max(100),
});

const issuePayloadSchema = z.object({ issue: resourceSchema });
const pullRequestPayloadSchema = z.object({ pull_request: resourceSchema });

export class InvalidEventPayloadError extends Error {
  constructor() {
    super("invalid_event_payload");
  }
}

export type RuleInput = {
  title: string;
  author: string;
  labels: string[];
};

export function toRuleInput(
  eventType: string,
  payload: unknown,
): RuleInput {
  const result =
    eventType === "issues"
      ? issuePayloadSchema.safeParse(payload)
      : eventType === "pull_request"
        ? pullRequestPayloadSchema.safeParse(payload)
        : undefined;

  if (!result?.success) {
    throw new InvalidEventPayloadError();
  }

  const resource =
    eventType === "issues"
      ? (result.data as z.infer<typeof issuePayloadSchema>).issue
      : (result.data as z.infer<typeof pullRequestPayloadSchema>).pull_request;

  return {
    title: resource.title,
    author: resource.user.login,
    labels: resource.labels.map(({ name }) => name),
  };
}

export function evaluateConditions(
  input: RuleInput,
  conditionsValue: unknown,
) {
  const conditions = ruleConditionsSchema.parse(conditionsValue);
  const normalizedLabels = new Set(
    input.labels.map((label) => label.toLocaleLowerCase()),
  );

  const results = conditions.map((condition) => {
    const expected = condition.value.toLocaleLowerCase();
    let matched: boolean;

    if (condition.field === "title") {
      matched = input.title.toLocaleLowerCase().includes(expected);
    } else if (condition.field === "author") {
      matched = input.author.toLocaleLowerCase() === expected;
    } else {
      const isPresent = normalizedLabels.has(expected);
      matched = condition.operator === "present" ? isPresent : !isPresent;
    }

    return {
      field: condition.field,
      operator: condition.operator,
      expected: condition.value,
      matched,
    };
  });

  return {
    matched: results.every((result) => result.matched),
    conditions: results,
  };
}
