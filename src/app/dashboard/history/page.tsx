import { redirect } from "next/navigation";

import { DashboardNotice } from "@/components/dashboard/dashboard-notice";
import { EventHistory } from "@/components/dashboard/event-history";
import { HistoryRefresh } from "@/components/dashboard/history-refresh";
import { listDashboardEvents } from "@/modules/audit/dashboard-history";
import { getCurrentUser } from "@/modules/auth/current-user";

export const dynamic = "force-dynamic";

const jobMessages: Record<string, string> = {
  retry_scheduled: "The temporary failure is queued for one more attempt.",
  not_retryable:
    "This job is already queued or its failure is not safe to retry.",
  not_available: "The processing job is not available to this account.",
};

type HistoryPageProps = {
  searchParams: Promise<{
    job_result?: string;
  }>;
};

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/?auth_error=authentication_required");
  }

  const [events, parameters] = await Promise.all([
    listDashboardEvents(user.id),
    searchParams,
  ]);
  const jobResult = parameters.job_result;

  return (
    <>
      {jobResult && jobMessages[jobResult] ? (
        <DashboardNotice
          message={jobMessages[jobResult]}
          successful={jobResult === "retry_scheduled"}
        />
      ) : null}
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Live audit trail</p>
            <h1 className="font-display mt-2 text-4xl font-black tracking-[-0.03em] text-[#e1e7fb]">
              Automation history
            </h1>
            <p className="mt-2 text-sm text-[#8f9db0]">
              The newest 25 accepted events and their persisted processing
              results.
            </p>
          </div>
          <HistoryRefresh />
        </div>
        <EventHistory events={events} />
      </section>
    </>
  );
}
