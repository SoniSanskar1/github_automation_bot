import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/modules/auth/current-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

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
    <DashboardShell githubLogin={githubLogin}>{children}</DashboardShell>
  );
}
