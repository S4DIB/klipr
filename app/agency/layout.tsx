import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { routeFor } from "@/lib/auth/guards";
import { listUnreadNotifications } from "@/lib/db";
import { AppShell } from "@/components/app/app-shell";

/** The agency console shell. Role === "agency" only. */
export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "agency") redirect(routeFor(user));
  if (!user.profileCompleted) redirect("/apply");

  const notifications = await listUnreadNotifications(user.id);

  return (
    <AppShell
      role="agency"
      displayName={user.orgName || user.displayName}
      avatarUrl={user.avatarUrl}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}
