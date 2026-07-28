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
    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
      Updates every 15 seconds · Times in UTC
    </p>
  );
}
