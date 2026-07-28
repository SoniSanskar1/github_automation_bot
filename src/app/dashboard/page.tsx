import { redirect } from "next/navigation";

import { EventHistory } from "@/components/dashboard/event-history";
import { HistoryRefresh } from "@/components/dashboard/history-refresh";
import { RuleManager } from "@/components/dashboard/rule-manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getDashboardOverview,
  listDashboardEvents,
} from "@/modules/audit/dashboard-history";
import { listRepositoriesForUser } from "@/modules/github/repository-sync";
import { listRulesForUser } from "@/modules/rules/management";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{
    github_connection?: string;
    rule_result?: string;
    job_result?: string;
  }>;
};

const connectionMessages: Record<string, string> = {
  success: "GitHub App connected and repositories synchronized.",
  invalid_state: "The installation request expired. Please try again.",
  authorization_missing: "GitHub authorization was not completed.",
  installation_not_found: "No accessible GitHub App installation was found.",
  failed: "GitHub connection failed. Please try again.",
};

const ruleMessages: Record<string, string> = {
  created: "Automation rule created.",
  duplicate: "A rule with this name already exists for the repository.",
  updated: "Automation rule updated.",
  status_updated: "Automation rule status updated.",
  invalid: "The rule contains invalid or missing values.",
  not_authorized: "The repository or rule is not available to this account.",
  authentication_required: "Sign in again before changing automation rules.",
};

const jobMessages: Record<string, string> = {
  retry_scheduled: "The temporary failure is queued for one more attempt.",
  not_retryable:
    "This job is already queued or its failure is not safe to retry.",
  not_available: "The processing job is not available to this account.",
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth_error=authentication_required");
  }

  const [repositories, overview, events, rules] = await Promise.all([
    listRepositoriesForUser(user.id),
    getDashboardOverview(user.id),
    listDashboardEvents(user.id),
    listRulesForUser(user.id),
  ]);
  const parameters = await searchParams;
  const connectionResult = parameters.github_connection;
  const ruleResult = parameters.rule_result;
  const jobResult = parameters.job_result;
  const connectionMessage = connectionResult
    ? connectionMessages[connectionResult]
    : undefined;
  const githubLogin =
    typeof user.user_metadata.user_name === "string"
      ? user.user_metadata.user_name
      : typeof user.user_metadata.preferred_username === "string"
        ? user.user_metadata.preferred_username
        : "GitHub user";

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-12 sm:px-10">
      <header className="flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
            RepoPilot dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Welcome, {githubLogin}
          </h1>
          <p className="mt-2 text-slate-600">
            Monitor GitHub events, matched rules, and automated actions.
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <button
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </header>

      {connectionMessage ? (
        <p
          className={`mt-8 rounded-2xl border px-5 py-4 text-sm ${
            connectionResult === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {connectionMessage}
        </p>
      ) : null}

      {ruleResult && ruleMessages[ruleResult] ? (
        <p
          className={`mt-8 rounded-2xl border px-5 py-4 text-sm ${
            ["created", "updated", "status_updated"].includes(ruleResult)
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {ruleMessages[ruleResult]}
        </p>
      ) : null}

      {jobResult && jobMessages[jobResult] ? (
        <p
          className={`mt-8 rounded-2xl border px-5 py-4 text-sm ${
            jobResult === "retry_scheduled"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {jobMessages[jobResult]}
        </p>
      ) : null}

      <section className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Repositories", overview.repositories],
          ["Active rules", overview.activeRules],
          ["Events today", overview.eventsToday],
          ["Successful actions", overview.successfulActions],
          ["Need attention", overview.actionsNeedingAttention],
        ].map(([label, value]) => (
          <article
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            key={label}
          >
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
          </article>
        ))}
      </section>

      <RuleManager repositories={repositories} rules={rules} />

      <section className="mt-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              Recent automation history
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              The newest 25 accepted events and their persisted processing
              results.
            </p>
          </div>
          <HistoryRefresh />
        </div>
        <EventHistory events={events} />
      </section>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Connected repositories
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              GitHub controls which repositories RepoPilot can access.
            </p>
          </div>
          <form action="/api/github/install/start" method="post">
            <button
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              type="submit"
            >
              {repositories.length > 0
                ? "Manage GitHub access"
                : "Install GitHub App"}
            </button>
          </form>
        </div>

        {repositories.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
            No repositories are connected yet. Install the GitHub App and
            choose one or more repositories.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-slate-200">
            {repositories.map((repository) => (
              <li
                className="flex items-center justify-between gap-4 py-4"
                key={repository.id}
              >
                <div>
                  <p className="font-semibold text-slate-950">
                    {repository.fullName}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Default branch: {repository.defaultBranch}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {repository.isPrivate ? "Private" : "Public"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
