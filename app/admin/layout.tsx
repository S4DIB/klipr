import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { routeFor } from "@/lib/auth/guards";
import { AppShell } from "@/components/app/app-shell";

/** Admin ops shell — the shared app frame in its admin trim (no tab bar). */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect(routeFor(user));

  return (
    <AppShell role="admin" displayName={user.displayName}>
      {children}
    </AppShell>
  );
}
