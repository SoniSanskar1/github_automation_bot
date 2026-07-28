import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { getDatabase } from "@/db/client";
import { automationRules, repositories } from "@/db/schema";
import {
  ruleActionsSchema,
  ruleConditionsSchema,
} from "@/modules/rules/engine";
import {
  buildRuleConfiguration,
  createRuleIdentity,
  type RuleFormInput,
} from "@/modules/rules/rule-input";

export type ManagedRule = {
  id: string;
  repositoryId: string;
  repository: string;
  name: string;
  description: string | null;
  eventType: string;
  eventAction: string;
  titleKeyword: string | null;
  label: string | null;
  sendSlack: boolean;
  version: number;
  isEnabled: boolean;
  isEditable: boolean;
};

function toManagedRule(
  row: Omit<
    ManagedRule,
    "titleKeyword" | "label" | "sendSlack" | "isEditable"
  > & { conditions: unknown; actions: unknown },
): ManagedRule {
  const conditions = ruleConditionsSchema.safeParse(row.conditions);
  const actions = ruleActionsSchema.safeParse(row.actions);
  const titleCondition = conditions.success
    ? conditions.data.find((condition) => condition.field === "title")
    : undefined;
  const labelAction = actions.success
    ? actions.data.find((action) => action.type === "github_add_label")
    : undefined;

  return {
    id: row.id,
    repositoryId: row.repositoryId,
    repository: row.repository,
    name: row.name,
    description: row.description,
    eventType: row.eventType,
    eventAction: row.eventAction,
    titleKeyword: titleCondition?.value ?? null,
    label: labelAction?.config.label ?? null,
    sendSlack:
      actions.success &&
      actions.data.some((action) => action.type === "slack_notify"),
    version: row.version,
    isEnabled: row.isEnabled,
    isEditable:
      conditions.success &&
      conditions.data.length === 1 &&
      Boolean(titleCondition) &&
      actions.success &&
      Boolean(labelAction) &&
      (row.eventType === "issues" || row.eventType === "pull_request") &&
      row.eventAction === "opened",
  };
}

export async function listRulesForUser(userId: string) {
  const rows = await getDatabase()
    .select({
      id: automationRules.id,
      repositoryId: automationRules.repositoryId,
      repository: repositories.fullName,
      name: automationRules.name,
      description: automationRules.description,
      eventType: automationRules.eventType,
      eventAction: automationRules.eventAction,
      conditions: automationRules.conditions,
      actions: automationRules.actions,
      version: automationRules.version,
      isEnabled: automationRules.isEnabled,
    })
    .from(automationRules)
    .innerJoin(repositories, eq(automationRules.repositoryId, repositories.id))
    .where(
      and(
        eq(automationRules.userId, userId),
        eq(repositories.userId, userId),
      ),
    )
    .orderBy(repositories.fullName, automationRules.name);

  return rows.map(toManagedRule);
}

async function ownsActiveRepository(userId: string, repositoryId: string) {
  const [ownedRepository] = await getDatabase()
    .select({ id: repositories.id })
    .from(repositories)
    .where(
      and(
        eq(repositories.id, repositoryId),
        eq(repositories.userId, userId),
        eq(repositories.isActive, true),
      ),
    )
    .limit(1);

  return Boolean(ownedRepository);
}

export async function createRule(userId: string, input: RuleFormInput) {
  if (!(await ownsActiveRepository(userId, input.repositoryId))) {
    return "not_authorized" as const;
  }

  const configuration = buildRuleConfiguration(input);
  return getDatabase().transaction(async (transaction) => {
    const ruleIdentity = createRuleIdentity(
      userId,
      input.repositoryId,
      input.name,
    );

    // Serialize the duplicate check without adding a destructive migration for
    // databases that may already contain duplicate test rows.
    await transaction.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${ruleIdentity}, 0))`,
    );

    const [existingRule] = await transaction
      .select({ id: automationRules.id })
      .from(automationRules)
      .where(
        and(
          eq(automationRules.userId, userId),
          eq(automationRules.repositoryId, input.repositoryId),
          sql`lower(${automationRules.name}) = ${input.name.toLowerCase()}`,
        ),
      )
      .limit(1);

    if (existingRule) {
      return "duplicate" as const;
    }

    await transaction.insert(automationRules).values({
      userId,
      repositoryId: input.repositoryId,
      name: input.name,
      description: input.description,
      eventType: input.eventType,
      eventAction: input.eventAction,
      conditions: configuration.conditions,
      actions: configuration.actions,
    });

    return "created" as const;
  });
}

export async function updateRule(userId: string, input: RuleFormInput) {
  if (
    !input.ruleId ||
    !(await ownsActiveRepository(userId, input.repositoryId))
  ) {
    return false;
  }

  const configuration = buildRuleConfiguration(input);
  const [updatedRule] = await getDatabase()
    .update(automationRules)
    .set({
      repositoryId: input.repositoryId,
      name: input.name,
      description: input.description,
      eventType: input.eventType,
      eventAction: input.eventAction,
      conditions: configuration.conditions,
      actions: configuration.actions,
      version: sql`${automationRules.version} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(automationRules.id, input.ruleId),
        eq(automationRules.userId, userId),
      ),
    )
    .returning({ id: automationRules.id });

  return Boolean(updatedRule);
}

export async function setRuleEnabled(
  userId: string,
  ruleId: string,
  isEnabled: boolean,
) {
  const [updatedRule] = await getDatabase()
    .update(automationRules)
    .set({
      isEnabled,
      version: sql`${automationRules.version} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(automationRules.id, ruleId),
        eq(automationRules.userId, userId),
      ),
    )
    .returning({ id: automationRules.id });

  return Boolean(updatedRule);
}
