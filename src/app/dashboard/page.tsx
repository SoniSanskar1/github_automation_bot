import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth_error=authentication_required");
  }

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
            Your GitHub identity is authenticated. Repository automation arrives
            in the next milestone.
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

      <section className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          ["Authentication", "Connected with GitHub"],
          ["Repositories", "Not connected yet"],
          ["Automation events", "No events yet"],
        ].map(([label, value]) => (
          <article
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            key={label}
          >
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-3 text-lg font-semibold text-slate-950">{value}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
