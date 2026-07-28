"use client";

import { useFormStatus } from "react-dom";

export function RuleSubmitButton({
  children,
  pendingLabel,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();
  const classes =
    variant === "primary"
      ? "rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-500"
      : "rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:text-slate-400";

  return (
    <button className={classes} disabled={pending} type="submit">
      {pending ? pendingLabel : children}
    </button>
  );
}
