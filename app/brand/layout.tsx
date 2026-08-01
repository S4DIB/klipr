import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { routeFor } from "@/lib/auth/guards";
import { AppShell } from "@/components/app/app-shell";

/** The brand console shell. Role === "brand" only. */
export default async function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "brand") redirect(routeFor(user));
  if (!user.profileCompleted) redirect("/apply");

  return (
    <AppShell role="brand" displayName={user.orgName || user.displayName} avatarUrl={user.avatarUrl}>
      {children}
    </AppShell>
  );
}
