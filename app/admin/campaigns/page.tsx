import type { Metadata } from "next";
import { getProfile, listCampaigns } from "@/lib/db";
import { GlassPanel } from "@/components/app/glass-panel";
import { StatusChip } from "@/components/app/status-chip";
import { EmptyState } from "@/components/app/empty-state";
import { BudgetBar } from "@/components/ui/budget-bar";
import { takaFromPoisha, dhakaDate } from "@/lib/format";
import { confirmFunding, cancelCampaign } from "./actions";

export const metadata: Metadata = { title: "Campaigns · Admin" };

export default async function AdminCampaignsPage() {
  const all = await listCampaigns();
  const pending = all.filter((c) => c.status === "pending_funding");
  const running = all.filter((c) => c.status === "active" || c.status === "settling");
  const done = all.filter((c) => c.status === "completed" || c.status === "cancelled");

  const brandNames = new Map<string, string>();
  for (const c of pending) {
    if (!brandNames.has(c.brandProfileId)) {
      const p = await getProfile(c.brandProfileId);
      brandNames.set(c.brandProfileId, p?.orgName ?? p?.displayName ?? c.brandProfileId);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">02 / Campaigns</p>
        <h1 className="display-1 mt-1 text-[32px] text-text-hi">Funding & lifecycle.</h1>
      </header>

      <section className="space-y-3">
        <p className="eyebrow">Awaiting escrow confirmation</p>
        {pending.length === 0 ? (
          <GlassPanel>
            <EmptyState title="Nothing needs you" line="New campaigns appear here until their escrow is confirmed." />
          </GlassPanel>
        ) : (
          pending.map((c) => (
            <GlassPanel key={c.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-text-hi">{c.name}</p>
                <p className="mt-0.5 text-[12.5px] text-text-mid">
                  {brandNames.get(c.brandProfileId)} · {takaFromPoisha(c.budgetPoisha)} ·
                  ends {dhakaDate(c.endDate)}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <form action={confirmFunding}>
                  <input type="hidden" name="campaignId" value={c.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-volt-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-volt-400"
                  >
                    Confirm funding received
                  </button>
                </form>
                <form action={cancelCampaign}>
                  <input type="hidden" name="campaignId" value={c.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-[rgba(255,123,192,0.6)] px-4 py-2 text-[13px] font-semibold text-text-hi transition-colors hover:bg-[rgba(255,123,192,0.14)]"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </GlassPanel>
          ))
        )}
      </section>

      <section className="space-y-3">
        <p className="eyebrow">Running</p>
        {running.length === 0 ? (
          <p className="text-[13px] text-text-mid">None right now.</p>
        ) : (
          running.map((c) => (
            <GlassPanel key={c.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <p className="text-[15px] font-semibold text-text-hi">{c.name}</p>
                  <StatusChip status={c.status} />
                </div>
                <BudgetBar spent={c.spentPoisha} total={c.budgetPoisha} className="mt-3 max-w-md" />
              </div>
              <form action={cancelCampaign}>
                <input type="hidden" name="campaignId" value={c.id} />
                <button
                  type="submit"
                  className="rounded-full border border-[rgba(255,123,192,0.6)] px-4 py-2 text-[13px] font-semibold text-text-hi transition-colors hover:bg-[rgba(255,123,192,0.14)]"
                >
                  {c.status === "active" ? "Stop submissions" : "Close now (refund remainder)"}
                </button>
              </form>
            </GlassPanel>
          ))
        )}
      </section>

      {done.length > 0 && (
        <section className="space-y-3">
          <p className="eyebrow">Finished</p>
          <GlassPanel className="divide-y divide-[rgba(53,5,90,0.06)] p-3">
            {done.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-4 px-3 py-3">
                <p className="text-[14px] text-text-hi">{c.name}</p>
                <div className="flex items-center gap-3">
                  <span className="data-sm text-text-mid">
                    spent {takaFromPoisha(c.spentPoisha)}
                  </span>
                  <StatusChip status={c.status} />
                </div>
              </div>
            ))}
          </GlassPanel>
        </section>
      )}
    </div>
  );
}
