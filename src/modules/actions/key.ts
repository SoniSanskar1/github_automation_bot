import { createHash } from "node:crypto";

import type { RuleAction } from "@/modules/rules/engine";

export function createActionKey(input: {
  eventId: string;
  ruleId: string;
  ruleVersion: number;
  actionIndex: number;
  action: RuleAction;
}) {
  const canonicalInput = JSON.stringify({
    eventId: input.eventId,
    ruleId: input.ruleId,
    ruleVersion: input.ruleVersion,
    actionIndex: input.actionIndex,
    action: input.action,
  });

  return createHash("sha256").update(canonicalInput).digest("hex");
}
