import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { listCampaignsByBrand } from "@/lib/db";
import type { CampaignStatus } from "@/lib/db/types";
import { GlassPanel } from "@/components/app/glass-panel";
import { StatusChip } from "@/components/app/status-chip";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { takaFromPoisha, dhakaDate } from "@/lib/format";
import { PLATFORMS } from "@/lib/platforms";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Campaigns" };

type FilterKey = "all" | "pending" | "active" | "completed" | "rejected";

/**
 * Brand-facing status buckets. "Pending" = still with the Klipr team (awaiting
 * approval / funding); "Active" = approved and running; "Completed" = finished;
 * "Rejected" = declined or cancelled.
 */
const FILTERS: { key: FilterKey; label: string; match: (s: CampaignStatus) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "pending", label: "Pending", match: (s) => s === "pending_funding" || s === "draft" },
  { key: "active", label: "Active", match: (s) => s === "active" || s === "settling" },
  { key: "completed", label: "Completed", match: (s) => s === "completed" },
  { key: "rejected", label: "Rejected", match: (s) => s === "cancelled" },
];

export default async function BrandCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireRole("brand");
  const { status } = await searchParams;
  const current = (FILTERS.find((f) => f.key === status)?.key ?? "all") as FilterKey;

  const all = (await listCampaignsByBrand(user.id)).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const matcher = FILTERS.find((f) => f.key === current)!.match;
  const list = all.filter((c) => matcher(c.status));
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f.key, all.filter((c) => f.match(c.status)).length]),
  ) as Record<FilterKey, number>;

  const hrefFor = (key: FilterKey) =>
    key === "all" ? "/brand/campaigns" : `/brand/campaigns?status=${key}`;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink-900">Campaigns</h1>
        </div>
        <Button href="/brand/campaigns/new" className="h-11 px-6 text-[14px]">
          New campaign
        </Button>
      </header>

      {/* status filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = f.key === current;
          return (
            <Link
              key={f.key}
              href={hrefFor(f.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-colors",
                on
                  ? "bg-ink-900 text-white"
                  : "bg-white text-ink-600 shadow-[var(--shadow-xs)] hover:text-ink-900",
              )}
            >
              {f.label}
              <span className={cn("text-[12px]", on ? "text-white/65" : "text-ink-400")}>
                {counts[f.key]}
              </span>
            </Link>
          );
        })}
      </div>

      {list.length === 0 ? (
        <GlassPanel className="p-5">
          <EmptyState
            title={current === "all" ? "No campaigns yet" : `No ${current} campaigns`}
            line={
              current === "all"
                ? "Fund a budget, upload your clip, and vetted pages distribute it. You pay ৳60 per 1,000 verified views."
                : "Nothing here right now. Try another filter."
            }
            action={
              current === "all" ? (
                <Button
                  href="/brand/campaigns/new"
                  variant="secondary"
                  className="h-10 px-5 text-[13.5px]"
                >
                  Create your first campaign
                </Button>
              ) : undefined
            }
          />
        </GlassPanel>
      ) : (
        <div className="flex flex-col gap-2.5">
          {list.map((c) => (
            <Link key={c.id} href={`/brand/campaigns/${c.id}`} className="block">
              <GlassPanel
                interactive
                className="flex flex-wrap items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="truncate text-[15px] font-bold text-ink-900">{c.name}</p>
                    <StatusChip status={c.status} />
                    {c.deletionRequestedAt ? (
                      <span className="rounded-full bg-danger-bg px-2.5 py-0.5 text-[11px] font-bold text-danger-600">
                        Deletion requested
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-ink-500">
                    {c.niche} · {c.allowedPlatforms.map((p) => PLATFORMS[p].label).join(", ")} · ends{" "}
                    {dhakaDate(c.endDate)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-[14px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
                    {takaFromPoisha(c.budgetPoisha)}
                  </p>
                  <p className="text-[11px] text-ink-500">budget</p>
                </div>
              </GlassPanel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
