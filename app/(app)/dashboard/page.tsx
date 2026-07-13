import Link from "next/link";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth/session";
import { listSubmissions, listPayouts, listCampaigns } from "@/lib/db";
import { taka, views as fmtViews, dateShort } from "@/lib/format";
import { StatusBadge } from "@/components/app/status-badge";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = (await currentUser())!;
  const subs = (await listSubmissions({ profileId: user.id })).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const payouts = await listPayouts({ profileId: user.id });
  const campById = new Map((await listCampaigns()).map((c) => [c.id, c]));

  const totalViews = subs
    .filter((s) => s.status === "verified")
    .reduce((sum, s) => sum + s.verifiedViews, 0);
  const paid = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const pending = payouts
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <h1 className="display text-3xl text-text-hi">
        Welcome back, {user.displayName.split(" ")[0]}
      </h1>

      {/* overview */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Card label="Verified views" value={fmtViews(totalViews)} />
        <Card label="Paid out" value={taka(paid)} accent />
        <Card label="Pending" value={taka(pending)} />
        <Card label="Submissions" value={String(subs.length)} />
      </div>

      {/* submissions */}
      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl text-text-hi">Your submissions</h2>
        {subs.length === 0 ? (
          <Empty>
            No clips yet.{" "}
            <Link href="/marketplace" className="text-volt-600 hover:underline">
              Browse campaigns →
            </Link>
          </Empty>
        ) : (
          <div className="card-shadow overflow-hidden rounded-2xl border border-line bg-white">
            <div className="hidden grid-cols-[1fr_7rem_7rem_6rem] gap-4 border-b border-line px-5 py-3 text-xs uppercase tracking-wide text-text-low md:grid">
              <span>Campaign</span>
              <span>Platform</span>
              <span>Views</span>
              <span>Status</span>
            </div>
            {subs.map((s) => {
              const c = campById.get(s.campaignId);
              return (
                <div
                  key={s.id}
                  className="grid grid-cols-2 gap-2 border-b border-line px-5 py-4 last:border-0 md:grid-cols-[1fr_7rem_7rem_6rem] md:items-center"
                >
                  <Link href={`/campaign/${s.campaignId}`} className="font-medium text-text-hi hover:text-volt-600">
                    {c?.name ?? "Campaign"}
                  </Link>
                  <span className="text-sm text-text-mid">{s.platform}</span>
                  <span className="font-mono text-sm text-text-hi">{fmtViews(s.verifiedViews)}</span>
                  <StatusBadge status={s.status} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* payouts */}
      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl text-text-hi">Payout history</h2>
        {payouts.length === 0 ? (
          <Empty>Payouts appear here once a campaign you joined closes.</Empty>
        ) : (
          <div className="card-shadow overflow-hidden rounded-2xl border border-line bg-white">
            {payouts.map((p) => {
              const c = campById.get(p.campaignId);
              return (
                <div key={p.id} className="flex items-center justify-between border-b border-line px-5 py-4 last:border-0">
                  <div>
                    <p className="font-medium text-text-hi">{c?.name ?? "Campaign"}</p>
                    <p className="text-xs text-text-low">
                      {fmtViews(p.viewsUsed)} views
                      {p.txnRef ? ` · ref ${p.txnRef}` : ""}
                      {p.paidAt ? ` · ${dateShort(p.paidAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-text-hi">{taka(p.amount)}</span>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card-shadow rounded-2xl border border-line bg-white p-5">
      <p className={`font-mono text-2xl font-semibold ${accent ? "text-volt-500" : "text-text-hi"}`}>
        {value}
      </p>
      <p className="mt-1 text-sm text-text-low">{label}</p>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-10 text-center text-text-mid">
      {children}
    </div>
  );
}
