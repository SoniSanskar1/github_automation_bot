"use client";

import { useFormStatus } from "react-dom";

export function PendingSubmitButton({
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
      ? "text-on-mint rounded-md bg-[#4edea3] px-5 py-2.5 text-sm font-bold transition hover:bg-[#6ffbbe] disabled:cursor-wait disabled:bg-[#52665d]"
      : "rounded-md border border-[#344259] bg-transparent px-4 py-2 text-sm font-semibold text-[#bac5d4] transition hover:border-[#4edea3]/50 hover:text-[#4edea3] disabled:cursor-wait disabled:text-slate-500";

  return (
    <button className={classes} disabled={pending} type="submit">
      {pending ? pendingLabel : children}
    </button>
  );
}
