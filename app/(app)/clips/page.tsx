import Link from "next/link";
import type { Metadata } from "next";
import { requireActiveClipper } from "@/lib/auth/guards";
import { getCampaignsByIds, listConnectedAccounts, listSubmissions } from "@/lib/db";
import { GlassPanel } from "@/components/app/glass-panel";
import { StatusChip } from "@/components/app/status-chip";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { IconPlay } from "@/components/icons";
import { PLATFORMS } from "@/lib/platforms";
import { takaFromPoisha } from "@/lib/format";

export const metadata: Metadata = { title: "My clips" };

export default async function ClipsPage() {
  const user = await requireActiveClipper();
  const [subs, accounts] = await Promise.all([
    listSubmissions({ profileId: user.id }),
    listConnectedAccounts(user.id),
  ]);
  subs.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const accountById = new Map(accounts.map((a) => [a.id, a]));

  // One query for every referenced campaign, instead of a serial getCampaign per clip.
  const campaignRows = await getCampaignsByIds([...new Set(subs.map((s) => s.campaignId))]);
  const campaignNames = new Map(campaignRows.map((c) => [c.id, c.name] as const));

  const isAgency = user.role === "agency";

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-[14px] lg:max-w-none">
      <header>
        <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink-900">Clips</h1>
        <p className="mt-1 text-[13px] text-ink-500">
          Views are read straight from the platform. Counted = views since you submitted.
        </p>
      </header>

      <GlassPanel className="p-4">
        {subs.length === 0 ? (
          <EmptyState
            title="No clips yet"
            line="Pick a campaign, post the clip to your page, paste the link back."
            action={
              <Button href="/campaigns" variant="secondary" className="h-10 px-5 text-[13.5px]">
                Browse campaigns
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-1">
            {subs.map((s) => {
              const acc = accountById.get(s.connectedAccountId);
              return (
                <Link
                  key={s.id}
                  href={`/clips/${s.id}`}
                  className="liftrow flex items-center gap-3 rounded-[12px] p-2.5"
                >
                  <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] bg-[#111] text-white">
                    <IconPlay size={20} strokeWidth={1.4} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-ink-900">
                      {campaignNames.get(s.campaignId)}
                    </span>
                    <span className="block truncate text-[12px] text-ink-500">
                      {PLATFORMS[s.platform].surface}
                      {isAgency && acc ? ` · ${acc.handle}` : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-mono text-[15px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
                      {(s.status === "settled" ? (s.lockedViews ?? 0) : s.countedViews).toLocaleString(
                        "en-US",
                      )}
                    </span>
                    {s.status === "settled" && s.earnedPoisha !== undefined ? (
                      <span className="font-mono text-[11px] font-semibold text-success-600 [font-variant-numeric:tabular-nums]">
                        +{takaFromPoisha(s.earnedPoisha)}
                      </span>
                    ) : (
                      <StatusChip status={s.status} />
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
