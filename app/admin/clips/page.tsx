import type { Metadata } from "next";
import { getCampaign, getConnectedAccount, getProfile, listSubmissions } from "@/lib/db";
import { getAdapter } from "@/lib/verify";
import { GlassPanel } from "@/components/app/glass-panel";
import { StatusChip } from "@/components/app/status-chip";
import { EmptyState } from "@/components/app/empty-state";
import { PLATFORMS } from "@/lib/platforms";
import { takaFromPoisha, dhakaDate } from "@/lib/format";
import { SettleClipForm } from "./settle-form";
import { rejectClip } from "./actions";

export const metadata: Metadata = { title: "Clips · Admin" };

/** Manual clip review — enter each clip's verified view count to settle it. */
export default async function AdminClipsPage() {
  const tracking = (await listSubmissions({ status: "tracking" }))
    .filter((s) => getAdapter(s.platform).mode() === "manual")
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  const cases = await Promise.all(
    tracking.map(async (sub) => {
      const [campaign, profile, account] = await Promise.all([
        getCampaign(sub.campaignId),
        getProfile(sub.profileId),
        getConnectedAccount(sub.connectedAccountId),
      ]);
      return { sub, campaign, profile, account };
    }),
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">03 / Clip verification</p>
        <h1 className="display-1 mt-1 text-[32px] text-text-hi">Count the views.</h1>
        <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-text-mid">
          Open each clip, read its real view count, and enter it to settle — that number pays the
          clipper at the campaign rate. Reject if the clip breaks the brief or the views
          can&rsquo;t be verified.
        </p>
      </header>

      {cases.length === 0 ? (
        <GlassPanel>
          <EmptyState title="No clips waiting" line="Submitted clips show up here for review." />
        </GlassPanel>
      ) : (
        cases.map(({ sub, campaign, profile, account }) => (
          <GlassPanel key={sub.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusChip status="tracking" />
                  <span className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-text-mid">
                    {PLATFORMS[sub.platform].label}
                  </span>
                  <span className="text-[12px] text-text-low">
                    submitted {dhakaDate(sub.submittedAt)}
                  </span>
                </div>
                <p className="mt-2 text-[14.5px] font-medium text-text-hi">
                  {campaign?.name ?? "Campaign"}
                  {campaign?.brandName ? ` · ${campaign.brandName}` : ""}
                </p>
                <p className="mt-0.5 text-[12.5px] text-text-mid">
                  {profile?.displayName ?? "Unknown"} · {account?.handle ?? "?"} ·{" "}
                  <a
                    href={sub.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-volt-500 underline decoration-[rgba(125,4,215,0.35)] underline-offset-2"
                  >
                    open post ↗
                  </a>
                </p>
                <p className="mt-2 font-mono text-[11.5px] text-text-low">
                  {campaign ? takaFromPoisha(campaign.rateClipperPer1k) : "—"} / 1,000 views · min{" "}
                  {campaign?.minQualifyViews.toLocaleString("en-US") ?? "—"} to qualify
                </p>
              </div>
              <div className="flex flex-col items-end gap-2.5">
                <SettleClipForm submissionId={sub.id} />
                <form action={rejectClip}>
                  <input type="hidden" name="submissionId" value={sub.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-[rgba(255,123,192,0.16)] px-4 py-2 text-[12.5px] font-semibold text-text-hi transition-colors hover:bg-[rgba(255,123,192,0.28)]"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </div>
          </GlassPanel>
        ))
      )}
    </div>
  );
}
