import { redirect } from "next/navigation";

import { DashboardNotice } from "@/components/dashboard/dashboard-notice";
import { RuleManager } from "@/components/dashboard/rule-manager";
import { getCurrentUser } from "@/modules/auth/current-user";
import { listRepositoriesForUser } from "@/modules/github/repository-sync";
import { listRulesForUser } from "@/modules/rules/management";

export const dynamic = "force-dynamic";

const ruleMessages: Record<string, string> = {
  created: "Automation rule created.",
  duplicate: "A rule with this name already exists for the repository.",
  updated: "Automation rule updated.",
  status_updated: "Automation rule status updated.",
  invalid: "The rule contains invalid or missing values.",
  not_authorized: "The repository or rule is not available to this account.",
  authentication_required: "Sign in again before changing automation rules.",
};

type RulesPageProps = {
  searchParams: Promise<{
    rule_result?: string;
  }>;
};

export default async function RulesPage({ searchParams }: RulesPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/?auth_error=authentication_required");
  }

  const [repositories, rules, parameters] = await Promise.all([
    listRepositoriesForUser(user.id),
    listRulesForUser(user.id),
    searchParams,
  ]);
  const ruleResult = parameters.rule_result;

  return (
    <>
      {ruleResult && ruleMessages[ruleResult] ? (
        <DashboardNotice
          message={ruleMessages[ruleResult]}
          successful={["created", "updated", "status_updated"].includes(
            ruleResult,
          )}
        />
      ) : null}
      <RuleManager repositories={repositories} rules={rules} />
    </>
  );
}
