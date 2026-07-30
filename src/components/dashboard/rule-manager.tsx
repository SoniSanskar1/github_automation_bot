import {
  createRuleAction,
  toggleRuleAction,
  updateRuleAction,
} from "@/app/dashboard/rules/actions";
import { PendingSubmitButton } from "@/components/dashboard/pending-submit-button";
import type { ManagedRule } from "@/modules/rules/management";

type RepositoryOption = {
  id: string;
  fullName: string;
};

type RuleFieldsProps = {
  repositories: RepositoryOption[];
  rule?: ManagedRule;
};

const inputClasses =
  "mt-2 w-full rounded-md border border-[#344259] bg-[#060b18] px-3 py-2.5 text-sm text-[#e1e7fb] placeholder:text-[#59677c] focus:border-[#4edea3] focus:outline-none focus:ring-2 focus:ring-emerald-300/10";

function RuleFields({ repositories, rule }: RuleFieldsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rule ? <input name="ruleId" type="hidden" value={rule.id} /> : null}

      <label className="text-sm font-medium text-[#bac5d4]">
        Rule name
        <input
          className={inputClasses}
          defaultValue={rule?.name}
          maxLength={100}
          name="name"
          placeholder="Bug issue triage"
          required
        />
      </label>

      <label className="text-sm font-medium text-[#bac5d4]">
        Repository
        <select
          className={inputClasses}
          defaultValue={rule?.repositoryId}
          name="repositoryId"
          required
        >
          {repositories.map((repository) => (
            <option key={repository.id} value={repository.id}>
              {repository.fullName}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium text-[#bac5d4]">
        GitHub event
        <select
          className={inputClasses}
          defaultValue={rule?.eventType ?? "issues"}
          name="eventType"
          required
        >
          <option value="issues">Issue opened</option>
          <option value="pull_request">Pull request opened</option>
        </select>
      </label>

      <label className="text-sm font-medium text-[#bac5d4]">
        Title contains
        <input
          className={inputClasses}
          defaultValue={rule?.titleKeyword ?? ""}
          maxLength={200}
          name="titleKeyword"
          placeholder="bug"
          required
        />
      </label>

      <label className="text-sm font-medium text-[#bac5d4]">
        Label to add
        <input
          className={inputClasses}
          defaultValue={rule?.label ?? ""}
          maxLength={100}
          name="label"
          placeholder="bug"
          required
        />
      </label>

      <label className="flex items-center gap-3 self-end rounded-md border border-[#26334a] bg-[#0b1326] px-4 py-3 text-sm font-medium text-[#bac5d4]">
        <input
          className="h-4 w-4 accent-[#10b981]"
          defaultChecked={rule?.sendSlack ?? true}
          name="sendSlack"
          type="checkbox"
        />
        Send a Slack notification
      </label>

      <label className="text-sm font-medium text-[#bac5d4] md:col-span-2">
        Description (optional)
        <textarea
          className={inputClasses}
          defaultValue={rule?.description ?? ""}
          maxLength={500}
          name="description"
          placeholder="Explain what this automation is for."
          rows={2}
        />
      </label>
    </div>
  );
}

export function RuleManager({
  repositories,
  rules,
}: {
  repositories: RepositoryOption[];
  rules: ManagedRule[];
}) {
  return (
    <section id="rules">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Rule configuration</p>
          <h2 className="font-display mt-2 text-3xl font-bold text-[#e1e7fb]">
            Automation rules
          </h2>
          <p className="mt-2 text-sm text-[#8f9db0]">
            Match an opened issue or pull request by title, add a label, and
            optionally notify Slack.
          </p>
        </div>
        <a
          className="w-fit rounded-full border border-emerald-300/20 px-4 py-2 text-xs font-bold text-[#4edea3] transition hover:bg-emerald-300/10"
          href="#create-rule"
        >
          + Create a new rule
        </a>
      </div>

      {repositories.length > 0 ? (
        <details className="glass-panel mt-6 rounded-lg" id="create-rule">
          <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-[#4edea3] marker:hidden sm:px-6">
            <span aria-hidden="true" className="mr-2">
              +
            </span>
            Create a new rule
          </summary>
          <form
            action={createRuleAction}
            className="border-t border-[#26334a] px-5 py-6 sm:px-6"
          >
            <RuleFields repositories={repositories} />
            <div className="mt-5">
              <PendingSubmitButton pendingLabel="Creating…">
                Create rule
              </PendingSubmitButton>
            </div>
          </form>
        </details>
      ) : (
        <p className="mt-6 rounded-md border border-dashed border-[#344259] bg-[#0b1326] p-5 text-sm text-[#8f9db0]">
          Connect a repository before creating a rule.
        </p>
      )}

      {rules.length === 0 ? (
        <p className="mt-6 rounded-md border border-dashed border-[#344259] p-8 text-center text-sm text-[#8f9db0]">
          No automation rules exist yet.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {rules.map((rule) => (
            <li
              className={`glass-panel glass-panel-interactive rounded-lg p-5 sm:p-6 ${
                rule.isEnabled ? "" : "opacity-75"
              }`}
              key={rule.id}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-xl font-bold text-[#e1e7fb]">
                      {rule.name}
                    </h3>
                    <span
                      className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        rule.isEnabled
                          ? "border-emerald-300/20 bg-emerald-300/10 text-[#4edea3]"
                          : "border-[#344259] bg-[#172137] text-[#8f9db0]"
                      }`}
                    >
                      {rule.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                    <span className="font-code text-xs text-[#758399]">
                      Version {rule.version}
                    </span>
                  </div>
                  <p className="font-code mt-3 text-sm text-[#9ba9bc]">
                    {rule.repository}{" "}
                    <span className="px-1 text-[#4b586c]">·</span>{" "}
                    {rule.eventType === "issues" ? "Issue" : "Pull request"}{" "}
                    opened
                  </p>
                </div>

                <form action={toggleRuleAction}>
                  <input name="ruleId" type="hidden" value={rule.id} />
                  <input
                    name="isEnabled"
                    type="hidden"
                    value={String(!rule.isEnabled)}
                  />
                  <PendingSubmitButton
                    pendingLabel={
                      rule.isEnabled ? "Disabling…" : "Enabling…"
                    }
                    variant="secondary"
                  >
                    {rule.isEnabled ? "Disable" : "Enable"}
                  </PendingSubmitButton>
                </form>
              </div>

              <div className="mt-5 rounded-md border border-[#26334a] bg-[#060b18]/60 p-4">
                {rule.isEditable ? (
                  <p className="font-code text-sm text-[#4edea3]">
                    Title contains “{rule.titleKeyword}” → add “{rule.label}”
                    {rule.sendSlack ? " + notify Slack" : ""}
                  </p>
                ) : (
                  <p className="text-sm text-amber-200">
                    This advanced rule remains active but cannot be edited in
                    the simple form.
                  </p>
                )}
                {rule.description ? (
                  <p className="mt-2 text-sm italic text-[#8f9db0]">
                    {rule.description}
                  </p>
                ) : null}
              </div>

              {rule.isEditable ? (
                <details className="mt-5 border-t border-[#26334a] pt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-[#4edea3]">
                    ✎ Edit rule
                  </summary>
                  <form action={updateRuleAction} className="mt-5">
                    <RuleFields repositories={repositories} rule={rule} />
                    <div className="mt-5">
                      <PendingSubmitButton pendingLabel="Saving…">
                        Save changes
                      </PendingSubmitButton>
                    </div>
                  </form>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
