import type { Metadata } from "next";
import {
  listCampaigns,
  listSubmissions,
  listPayouts,
  listProfiles,
} from "@/lib/db";
import { taka, views as fmtViews } from "@/lib/format";
import { StatusBadge } from "@/components/app/status-badge";
import {
  recordVerification,
  rejectSubmission,
  closeCampaign,
  markPaid,
} from "./actions";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const [campaigns, allSubs, allPayouts, profiles] = await Promise.all([
    listCampaigns(),
    listSubmissions(),
    listPayouts(),
    listProfiles(),
  ]);
  const pending = allSubs.filter((s) => s.status === "pending");

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const who = (profileId: string) =>
    profileById.get(profileId)?.displayName ?? profileId;

  const subsByCampaign = new Map<string, typeof allSubs>();
  for (const s of allSubs) {
    const arr = subsByCampaign.get(s.campaignId) ?? [];
    arr.push(s);
    subsByCampaign.set(s.campaignId, arr);
  }
  const payoutsByCampaign = new Map<string, typeof allPayouts>();
  for (const p of allPayouts) {
    const arr = payoutsByCampaign.get(p.campaignId) ?? [];
    arr.push(p);
    payoutsByCampaign.set(p.campaignId, arr);
  }

  return (
    <div className="space-y-12">
      <div>
        <h1 className="display text-3xl text-text-hi">Admin console</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Stat label="To verify" value={String(pending.length)} accent={pending.length > 0} />
          <Stat label="Submissions" value={String(allSubs.length)} />
          <Stat label="Active campaigns" value={String(campaigns.filter((c) => c.status === "active").length)} />
          <Stat label="Pending payouts" value={String(allPayouts.filter((p) => p.status === "pending").length)} />
        </div>
      </div>

      {/* verify queue */}
      <section>
        <h2 className="mb-4 font-display text-xl text-text-hi">Verify submissions</h2>
        {pending.length === 0 ? (
          <Empty>Nothing waiting. New clip submissions land here.</Empty>
        ) : (
          <div className="space-y-3">
            {pending.map((s) => (
              <div key={s.id} className="card-shadow rounded-xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-text-hi">{who(s.profileId)}</p>
                    <p className="text-xs text-text-low">
                      {s.postingHandle} · {s.platform}
                    </p>
                  </div>
                  <a
                    href={s.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="max-w-[16rem] truncate text-sm text-volt-600 hover:underline"
                  >
                    {s.postUrl} ↗
                  </a>
                </div>
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <form action={recordVerification} className="flex items-end gap-2">
                    <input type="hidden" name="submissionId" value={s.id} />
                    <div>
                      <label className="mb-1 block text-xs text-text-low">Verified views</label>
                      <input
                        name="views"
                        type="number"
                        min={0}
                        placeholder="0"
                        required
                        className="h-9 w-32 rounded-lg border border-line px-2 text-sm outline-none focus:border-volt-500"
                      />
                    </div>
                    <button className="h-9 rounded-lg bg-volt-500 px-4 text-sm font-medium text-white hover:bg-volt-400">
                      Verify
                    </button>
                  </form>
                  <form action={rejectSubmission} className="flex items-end gap-2">
                    <input type="hidden" name="submissionId" value={s.id} />
                    <input
                      name="reason"
                      placeholder="Reject reason"
                      className="h-9 w-44 rounded-lg border border-line px-2 text-sm outline-none focus:border-red-400"
                    />
                    <button className="h-9 rounded-lg border border-line px-4 text-sm font-medium text-red-600 hover:border-red-300 hover:bg-red-50">
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* campaigns + payouts */}
      <section>
        <h2 className="mb-4 font-display text-xl text-text-hi">Campaigns &amp; payouts</h2>
        <div className="space-y-4">
          {campaigns.map((c) => {
            const subs = subsByCampaign.get(c.id) ?? [];
            const verifiedViews = subs
              .filter((s) => s.status === "verified")
              .reduce((sum, s) => sum + s.verifiedViews, 0);
            const payouts = payoutsByCampaign.get(c.id) ?? [];
            const batchTotal = payouts.reduce((sum, p) => sum + p.amount, 0);

            return (
              <div key={c.id} className="card-shadow rounded-xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg text-text-hi">{c.name}</p>
                    <p className="text-xs text-text-low">
                      {c.brand} · {taka(c.budget)} budget · {fmtViews(verifiedViews)} verified views ·{" "}
                      {subs.length} submissions
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={c.status} />
                    {c.status === "active" && (
                      <form action={closeCampaign}>
                        <input type="hidden" name="campaignId" value={c.id} />
                        <button className="h-9 rounded-lg bg-text-hi px-4 text-sm font-medium text-white hover:opacity-90">
                          Close &amp; run payouts
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {payouts.length > 0 && (
                  <div className="mt-5 overflow-hidden rounded-lg border border-line">
                    <div className="flex items-center justify-between bg-ink-850 px-4 py-2 text-xs uppercase tracking-wide text-text-low">
                      <span>Payout batch ({payouts.length})</span>
                      <span>Total {taka(batchTotal)}</span>
                    </div>
                    {payouts.map((p) => (
                      <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-text-hi">{who(p.profileId)}</p>
                          <p className="text-xs text-text-low">
                            {fmtViews(p.viewsUsed)} views · {profileById.get(p.profileId)?.payoutNumber ?? "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold text-text-hi">{taka(p.amount)}</span>
                          {p.status === "paid" ? (
                            <StatusBadge status="paid" />
                          ) : (
                            <form action={markPaid} className="flex items-center gap-2">
                              <input type="hidden" name="payoutId" value={p.id} />
                              <input
                                name="txnRef"
                                placeholder="Txn ref"
                                className="h-8 w-28 rounded-lg border border-line px-2 text-xs outline-none focus:border-volt-500"
                              />
                              <button className="h-8 rounded-lg bg-volt-500 px-3 text-xs font-medium text-white hover:bg-volt-400">
                                Mark paid
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
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
