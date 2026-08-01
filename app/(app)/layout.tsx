import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { routeFor } from "@/lib/auth/guards";
import { ledgerBalance, listPayoutBatches } from "@/lib/db";
import { clipperAccount } from "@/lib/ledger";
import { AppShell } from "@/components/app/app-shell";

/**
 * The clipper/agency shell. Gate order matters:
 * signed in → correct role → ACTIVE access (the vetted gate) → onboarded.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "brand") redirect("/brand");
  if (user.role === "admin") redirect("/admin");
  if (user.access !== "active") redirect(routeFor(user));
  if (!user.profileCompleted) redirect("/onboarding");

  // available balance for the header pill (real ledger, minus queued payouts)
  const [balance, batches] = await Promise.all([
    ledgerBalance(clipperAccount(user.id)),
    listPayoutBatches({ profileId: user.id }),
  ]);
  const held = batches
    .filter((b) => b.status === "queued" || b.status === "blocked_nid" || b.status === "processing")
    .reduce((a, b) => a + b.amountPoisha, 0);
  const availablePoisha = balance - held;

  return (
    <AppShell
      role={user.role === "agency" ? "agency" : "clipper"}
      displayName={user.displayName}
      avatarUrl={user.avatarUrl}
      tier={user.tier}
      xpTotal={user.xpTotal}
      availablePoisha={availablePoisha}
    >
      {children}
    </AppShell>
  );
}
