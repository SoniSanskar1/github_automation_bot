import { retryJobAction } from "@/app/dashboard/jobs/actions";
import { PendingSubmitButton } from "@/components/dashboard/pending-submit-button";
import type {
  DashboardAction,
  DashboardEvent,
} from "@/modules/audit/dashboard-view-model";

const attentionStatuses = new Set([
  "failed",
  "unknown_outcome",
]);

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

function statusClasses(status: string) {
  if (status === "succeeded") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (attentionStatuses.has(status)) {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  if (status === "processing" || status === "retrying") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
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
    <li className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-slate-900">{humanize(action.type)}</p>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusClasses(action.status)}`}
        >
          {humanize(action.status)}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        {action.attemptCount} {action.attemptCount === 1 ? "attempt" : "attempts"}
        {action.completedAt ? ` · Completed ${formatDate(action.completedAt)} UTC` : ""}
      </p>
      {error ? (
        <p className="mt-2 text-sm text-rose-700">Failure: {error}</p>
      ) : null}
    </li>
  );
}

export function EventHistory({ events }: { events: DashboardEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="font-semibold text-slate-800">No events received yet</p>
        <p className="mt-2 text-sm text-slate-600">
          Open an issue or pull request in a connected repository. The event
          will appear here after GitHub delivers it.
        </p>
      </div>
    );
  }

  return (
    <ol className="mt-6 space-y-5" id="history">
      {events.map((event) => {
        const resource =
          event.resourceNumber === null ? "" : ` #${event.resourceNumber}`;
        const eventName = `${humanize(event.githubEvent)}${resource}`;

        return (
          <li
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            key={event.id}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-teal-700">
                  {event.repository}
                </p>
                <h3 className="mt-1 text-lg font-bold capitalize text-slate-950">
                  {eventName}
                  {event.githubAction ? ` · ${humanize(event.githubAction)}` : ""}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {event.senderLogin ? `By ${event.senderLogin} · ` : ""}
                  Received {formatDate(event.receivedAt)} UTC
                </p>
              </div>
              <span
                className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusClasses(event.jobStatus)}`}
              >
                Job: {humanize(event.jobStatus)}
              </span>
            </div>

            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-slate-500">Rules evaluated</p>
                <p className="mt-1 font-bold text-slate-900">
                  {event.evaluatedRules}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-slate-500">Rules matched</p>
                <p className="mt-1 font-bold text-slate-900">
                  {event.matchedRules}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-slate-500">Job attempts</p>
                <p className="mt-1 font-bold text-slate-900">
                  {event.jobAttemptCount}
                </p>
              </div>
            </div>

            {event.jobErrorMessage ? (
              <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                Processing failure: {event.jobErrorMessage}
              </p>
            ) : null}

            {event.aiEnrichment ? (
              <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-violet-950">
                    AI enrichment
                  </p>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusClasses(event.aiEnrichment.status)}`}
                  >
                    {humanize(event.aiEnrichment.status)}
                  </span>
                </div>
                {event.aiEnrichment.summary ? (
                  <>
                    <p className="mt-3">{event.aiEnrichment.summary}</p>
                    <p className="mt-2 text-slate-600">
                      Priority:{" "}
                      <span className="font-semibold capitalize">
                        {event.aiEnrichment.priority}
                      </span>
                      {" · "}Suggested label:{" "}
                      <span className="font-semibold">
                        {event.aiEnrichment.suggestedLabel === "none"
                          ? "None"
                          : event.aiEnrichment.suggestedLabel}
                      </span>
                    </p>
                  </>
                ) : event.aiEnrichment.lastErrorMessage ? (
                  <p className="mt-3">
                    {event.aiEnrichment.lastErrorMessage}
                  </p>
                ) : (
                  <p className="mt-3">
                    The optional AI analysis is still being prepared.
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  {event.aiEnrichment.model} · Prompt version{" "}
                  {event.aiEnrichment.promptVersion}
                </p>
                {event.aiEnrichment.notificationStatus !==
                "not_requested" ? (
                  <p className="mt-2 text-xs text-slate-600">
                    AI Slack follow-up:{" "}
                    <span className="font-semibold capitalize">
                      {humanize(
                        event.aiEnrichment.notificationStatus,
                      )}
                    </span>
                    {event.aiEnrichment.notifiedAt
                      ? ` · Sent ${formatDate(event.aiEnrichment.notifiedAt)} UTC`
                      : ""}
                    {event.aiEnrichment.notificationErrorMessage
                      ? ` · ${event.aiEnrichment.notificationErrorMessage}`
                      : ""}
                  </p>
                ) : null}
              </div>
            ) : null}

            {event.canManuallyRetry && event.jobId ? (
              <form action={retryJobAction} className="mt-4">
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
              <p className="text-sm font-semibold text-slate-800">
                Actions ({event.actions.length})
              </p>
              {event.actions.length > 0 ? (
                <ul className="mt-3 grid gap-3 lg:grid-cols-2">
                  {event.actions.map((action) => (
                    <ActionStatus action={action} key={action.id} />
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  No action was planned for this event.
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
