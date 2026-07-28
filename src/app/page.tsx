const foundationCapabilities = [
  "Strict TypeScript and linting",
  "Environment validation",
  "Automated tests and CI",
  "Health-check endpoint",
] as const;

const futureMilestones = [
  "GitHub sign-in and repository installation",
  "Verified, durable webhook ingestion",
  "Idempotent GitHub and Slack actions",
  "Authenticated event and retry history",
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-12 px-6 py-16 sm:px-10">
      <section className="max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
          Phase 0 · Engineering baseline
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-slate-950 sm:text-7xl">
          GitHub automation that makes every event traceable.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          RepoPilot will connect repository events to reliable GitHub actions,
          Slack notifications, and visible processing history. This milestone
          establishes the secure, testable foundation for that workflow.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/api/health"
          >
            Check service health
          </a>
          <span className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-600">
            Integrations arrive in later milestones
          </span>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <article className="rounded-3xl border border-white/70 bg-white/85 p-7 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Available in this foundation
          </h2>
          <ul className="mt-5 space-y-3 text-slate-600">
            {foundationCapabilities.map((capability) => (
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
