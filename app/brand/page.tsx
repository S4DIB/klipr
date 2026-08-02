import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { listCampaignsByBrand, listNotifications, listSubmissions } from "@/lib/db";
import { dismissNotification } from "@/lib/notifications/actions";
import { GlassPanel } from "@/components/app/glass-panel";
import { StatusChip } from "@/components/app/status-chip";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { takaFromPoisha, views as fmtViews } from "@/lib/format";
import { PLATFORMS } from "@/lib/platforms";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Brand console" };

/** Compact taka for table cells: ৳22.8k / ৳60k / ৳420. */
function takaCompact(poisha: number): string {
  const taka = poisha / 100;
  if (taka >= 1000) {
    const k = taka / 1000;
    return `৳${k >= 100 ? Math.round(k) : Math.round(k * 10) / 10}k`;
  }
  return `৳${Math.round(taka).toLocaleString("en-US")}`;
}

export default async function BrandOverviewPage() {
  const user = await requireRole("brand");
  const campaigns = (await listCampaignsByBrand(user.id)).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  // aggregates. No clipper identities, just performance
  const viewsByCampaign = new Map<string, number>();
  for (const c of campaigns) {
    const subs = await listSubmissions({ campaignId: c.id });
    viewsByCampaign.set(
      c.id,
      subs
        .filter((s) => s.status === "settled")
        .reduce((a, s) => a + (s.lockedViews ?? 0), 0) +
        subs
          .filter((s) => s.status === "tracking" || s.status === "held")
          .reduce((a, s) => a + s.countedViews, 0),
    );
  }
  const active = campaigns.filter((c) => c.status === "active" || c.status === "settling");
  const escrowed = active.reduce((a, c) => a + (c.budgetPoisha - c.spentPoisha), 0);
  const spent = campaigns.reduce((a, c) => a + c.spentPoisha, 0);
  const reach = [...viewsByCampaign.values()].reduce((a, v) => a + v, 0);

  const unread = (await listNotifications(user.id)).filter((n) => !n.readAt);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink-900">Overview</h1>
        </div>
        <Button href="/brand/campaigns/new" className="h-11 px-6 text-[14px]">
          New campaign
        </Button>
      </header>

      {unread.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {unread.map((n) => (
            <GlassPanel
              key={n.id}
              className="flex flex-wrap items-start justify-between gap-3 border border-[rgba(125,4,215,0.18)] p-4"
            >
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-ink-900">{n.title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink-600">{n.body}</p>
              </div>
              <form action={dismissNotification}>
                <input type="hidden" name="notificationId" value={n.id} />
                <button
                  type="submit"
                  className="shrink-0 rounded-full border border-[rgba(53,5,90,0.14)] px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-600 transition-colors hover:text-ink-900"
                >
                  Dismiss
                </button>
              </form>
            </GlassPanel>
          ))}
        </div>
      )}

      {/* stat grid. Verified reach is the one ink tile */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <GlassPanel className="p-4">
          <p className="eyebrow">Active campaigns</p>
          <p className="mt-2 font-mono text-[30px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
            {active.length}
          </p>
        </GlassPanel>
        <GlassPanel className="p-4">
          <p className="eyebrow">Escrowed</p>
          <p className="mt-2 font-mono text-[30px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
            {takaCompact(escrowed)}
          </p>
        </GlassPanel>
        <GlassPanel className="p-4">
          <p className="eyebrow">Spent</p>
          <p className="mt-2 font-mono text-[30px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
            {takaCompact(spent)}
          </p>
        </GlassPanel>
        <GlassPanel variant="ink" className="p-4">
          <p className="eyebrow text-[rgba(255,255,244,0.6)]">Verified reach</p>
          <p className="mt-2 font-mono text-[30px] font-semibold [font-variant-numeric:tabular-nums]">
            {fmtViews(reach)}
          </p>
        </GlassPanel>
      </div>

      {/* campaigns table */}
      <GlassPanel className="p-5">
        <span className="eyebrow">01 / Campaigns</span>
        {campaigns.length === 0 ? (
          <EmptyState
            title="No campaigns yet"
            line="Fund a budget, upload your clip, and vetted pages distribute it. You pay ৳60 per 1,000 verified views. Nothing else."
            action={
              <Button
                href="/brand/campaigns/new"
                variant="secondary"
                className="h-10 px-5 text-[13.5px]"
              >
                Create your first campaign
              </Button>
            }
          />
        ) : (
          <div className="mt-3.5 overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[2.2fr_1fr_1.6fr_1fr_1fr] gap-3 border-b border-[rgba(53,5,90,0.08)] pb-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-400">
                <span>Campaign</span>
                <span>Status</span>
                <span>Budget</span>
                <span>Cost / 1k</span>
                <span>Views</span>
              </div>
              {campaigns.map((c, i) => {
                const funded = c.status !== "draft" && c.status !== "pending_funding";
                return (
                  <Link
                    key={c.id}
                    href={`/brand/campaigns/${c.id}`}
                    className={cn(
                      "liftrow grid grid-cols-[2.2fr_1fr_1.6fr_1fr_1fr] items-center gap-3 py-3.5",
                      i < campaigns.length - 1 && "border-b border-[rgba(53,5,90,0.06)]",
                    )}
                  >
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block truncate text-[14px] font-bold",
                          funded ? "text-ink-900" : "text-ink-600",
                        )}
                      >
                        {c.name}
                      </span>
                      <span className="block text-[11px] text-ink-500">
                        {funded
                          ? c.allowedPlatforms.map((p) => PLATFORMS[p].label).join(" · ")
                          : "Draft"}
                      </span>
                    </span>
                    <span>
                      <StatusChip status={c.status} />
                    </span>
                    {funded ? (
                      <span>
                        <span className="glass-well block h-2 overflow-hidden rounded-full">
                          <span
                            className="block h-full bg-[linear-gradient(90deg,var(--mint),var(--yellow))]"
                            style={{
                              width: `${
                                c.budgetPoisha > 0
                                  ? Math.min(
                                      100,
                                      Math.round((c.spentPoisha / c.budgetPoisha) * 100),
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </span>
                        <span className="mt-1 block font-mono text-[11px] text-ink-500 [font-variant-numeric:tabular-nums]">
                          {takaCompact(c.spentPoisha)} / {takaCompact(c.budgetPoisha)}
                        </span>
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-ink-500">Awaiting escrow</span>
                    )}
                    <span
                      className={cn(
                        "font-mono text-[13px] [font-variant-numeric:tabular-nums]",
                        funded ? "text-ink-900" : "text-ink-400",
                      )}
                    >
                      {funded ? takaFromPoisha(c.rateBrandPer1k) : "—"}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[13px] font-semibold [font-variant-numeric:tabular-nums]",
                        funded ? "text-ink-900" : "text-ink-400",
                      )}
                    >
                      {funded ? fmtViews(viewsByCampaign.get(c.id) ?? 0) : "—"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
