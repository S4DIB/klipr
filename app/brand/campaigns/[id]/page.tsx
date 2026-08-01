import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { getCampaign, listSubmissions } from "@/lib/db";
import { GlassPanel } from "@/components/app/glass-panel";
import { StatTile } from "@/components/app/stat-tile";
import { StatusChip } from "@/components/app/status-chip";
import { RequestDeletionButton } from "@/components/app/delete-campaign-button";
import { BudgetBar } from "@/components/ui/budget-bar";
import { PLATFORMS } from "@/lib/platforms";
import { poishaToTaka } from "@/lib/money";
import { takaFromPoisha, dhakaDate, views as fmtViews } from "@/lib/format";
import { clearDeletionRequest } from "../new/actions";

export const metadata: Metadata = { title: "Campaign" };

export default async function BrandCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("brand");
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign || campaign.brandProfileId !== user.id) notFound();

  // aggregate performance. Clipper identities stay private
  const subs = await listSubmissions({ campaignId: id });
  const settled = subs.filter((s) => s.status === "settled");
  const live = subs.filter((s) => s.status === "tracking" || s.status === "held");
  const settledViews = settled.reduce((a, s) => a + (s.lockedViews ?? 0), 0);
  const liveCounted = live.reduce((a, s) => a + s.countedViews, 0);
  const costPerView =
    settledViews > 0 ? (campaign.spentPoisha / settledViews / 100).toFixed(3) : null;
  const topClips = [...settled]
    .sort((a, b) => (b.lockedViews ?? 0) - (a.lockedViews ?? 0))
    .slice(0, 5);

  // Edit only before it goes live. Deletion is a request an admin approves —
  // brands never delete their own campaigns directly.
  const canEdit = campaign.status === "pending_funding" || campaign.status === "draft";
  const deletionRequested = Boolean(campaign.deletionRequestedAt);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">
            {campaign.niche} · ends {dhakaDate(campaign.endDate)}
          </p>
          <h1 className="display-1 mt-1 text-[30px] text-text-hi">{campaign.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusChip status={campaign.status} />
          {canEdit ? (
            <Link
              href={`/brand/campaigns/${id}/edit`}
              className="rounded-full bg-volt-600 px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-volt-500"
            >
              Edit
            </Link>
          ) : null}
          {deletionRequested ? (
            <>
              <span className="inline-flex items-center rounded-full bg-danger-bg px-3 py-1.5 text-[12px] font-semibold text-danger-600">
                Deletion requested
              </span>
              <form action={clearDeletionRequest}>
                <input type="hidden" name="campaignId" value={id} />
                <button
                  type="submit"
                  className="rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-text-hi transition-colors hover:border-volt-400 hover:text-volt-600"
                >
                  Cancel request
                </button>
              </form>
            </>
          ) : (
            <RequestDeletionButton campaignId={id} label="Request deletion" />
          )}
        </div>
      </header>

      {deletionRequested && (
        <GlassPanel className="p-4">
          <p className="text-[13px] leading-relaxed text-text-mid">
            You’ve requested to delete this campaign. An admin will review it and either remove it
            or dismiss the request. You can cancel the request any time until then.
          </p>
        </GlassPanel>
      )}

      {campaign.status === "pending_funding" && (
        <GlassPanel variant="ink" className="p-6">
          <p className="eyebrow text-[rgba(255,255,244,0.55)]">Fund the escrow to go live</p>
          <p className="data-xl mt-2 text-ivory">{takaFromPoisha(campaign.budgetPoisha)}</p>
          <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed text-[rgba(255,255,244,0.75)]">
            Transfer the budget to Klipr (bank or bKash, details arrive by
            email). The moment our team confirms it, the campaign appears in
            the marketplace and vetted pages start posting. Unspent budget is
            refunded when the campaign completes.
          </p>
        </GlassPanel>
      )}

      <div className="grid gap-5 sm:grid-cols-4">
        <GlassPanel className="p-5">
          <StatTile label="Verified views (settled)" value={settledViews} />
        </GlassPanel>
        <GlassPanel className="p-5">
          <StatTile label="Counting now" value={liveCounted} foot={`${live.length} live clips`} />
        </GlassPanel>
        <GlassPanel className="p-5">
          <StatTile label="Spent" value={poishaToTaka(campaign.spentPoisha)} prefix="৳" />
        </GlassPanel>
        <GlassPanel className="p-5">
          <p className="eyebrow">Cost / view</p>
          <p className="data-xl mt-2 text-text-hi">{costPerView ? `৳${costPerView}` : "—"}</p>
          <p className="mt-1.5 text-[12.5px] text-text-mid">only verified views are charged</p>
        </GlassPanel>
      </div>

      <GlassPanel className="p-6">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Budget</p>
          <p className="data-sm text-text-mid">
            {takaFromPoisha(campaign.budgetPoisha - campaign.spentPoisha)} remaining of{" "}
            {takaFromPoisha(campaign.budgetPoisha)}
          </p>
        </div>
        <BudgetBar spent={campaign.spentPoisha} total={campaign.budgetPoisha} className="mt-3" />
        <div className="mt-5 flex flex-wrap gap-2">
          {campaign.allowedPlatforms.map((p) => (
            <span key={p} className="glass-well rounded-full px-3 py-1.5 text-[12px] text-text-mid">
              {PLATFORMS[p].surface}
            </span>
          ))}
          <span className="glass-well rounded-full px-3 py-1.5 font-mono text-[11px] text-text-mid">
            min {fmtViews(campaign.minQualifyViews)} views to qualify
          </span>
          <span className="glass-well rounded-full px-3 py-1.5 font-mono text-[11px] text-text-mid">
            ৳60 / 1,000 verified
          </span>
        </div>
      </GlassPanel>

      <GlassPanel className="p-6">
        <p className="eyebrow mb-4">Top clips (by locked views)</p>
        {topClips.length === 0 ? (
          <p className="text-[13.5px] text-text-mid">
            Nothing settled yet. Results appear as tracking windows close.
          </p>
        ) : (
          <ol className="space-y-2.5">
            {topClips.map((s, i) => (
              <li key={s.id} className="glass-well flex items-center gap-4 px-4 py-3">
                <span className="font-mono text-[12px] text-text-low">#{i + 1}</span>
                <a
                  href={s.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-volt-500 hover:text-volt-400"
                >
                  {s.postUrl.replace(/^https:\/\/(www\.)?/, "")}
                </a>
                <span className="data-sm text-text-hi">{fmtViews(s.lockedViews ?? 0)}</span>
              </li>
            ))}
          </ol>
        )}
      </GlassPanel>
    </div>
  );
}
