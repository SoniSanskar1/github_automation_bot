"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createRule,
  setRuleEnabled,
  updateRule,
} from "@/modules/rules/management";
import { parseRuleFormData } from "@/modules/rules/rule-input";

async function getAuthenticatedUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id;
}

function finish(result: string): never {
  revalidatePath("/dashboard");
  redirect(`/dashboard?rule_result=${result}#rules`);
}

export async function createRuleAction(formData: FormData) {
  const userId = await getAuthenticatedUserId();
  if (!userId) finish("authentication_required");

  try {
    const created = await createRule(userId, parseRuleFormData(formData));
    finish(created ? "created" : "not_authorized");
  } catch (error) {
    if (error instanceof z.ZodError) finish("invalid");
    throw error;
  }
}

export async function updateRuleAction(formData: FormData) {
  const userId = await getAuthenticatedUserId();
  if (!userId) finish("authentication_required");

  try {
    const updated = await updateRule(userId, parseRuleFormData(formData));
    finish(updated ? "updated" : "not_authorized");
  } catch (error) {
    if (error instanceof z.ZodError) finish("invalid");
    throw error;
  }
}

export async function toggleRuleAction(formData: FormData) {
  const userId = await getAuthenticatedUserId();
  if (!userId) finish("authentication_required");

  const result = z
    .object({
      ruleId: z.string().uuid(),
      isEnabled: z.enum(["true", "false"]),
    })
    .safeParse({
      ruleId: formData.get("ruleId"),
      isEnabled: formData.get("isEnabled"),
    });

  if (!result.success) finish("invalid");

  const updated = await setRuleEnabled(
    userId,
    result.data.ruleId,
    result.data.isEnabled === "true",
  );
  finish(updated ? "status_updated" : "not_authorized");
}
