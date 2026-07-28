import {
  createRuleAction,
  toggleRuleAction,
  updateRuleAction,
} from "@/app/dashboard/rules/actions";
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
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";

function RuleFields({ repositories, rule }: RuleFieldsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rule ? <input name="ruleId" type="hidden" value={rule.id} /> : null}

      <label className="text-sm font-medium text-slate-700">
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

      <label className="text-sm font-medium text-slate-700">
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

      <label className="text-sm font-medium text-slate-700">
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

      <label className="text-sm font-medium text-slate-700">
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

      <label className="text-sm font-medium text-slate-700">
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

      <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
        <input
          defaultChecked={rule?.sendSlack ?? true}
          name="sendSlack"
          type="checkbox"
        />
        Send a Slack notification
      </label>

      <label className="text-sm font-medium text-slate-700 md:col-span-2">
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
    <section
      className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      id="rules"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
          Rule configuration
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Automation rules
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Match an opened issue or pull request by title, add a label, and
          optionally notify Slack.
        </p>
      </div>

      {repositories.length > 0 ? (
        <details className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5">
          <summary className="cursor-pointer font-semibold text-teal-900">
            Create a new rule
          </summary>
          <form action={createRuleAction} className="mt-5">
            <RuleFields repositories={repositories} />
            <button
              className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              type="submit"
            >
              Create rule
            </button>
          </form>
        </details>
      ) : (
        <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
          Connect a repository before creating a rule.
        </p>
      )}

      {rules.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">
          No automation rules exist yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {rules.map((rule) => (
            <li
              className="rounded-2xl border border-slate-200 p-5"
              key={rule.id}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-950">{rule.name}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        rule.isEnabled
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {rule.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                    <span className="text-xs text-slate-500">
                      Version {rule.version}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {rule.repository} ·{" "}
                    {rule.eventType === "issues" ? "Issue" : "Pull request"}{" "}
                    opened
                  </p>
                  {rule.isEditable ? (
                    <p className="mt-1 text-sm text-slate-600">
                      Title contains “{rule.titleKeyword}” → add “{rule.label}”
                      {rule.sendSlack ? " + notify Slack" : ""}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-amber-700">
                      This advanced rule remains active but cannot be edited in
                      the simple form.
                    </p>
                  )}
                </div>

                <form action={toggleRuleAction}>
                  <input name="ruleId" type="hidden" value={rule.id} />
                  <input
                    name="isEnabled"
                    type="hidden"
                    value={String(!rule.isEnabled)}
                  />
                  <button
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    type="submit"
                  >
                    {rule.isEnabled ? "Disable" : "Enable"}
                  </button>
                </form>
              </div>

              {rule.description ? (
                <p className="mt-3 text-sm text-slate-500">
                  {rule.description}
                </p>
              ) : null}

              {rule.isEditable ? (
                <details className="mt-4 border-t border-slate-200 pt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-teal-700">
                    Edit rule
                  </summary>
                  <form action={updateRuleAction} className="mt-5">
                    <RuleFields repositories={repositories} rule={rule} />
                    <button
                      className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                      type="submit"
                    >
                      Save changes
                    </button>
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
