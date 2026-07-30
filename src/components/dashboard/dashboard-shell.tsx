"use client";

import { usePathname } from "next/navigation";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: "▦" },
  { label: "Automation rules", href: "/dashboard/rules", icon: "≛" },
  { label: "History", href: "/dashboard/history", icon: "↶" },
  { label: "Repositories", href: "/dashboard/repositories", icon: "⌘" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({
  children,
  githubLogin,
}: {
  children: React.ReactNode;
  githubLogin: string;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[#26334a] bg-[#0d1629]/95 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:px-5 lg:py-7">
        <a className="flex items-center gap-3 px-2" href="/dashboard">
          <span className="text-on-mint grid h-9 w-9 place-items-center rounded bg-[#4edea3] font-code text-lg font-black">
            &gt;_
          </span>
          <span>
            <strong className="font-display block text-xl text-[#4edea3]">
              RepoPilot
            </strong>
            <small className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              GitHub automation
            </small>
          </span>
        </a>

        <nav
          aria-label="Dashboard pages"
          className="mt-12 space-y-2 text-sm font-semibold text-[#aab7c8]"
        >
          {navigation.map(({ label, href, icon }) => {
            const active = isActive(pathname, href);

            return (
              <a
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-4 py-3 transition ${
                  active
                    ? "text-on-mint bg-[#10b981]"
                    : "hover:bg-[#172137] hover:text-[#4edea3]"
                }`}
                href={href}
                key={label}
              >
                <span aria-hidden="true" className="text-lg">
                  {icon}
                </span>
                {label}
              </a>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[#26334a] pt-5 text-xs text-slate-500">
          <p className="flex items-center gap-2 uppercase tracking-wider">
            <span aria-hidden="true" className="status-dot" />
            Repo status: nominal
          </p>
          <p className="mt-3">Signed in as {githubLogin}</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-[#26334a] bg-[#060b18]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="mx-auto flex min-h-16 max-w-[1320px] items-center justify-between gap-4">
            <a
              className="font-display shrink-0 text-lg font-bold text-[#4edea3] lg:hidden"
              href="/dashboard"
            >
              RepoPilot
            </a>
            <p className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-[#8f9db0] lg:flex">
              <span aria-hidden="true" className="status-dot" />
              Repo status: nominal
            </p>
            <form action="/auth/signout" method="post">
              <button
                className="rounded-md border border-[#344259] px-4 py-2 text-xs font-semibold text-[#bac5d4] transition hover:border-[#4edea3]/50 hover:text-[#4edea3]"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
          <nav
            aria-label="Dashboard pages"
            className="mx-auto flex max-w-[1320px] gap-1 overflow-x-auto pb-3 lg:hidden"
          >
            {navigation.map(({ label, href }) => {
              const active = isActive(pathname, href);

              return (
                <a
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    active
                      ? "text-on-mint bg-[#10b981]"
                      : "text-[#8f9db0]"
                  }`}
                  href={href}
                  key={label}
                >
                  {label}
                </a>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1320px] px-5 py-8 sm:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
