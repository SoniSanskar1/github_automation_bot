import { redirect } from "next/navigation";

import { EventHistory } from "@/components/dashboard/event-history";
import {
  getDashboardOverview,
  listDashboardEvents,
} from "@/modules/audit/dashboard-history";
import { getCurrentUser } from "@/modules/auth/current-user";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/?auth_error=authentication_required");
  }

  const [overview, events] = await Promise.all([
    getDashboardOverview(user.id),
    listDashboardEvents(user.id),
  ]);
  const githubLogin =
    typeof user.user_metadata.user_name === "string"
      ? user.user_metadata.user_name
      : typeof user.user_metadata.preferred_username === "string"
        ? user.user_metadata.preferred_username
        : "GitHub user";
  const overviewCards = [
    ["Repositories", overview.repositories],
    ["Active rules", overview.activeRules],
    ["Events today", overview.eventsToday],
    ["Successful actions", overview.successfulActions],
    ["Need attention", overview.actionsNeedingAttention],
  ] as const;

  return (
    <>
      <section>
        <p className="eyebrow">RepoPilot dashboard</p>
        <h1 className="font-display mt-2 text-4xl font-black tracking-[-0.03em] text-[#e1e7fb] sm:text-5xl">
          Welcome, {githubLogin}
        </h1>
        <p className="mt-3 max-w-2xl text-[#9ba9bc]">
          Monitor GitHub events, matched rules, and automated actions.
        </p>
      </section>

      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {overviewCards.map(([label, value]) => (
          <article
            className={`glass-panel glass-panel-interactive rounded-lg p-4 sm:p-5 ${
              label === "Need attention" && Number(value) > 0
                ? "border-amber-300/35"
                : ""
            }`}
            key={label}
          >
            <p className="text-xs font-medium text-[#8f9db0]">{label}</p>
            <p
              className={`font-code mt-4 text-3xl font-bold ${
                label === "Successful actions"
                  ? "text-[#4edea3]"
                  : label === "Need attention" && Number(value) > 0
                    ? "text-amber-300"
                    : "text-[#e1e7fb]"
              }`}
            >
              {value}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Latest activity</p>
            <h2 className="font-display mt-2 text-3xl font-bold text-[#e1e7fb]">
              Recent automation
            </h2>
            <p className="mt-2 text-sm text-[#8f9db0]">
              A quick view of the newest three accepted events.
            </p>
          </div>
          <a
            className="w-fit rounded-full border border-emerald-300/20 px-4 py-2 text-xs font-bold text-[#4edea3] transition hover:bg-emerald-300/10"
            href="/dashboard/history"
          >
            View full history →
          </a>
        </div>
        <EventHistory events={events.slice(0, 3)} />
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Automation rules",
            copy: "Create focused issue and pull-request workflows.",
            href: "/dashboard/rules",
          },
          {
            title: "Event history",
            copy: "Inspect persisted processing, actions, AI, and failures.",
            href: "/dashboard/history",
          },
          {
            title: "Repositories",
            copy: "Review and manage GitHub App repository access.",
            href: "/dashboard/repositories",
          },
        ].map((item) => (
          <a
            className="glass-panel glass-panel-interactive rounded-lg p-5"
            href={item.href}
            key={item.title}
          >
            <h2 className="font-display text-lg font-bold text-[#e1e7fb]">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#8f9db0]">
              {item.copy}
            </p>
            <p className="mt-4 text-sm font-semibold text-[#4edea3]">
              Open page →
            </p>
          </a>
        ))}
      </section>
    </>
  );
}
