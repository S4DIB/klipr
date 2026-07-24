import type { Metadata } from "next";
import { requireActiveClipper } from "@/lib/auth/guards";
import { leaderboard } from "@/lib/db";
import { GlassPanel } from "@/components/app/glass-panel";
import { TierBadge } from "@/components/app/tier-badge";
import { EmptyState } from "@/components/app/empty-state";
import { IconTrophy } from "@/components/icons";
import { views as fmtViews } from "@/lib/format";

export const metadata: Metadata = { title: "Leaderboard" };

/** Top verified earners. Settled views only, opt-outs honored, no padding. */
export default async function LeaderboardPage() {
  const user = await requireActiveClipper();
  const rows = await leaderboard(20);

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">01 / Leaderboard</p>
        <h1 className="display-1 mt-1 text-[32px] text-text-hi">Top verified earners.</h1>
        <p className="mt-1 text-[13.5px] text-text-mid">
          Ranked by settled verified views. The number money was actually paid
          on. Opt out anytime in Settings.
        </p>
      </header>

      <GlassPanel className="p-3">
        {rows.length === 0 ? (
          <EmptyState
            title="No settled clips yet"
            line="The first verified earners will appear here. No padding, no fake names."
          />
        ) : (
          <ol className="divide-y divide-[rgba(53,5,90,0.06)]">
            {rows.map((r, i) => (
              <li
                key={r.profileId}
                className={`flex items-center gap-4 px-4 py-3.5 ${r.profileId === user.id ? "bg-[rgba(250,255,71,0.18)]" : ""}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[13px] ${
                    i === 0
                      ? "bg-yellow text-text-hi"
                      : i < 3
                        ? "bg-[rgba(125,4,215,0.12)] text-volt-500"
                        : "glass-well text-text-mid"
                  }`}
                >
                  {i === 0 ? <IconTrophy size={14} strokeWidth={1.5} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-text-hi">
                  {r.displayName}
                  {r.profileId === user.id ? " · you" : ""}
                </span>
                <TierBadge tier={r.tier} size="sm" />
                <span className="data-sm w-20 text-right text-text-hi">
                  {fmtViews(r.settledViews)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </GlassPanel>
    </div>
  );
}
