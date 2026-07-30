import { retryJobAction } from "@/app/dashboard/jobs/actions";
import { PendingSubmitButton } from "@/components/dashboard/pending-submit-button";
import type {
  DashboardAction,
  DashboardEvent,
} from "@/modules/audit/dashboard-view-model";

const attentionStatuses = new Set(["failed", "unknown_outcome"]);

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

function statusClasses(status: string) {
  if (status === "succeeded") {
    return "border-emerald-300/30 bg-emerald-300/10 text-[#4edea3]";
  }

  if (attentionStatuses.has(status)) {
    return "border-rose-300/30 bg-rose-300/10 text-[#ff9f98]";
  }

  if (status === "processing" || status === "retrying") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-200";
  }

  return "border-[#344259] bg-[#172137] text-[#9ba9bc]";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(value);
}

function ActionStatus({ action }: { action: DashboardAction }) {
  const error = action.lastErrorMessage ?? action.lastErrorCode;

  return (
    <li
      className={`rounded-md border bg-[#0b1326]/70 p-4 ${
        attentionStatuses.has(action.status)
          ? "border-rose-300/25"
          : "border-[#26334a]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-code text-sm font-semibold text-[#e1e7fb]">
          {humanize(action.type)}
        </p>
        <span
          className={`rounded border px-2.5 py-1 text-[10px] font-bold capitalize ${statusClasses(action.status)}`}
        >
          {humanize(action.status)}
        </span>
      </div>
      <p className="mt-2 text-xs text-[#758399]">
        {action.attemptCount} {action.attemptCount === 1 ? "attempt" : "attempts"}
        {action.completedAt
          ? ` · Completed ${formatDate(action.completedAt)} UTC`
          : ""}
      </p>
      {error ? (
        <p className="mt-3 border-t border-rose-300/10 pt-3 text-xs text-[#ff9f98]">
          Failure: {error}
        </p>
      ) : null}
    </li>
  );
}

export function EventHistory({ events }: { events: DashboardEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-[#344259] bg-[#0b1326]/60 px-6 py-12 text-center">
        <p className="font-semibold text-[#e1e7fb]">No events received yet</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-[#8f9db0]">
          Open an issue or pull request in a connected repository. The event
          will appear here after GitHub delivers it.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative mt-7 space-y-5 before:absolute before:inset-y-0 before:left-[5px] before:w-px before:bg-[#26334a]">
      {events.map((event) => {
        const resource =
          event.resourceNumber === null ? "" : ` #${event.resourceNumber}`;
        const eventName = `${humanize(event.githubEvent)}${resource}`;
        const needsAttention = attentionStatuses.has(event.jobStatus);

        return (
          <li className="relative pl-7" key={event.id}>
            <span
              aria-hidden="true"
              className={`absolute left-0 top-7 h-[11px] w-[11px] rounded-full ring-4 ring-[#060b18] ${
                needsAttention ? "bg-[#ff9f98]" : "bg-[#4edea3]"
              }`}
            />
            <article
              className={`glass-panel glass-panel-interactive rounded-lg p-5 sm:p-6 ${
                needsAttention ? "border-rose-300/25" : ""
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="font-code truncate text-xs font-semibold text-[#4edea3] sm:text-sm">
                    {event.repository}
                  </p>
                  <h3 className="font-code mt-1 text-base font-bold capitalize text-[#e1e7fb] sm:text-lg">
                    {eventName}
                    {event.githubAction
                      ? ` · ${humanize(event.githubAction)}`
                      : ""}
                  </h3>
                  <p className="mt-2 text-xs text-[#8f9db0] sm:text-sm">
                    {event.senderLogin ? `By ${event.senderLogin} · ` : ""}
                    Received {formatDate(event.receivedAt)} UTC
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${statusClasses(event.jobStatus)}`}
                >
                  Job: {humanize(event.jobStatus)}
                </span>
              </div>

              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                {[
                  ["Rules evaluated", event.evaluatedRules],
                  ["Rules matched", event.matchedRules],
                  ["Job attempts", event.jobAttemptCount],
                ].map(([label, value]) => (
                  <div
                    className="rounded-md border border-[#26334a] bg-[#0b1326]/70 p-4"
                    key={label}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#758399]">
                      {label}
                    </p>
                    <p className="font-code mt-2 text-lg font-bold text-[#e1e7fb]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {event.jobErrorMessage ? (
                <div className="mt-5 rounded-md border border-rose-300/25 bg-rose-300/10 p-4">
                  <p className="font-semibold text-[#ff9f98]">
                    Processing failure
                  </p>
                  <p className="mt-1 text-sm text-rose-200/80">
                    {event.jobErrorMessage}
                  </p>
                </div>
              ) : null}

              {event.aiEnrichment ? (
                <div className="mt-5 rounded-md border border-violet-300/20 bg-violet-300/[0.06] p-4 text-sm text-[#bac5d4] sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-violet-200">
                      ✦ AI enrichment
                    </p>
                    <span
                      className={`rounded border px-2.5 py-1 text-[10px] font-bold capitalize ${statusClasses(event.aiEnrichment.status)}`}
                    >
                      {humanize(event.aiEnrichment.status)}
                    </span>
                  </div>
                  {event.aiEnrichment.summary ? (
                    <>
                      <p className="mt-4 leading-6">
                        {event.aiEnrichment.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded border border-[#344259] px-2.5 py-1 text-xs">
                          Priority:{" "}
                          <strong className="capitalize">
                            {event.aiEnrichment.priority}
                          </strong>
                        </span>
                        <span className="rounded border border-[#344259] px-2.5 py-1 text-xs">
                          Suggested label:{" "}
                          <strong>
                            {event.aiEnrichment.suggestedLabel === "none"
                              ? "None"
                              : event.aiEnrichment.suggestedLabel}
                          </strong>
                        </span>
                      </div>
                    </>
                  ) : event.aiEnrichment.lastErrorMessage ? (
                    <p className="mt-4">{event.aiEnrichment.lastErrorMessage}</p>
                  ) : (
                    <p className="mt-4">
                      The optional AI analysis is still being prepared.
                    </p>
                  )}
                  <div className="mt-4 flex flex-col gap-2 border-t border-violet-300/10 pt-3 text-xs text-[#758399] sm:flex-row sm:justify-between">
                    <span>
                      {event.aiEnrichment.model} · Prompt version{" "}
                      {event.aiEnrichment.promptVersion}
                    </span>
                    {event.aiEnrichment.notificationStatus !==
                    "not_requested" ? (
                      <span>
                        AI Slack follow-up:{" "}
                        <strong className="capitalize text-[#bac5d4]">
                          {humanize(
                            event.aiEnrichment.notificationStatus,
                          )}
                        </strong>
                        {event.aiEnrichment.notifiedAt
                          ? ` · Sent ${formatDate(event.aiEnrichment.notifiedAt)} UTC`
                          : ""}
                        {event.aiEnrichment.notificationErrorMessage
                          ? ` · ${event.aiEnrichment.notificationErrorMessage}`
                          : ""}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {event.canManuallyRetry && event.jobId ? (
                <form action={retryJobAction} className="mt-5">
                  <input name="jobId" type="hidden" value={event.jobId} />
                  <PendingSubmitButton
                    pendingLabel="Scheduling retry…"
                    variant="secondary"
                  >
                    Retry temporary failure once
                  </PendingSubmitButton>
                </form>
              ) : null}

              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#9ba9bc]">
                  Actions ({event.actions.length})
                </p>
                {event.actions.length > 0 ? (
                  <ul className="mt-3 grid gap-3 lg:grid-cols-2">
                    {event.actions.map((action) => (
                      <ActionStatus action={action} key={action.id} />
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-md border border-dashed border-[#344259] bg-[#0b1326]/50 px-4 py-5 text-center text-sm text-[#758399]">
                    No action was planned for this event.
                  </p>
                )}
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
