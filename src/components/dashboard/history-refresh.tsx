"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const REFRESH_INTERVAL_MS = 15_000;

export function HistoryRefresh() {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [router]);

  return (
    <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#758399]">
      <span aria-hidden="true" className="status-dot" />
      Updates every 15 seconds · Times in IST
    </p>
  );
}
