export function DashboardNotice({
  message,
  successful,
}: {
  message: string;
  successful: boolean;
}) {
  return (
    <p
      className={`mb-6 flex items-center gap-3 rounded-md border px-4 py-3 text-sm ${
        successful
          ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
          : "border-amber-300/25 bg-amber-300/10 text-amber-100"
      }`}
      role="status"
    >
      <span aria-hidden="true">{successful ? "✓" : "!"}</span>
      {message}
    </p>
  );
}
