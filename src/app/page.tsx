const availableCapabilities = [
  "GitHub sign-in with Supabase Auth",
  "Cookie-based server sessions",
  "Protected dashboard access",
  "Automated tests and CI",
] as const;

const futureMilestones = [
  "GitHub App installation and repository access",
  "Verified, durable webhook ingestion",
  "Idempotent GitHub and Slack actions",
  "Authenticated event and retry history",
] as const;

const authErrorMessages = {
  authentication_required: "Sign in with GitHub to open the dashboard.",
  callback_failed: "GitHub sign-in could not be completed. Please try again.",
  signout_failed: "Sign-out could not be completed. Please try again.",
  signin_failed: "GitHub sign-in is temporarily unavailable. Please try again.",
} as const;

type HomePageProps = {
  searchParams: Promise<{
    auth_error?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { auth_error: authError } = await searchParams;
  const authErrorMessage =
    authError && authError in authErrorMessages
      ? authErrorMessages[authError as keyof typeof authErrorMessages]
      : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-12 px-6 py-16 sm:px-10">
      <section className="max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
          Phase 1 · GitHub authentication
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-slate-950 sm:text-7xl">
          GitHub automation that makes every event traceable.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Sign in with GitHub to access the protected RepoPilot dashboard.
          Repository connections and automation will be added in focused,
          auditable milestones.
        </p>
        {authErrorMessage ? (
          <p
            className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="alert"
          >
            {authErrorMessage}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <form action="/auth/signin" method="post">
            <input name="next" type="hidden" value="/dashboard" />
            <button
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              type="submit"
            >
              Sign in with GitHub
            </button>
          </form>
          <a
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href="/api/health"
          >
            Service health
          </a>
          <span className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-600">
            Authentication is powered by Supabase
          </span>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <article className="rounded-3xl border border-white/70 bg-white/85 p-7 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Available now
          </h2>
          <ul className="mt-5 space-y-3 text-slate-600">
            {availableCapabilities.map((capability) => (
              <li className="flex gap-3" key={capability}>
                <span aria-hidden="true" className="text-teal-600">
                  ✓
                </span>
                {capability}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-slate-950 p-7 text-white shadow-sm">
          <h2 className="text-lg font-semibold">Planned core workflow</h2>
          <ol className="mt-5 space-y-3 text-slate-300">
            {futureMilestones.map((milestone, index) => (
              <li className="flex gap-3" key={milestone}>
                <span className="font-mono text-teal-300">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {milestone}
              </li>
            ))}
          </ol>
        </article>
      </section>
    </main>
  );
}
