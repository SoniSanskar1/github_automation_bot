const completedCapabilities = [
  {
    title: "GitHub App installation",
    detail: "Granular access across selected repositories",
  },
  {
    title: "Verified webhook ingestion",
    detail: "Signed, durable, and duplicate-safe events",
  },
  {
    title: "GitHub and Slack actions",
    detail: "Reliable automation with visible outcomes",
  },
  {
    title: "AI-assisted triage",
    detail: "Advisory summaries, priority, and label suggestions",
  },
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
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
      <section className="max-w-4xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
            Live
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Event-driven GitHub automation
          </span>
        </div>

        <h1 className="font-display max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.04em] text-[#e1e7fb] sm:text-7xl lg:text-[5.2rem]">
          GitHub automation that makes every event{" "}
          <span className="text-[#4edea3] italic">traceable.</span>
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-[#aab7c8] sm:text-lg sm:leading-8">
          Connect repositories, configure focused rules, and follow every
          GitHub action, Slack alert, and AI insight from one protected
          dashboard.
        </p>

        {authErrorMessage ? (
          <p
            className="mt-6 rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"
            role="alert"
          >
            {authErrorMessage}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <form action="/auth/signin" method="post">
            <input name="next" type="hidden" value="/dashboard" />
            <button
              className="text-on-mint flex w-full items-center justify-center gap-3 rounded-md bg-[#4edea3] px-6 py-3.5 text-sm font-bold shadow-[0_0_28px_rgba(78,222,163,0.2)] transition hover:bg-[#6ffbbe] sm:w-auto"
              type="submit"
            >
              <span aria-hidden="true">↪</span>
              Sign in with GitHub
            </button>
          </form>
          <a
            className="flex items-center justify-center gap-2 rounded-full border border-[#26334a] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#aab7c8] transition hover:border-emerald-300/40 hover:text-emerald-200"
            href="/api/health"
          >
            <span aria-hidden="true" className="status-dot" />
            Service health
          </a>
          <span className="text-center text-xs italic text-slate-500">
            Authentication powered by Supabase
          </span>
        </div>
      </section>

      <section className="mt-16 grid gap-5 md:grid-cols-2">
        <article className="glass-panel rounded-lg p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Production ready</p>
              <h2 className="font-display mt-2 text-2xl font-bold">
                Built to be trusted
              </h2>
            </div>
            <span
              aria-hidden="true"
              className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-emerald-300"
            >
              ✓
            </span>
          </div>
          <ul className="mt-7 grid gap-4 text-sm text-[#aab7c8] sm:grid-cols-2">
            {[
              "Signed webhook verification",
              "Durable event processing",
              "Duplicate-delivery protection",
              "Authenticated audit history",
            ].map((capability) => (
              <li className="flex items-center gap-3" key={capability}>
                <span aria-hidden="true" className="text-[#4edea3]">
                  ✓
                </span>
                {capability}
              </li>
            ))}
          </ul>
        </article>

        <article className="glass-panel rounded-lg p-6 sm:p-8">
          <p className="eyebrow">Complete workflow</p>
          <ol className="mt-5 space-y-5">
            {completedCapabilities.map((capability, index) => (
              <li className="flex gap-4" key={capability.title}>
                <span className="font-code h-fit rounded border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-xs text-[#4edea3]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-semibold text-[#e1e7fb]">
                    {capability.title}
                  </p>
                  <p className="mt-0.5 text-sm text-[#8f9db0]">
                    {capability.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </article>
      </section>

      <footer className="mt-16 flex flex-col gap-2 border-t border-[#1c2940] pt-6 text-xs uppercase tracking-wider text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>RepoPilot · GitHub automation</span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="status-dot" />
          All systems operational
        </span>
      </footer>
    </main>
  );
}
