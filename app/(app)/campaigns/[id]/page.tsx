import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireActiveClipper } from "@/lib/auth/guards";
import { getCampaign, listConnectedAccounts, listSubmissions } from "@/lib/db";
import { GlassPanel } from "@/components/app/glass-panel";
import { CampaignCover } from "@/components/app/campaign-cover";
import { StatusChip } from "@/components/app/status-chip";
import { SubmitSheet } from "@/components/app/submit-sheet";
import { Button } from "@/components/ui/button";
import { IconCheck, IconChevronLeft, IconClock } from "@/components/icons";
import { PLATFORMS } from "@/lib/platforms";
import { takaFromPoisha, views as fmtViews } from "@/lib/format";
import { remainingBudgetPoisha } from "@/lib/campaign-rules";
import { submissionCap } from "@/lib/xp";

export const metadata: Metadata = { title: "Campaign" };

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireActiveClipper();
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign || campaign.status === "draft" || campaign.status === "pending_funding") notFound();

  const now = new Date().toISOString();

  const [accounts, mySubs] = await Promise.all([
    listConnectedAccounts(user.id),
    listSubmissions({ campaignId: id, profileId: user.id }),
  ]);
  const eligibleAccounts = accounts
    .filter((a) => a.status === "active" && campaign.allowedPlatforms.includes(a.platform))
    .map((a) => ({ id: a.id, platform: a.platform, handle: a.handle, proof: a.proof }));

  const capTotal = submissionCap(campaign.submissionCapBase, user.tier);
  const capUsed = mySubs.filter((s) => s.status !== "rejected").length;
  const accepting = campaign.status === "active" && campaign.endDate > now;
  const urlHint = PLATFORMS[campaign.allowedPlatforms[0] ?? "youtube"].urlHint;
  const remaining = remainingBudgetPoisha(campaign);
  const spentPct =
    campaign.budgetPoisha > 0
      ? Math.min(100, Math.round((campaign.spentPoisha / campaign.budgetPoisha) * 100))
      : 0;
  const rules = campaign.guidelines
    ? campaign.guidelines.split(/\n+/).map((r) => r.trim()).filter(Boolean)
    : [];

  return (
    <div className="mx-auto w-full max-w-[480px] lg:max-w-none">
      <Link
        href="/campaigns"
        className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-600 transition-colors hover:text-ink-900"
      >
        <IconChevronLeft size={16} strokeWidth={1.4} /> Marketplace
      </Link>

      <div className="mt-[14px] flex flex-col gap-[14px] lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-5">
        <div className="flex min-w-0 flex-col gap-[14px]">
      {/* cover — the supplied clip's art (placeholder until a brand uploads real media) */}
      <CampaignCover
        coverUrl={campaign.coverUrl}
        seed={campaign.id}
        rounded="all"
        className="shadow-[var(--shadow-md)]"
      />

      {/* the one ink surface. Brand + campaign header */}
      <GlassPanel variant="ink" className="p-[18px]">
        <p className="eyebrow text-[rgba(255,255,244,0.6)]">{campaign.brandName}</p>
        <h1 className="mt-1 text-[22px] font-extrabold tracking-[-0.02em]">{campaign.name}</h1>
        <div className="mt-2.5 flex flex-wrap gap-[7px]">
          {campaign.allowedPlatforms.map((p) => (
            <span
              key={p}
              className="rounded-full border border-[rgba(255,255,244,0.2)] bg-[rgba(255,255,244,0.12)] px-[9px] py-1 text-[11px] font-bold"
            >
              {PLATFORMS[p].label}
            </span>
          ))}
        </div>
        <p className="mt-3.5 rounded-[12px] bg-[rgba(0,0,0,0.18)] px-3 py-2.5 text-[12.5px] leading-[1.5] text-[rgba(255,255,244,0.7)]">
          Budget is a ceiling. Earnings settle first-come, first-served at each clip&rsquo;s window
          end.
        </p>
      </GlassPanel>

      {/* 3-stat row */}
      <GlassPanel className="flex justify-between p-4">
        <div>
          <p className="font-mono text-[18px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
            {takaFromPoisha(campaign.rateClipperPer1k)}
          </p>
          <p className="text-[11px] text-ink-500">per 1,000 views</p>
        </div>
        <div className="w-px bg-[rgba(53,5,90,0.1)]" />
        <div>
          <p className="font-mono text-[18px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
            {campaign.minQualifyViews.toLocaleString("en-US")}
          </p>
          <p className="text-[11px] text-ink-500">min to qualify</p>
        </div>
        <div className="w-px bg-[rgba(53,5,90,0.1)]" />
        <div>
          <p className="font-mono text-[18px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
            {campaign.trackingWindowDays} days
          </p>
          <p className="text-[11px] text-ink-500">tracking</p>
        </div>
      </GlassPanel>

      {/* budget remaining */}
      <GlassPanel className="p-4">
        <span className="eyebrow">Budget remaining</span>
        <div className="glass-well mt-2.5 h-3.5 overflow-hidden rounded-full">
          <div
            className="h-full bg-[linear-gradient(90deg,var(--mint),var(--yellow))]"
            style={{ width: `${spentPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[12px] text-ink-500 [font-variant-numeric:tabular-nums]">
          <span className="font-semibold text-ink-900">{takaFromPoisha(remaining)} left</span>
          <span>of {takaFromPoisha(campaign.budgetPoisha)}</span>
        </div>
      </GlassPanel>

      {/* the brief */}
      <GlassPanel className="p-4">
        <span className="eyebrow">The brief</span>
        <p className="mt-2.5 text-[13.5px] leading-[1.6] text-ink-700">{campaign.brief}</p>
        {rules.length > 0 ? (
          <div className="mt-3 flex flex-col gap-2">
            {rules.map((rule) => (
              <p key={rule} className="flex gap-[9px] text-[13px] text-ink-800">
                <span className="mt-px shrink-0 text-success-600">
                  <IconCheck size={16} strokeWidth={1.5} />
                </span>
                {rule}
              </p>
            ))}
          </div>
        ) : null}
      </GlassPanel>
        </div>

        <div className="flex flex-col gap-[14px]">
      {/* actions */}
      {accepting ? (
        <>
          <div className="flex gap-2.5">
            <Button
              href={campaign.sourceUrl}
              variant="secondary"
              className="h-11 shrink-0 px-5 text-[14px]"
            >
              Download clip
            </Button>
            <SubmitSheet
              campaignId={campaign.id}
              campaignName={`${campaign.brandName} · ${campaign.name}`}
              accounts={eligibleAccounts}
              urlHint={urlHint}
            />
          </div>
          <p className="text-center text-[12px] text-ink-400">
            {capUsed}/{capTotal} submissions used at your tier
          </p>
        </>
      ) : (
        <GlassPanel variant="well" className="flex items-center gap-2 px-3.5 py-3 text-[13px] text-ink-600">
          <IconClock size={15} /> No longer accepting submissions.
        </GlassPanel>
      )}

      {mySubs.length > 0 && (
        <GlassPanel className="p-4">
          <span className="eyebrow">Your clips here</span>
          <div className="mt-2 flex flex-col gap-1">
            {mySubs.map((s) => (
              <Link
                key={s.id}
                href={`/clips/${s.id}`}
                className="liftrow flex items-center justify-between gap-3 rounded-[12px] px-2.5 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block font-mono text-[14px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
                    {fmtViews(s.countedViews)} views
                  </span>
                  <span className="block text-[12px] text-ink-500">
                    {PLATFORMS[s.platform].surface}
                  </span>
                </span>
                <StatusChip status={s.status} />
              </Link>
            ))}
          </div>
        </GlassPanel>
      )}
        </div>
      </div>
    </div>
  );
}
