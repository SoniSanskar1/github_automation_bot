import { redirect } from "next/navigation";

import { DashboardNotice } from "@/components/dashboard/dashboard-notice";
import { getCurrentUser } from "@/modules/auth/current-user";
import { listRepositoriesForUser } from "@/modules/github/repository-sync";

export const dynamic = "force-dynamic";

const connectionMessages: Record<string, string> = {
  success: "GitHub App connected and repositories synchronized.",
  invalid_state: "The installation request expired. Please try again.",
  authorization_missing: "GitHub authorization was not completed.",
  installation_not_found: "No accessible GitHub App installation was found.",
  failed: "GitHub connection failed. Please try again.",
};

type RepositoriesPageProps = {
  searchParams: Promise<{
    github_connection?: string;
  }>;
};

export default async function RepositoriesPage({
  searchParams,
}: RepositoriesPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/?auth_error=authentication_required");
  }

  const [repositories, parameters] = await Promise.all([
    listRepositoriesForUser(user.id),
    searchParams,
  ]);
  const connectionResult = parameters.github_connection;
  const connectionMessage = connectionResult
    ? connectionMessages[connectionResult]
    : undefined;

  return (
    <>
      {connectionMessage ? (
        <DashboardNotice
          message={connectionMessage}
          successful={connectionResult === "success"}
        />
      ) : null}
      <section>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">GitHub App access</p>
            <h1 className="font-display mt-2 text-4xl font-black tracking-[-0.03em] text-[#e1e7fb]">
              Connected repositories
            </h1>
            <p className="mt-2 text-sm text-[#8f9db0]">
              GitHub controls which repositories RepoPilot can access.
            </p>
          </div>
          <form action="/api/github/install/start" method="post">
            <button
              className="w-full rounded-md bg-[#dce4f8] px-5 py-3 text-sm font-bold text-[#10192d] transition hover:bg-white sm:w-auto"
              type="submit"
            >
              {repositories.length > 0
                ? "Manage GitHub access"
                : "Install GitHub App"}
            </button>
          </form>
        </div>

        {repositories.length === 0 ? (
          <p className="mt-8 rounded-md border border-dashed border-[#344259] bg-[#0b1326] p-8 text-center text-sm text-[#8f9db0]">
            No repositories are connected yet. Install the GitHub App and
            choose one or more repositories.
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 lg:grid-cols-2">
            {repositories.map((repository) => (
              <li
                className="glass-panel glass-panel-interactive flex items-center justify-between gap-4 rounded-lg p-5"
                key={repository.id}
              >
                <div className="min-w-0">
                  <p className="font-code truncate font-semibold text-[#e1e7fb]">
                    {repository.fullName}
                  </p>
                  <p className="font-code mt-2 text-xs text-[#758399]">
                    Default branch: {repository.defaultBranch}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${
                    repository.isPrivate
                      ? "border-[#344259] text-[#9ba9bc]"
                      : "border-emerald-300/25 text-[#4edea3]"
                  }`}
                >
                  {repository.isPrivate ? "Private" : "Public"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
