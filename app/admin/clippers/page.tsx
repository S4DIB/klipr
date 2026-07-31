import type { Metadata } from "next";
import { listProfiles } from "@/lib/db";
import type { Profile } from "@/lib/db/types";
import { GlassPanel } from "@/components/app/glass-panel";
import { TierBadge } from "@/components/app/tier-badge";
import { StatusChip } from "@/components/app/status-chip";
import { EmptyState } from "@/components/app/empty-state";
import { verifyNid, toggleBlock } from "./actions";

export const metadata: Metadata = { title: "Clippers · Admin" };

/** The three post-approval onboarding steps, mirroring app/onboarding/page.tsx. */
const ONBOARDING_STEPS = ["Connect pages", "Payout", "Your tier"];

/**
 * Where a clipper/agency stands in setup. Only "active" accounts have reached
 * onboarding; everyone else is still waiting on marketplace access.
 */
function onboardingChip(p: Profile): { label: string; className: string } {
  if (p.access !== "active") {
    return { label: "Awaiting access", className: "bg-[rgba(53,5,90,0.06)] text-text-low" };
  }
  if (p.profileCompleted) {
    return { label: "Onboarded", className: "bg-[rgba(10,143,79,0.12)] text-ok" };
  }
  const step = Math.min(p.onboardingStep ?? 0, ONBOARDING_STEPS.length - 1);
  return {
    label: `Setup · ${ONBOARDING_STEPS[step]}`,
    className: "bg-[rgba(125,4,215,0.1)] text-volt-500",
  };
}

export default async function AdminClippersPage() {
  const all = await listProfiles();
  const earners = all
    .filter((p) => p.role === "clipper" || p.role === "agency")
    .sort((a, b) => b.xpTotal - a.xpTotal);

  const onboarded = earners.filter((p) => p.access === "active" && p.profileCompleted).length;
  const inSetup = earners.filter((p) => p.access === "active" && !p.profileCompleted).length;
  const awaiting = earners.filter((p) => p.access !== "active").length;

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">05 / Clippers</p>
        <h1 className="display-1 mt-1 text-[32px] text-text-hi">The network.</h1>
        <p className="mt-1 text-[13.5px] text-text-mid">
          NID verification unblocks first payouts. Blocking stops submissions
          immediately.
        </p>
        {earners.length > 0 && (
          <p className="mt-2 font-mono text-[11.5px] text-text-mid">
            Onboarding · {onboarded} onboarded · {inSetup} in setup · {awaiting} awaiting access
          </p>
        )}
      </header>

      <GlassPanel className="p-3">
        {earners.length === 0 ? (
          <EmptyState title="No clippers yet" line="Approved applicants appear here." />
        ) : (
          <div className="divide-y divide-[rgba(53,5,90,0.06)]">
            {earners.map((p) => {
              const ob = onboardingChip(p);
              return (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-3 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-text-hi">
                    {p.displayName}
                    <TierBadge tier={p.tier} size="sm" />
                    {p.role === "agency" && (
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-text-low">
                        network manager
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${ob.className}`}
                    >
                      {ob.label}
                    </span>
                    {p.accountStatus === "blocked" && <StatusChip status="blocked" />}
                  </p>
                  <p className="mt-0.5 font-mono text-[11.5px] text-text-mid">
                    {p.xpTotal.toLocaleString("en-US")} XP · streak {p.streakWeeks}w ·{" "}
                    access {p.access} · NID {p.nidStatus}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {p.nidStatus === "submitted" && (
                    <form action={verifyNid}>
                      <input type="hidden" name="profileId" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-full bg-[rgba(10,143,79,0.12)] px-3.5 py-1.5 text-[12.5px] font-semibold text-ok transition-colors hover:bg-[rgba(10,143,79,0.2)]"
                      >
                        Verify NID
                      </button>
                    </form>
                  )}
                  <form action={toggleBlock}>
                    <input type="hidden" name="profileId" value={p.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-[rgba(255,123,192,0.6)] px-3.5 py-1.5 text-[12.5px] font-semibold text-text-hi transition-colors hover:bg-[rgba(255,123,192,0.14)]"
                    >
                      {p.accountStatus === "blocked" ? "Unblock" : "Block"}
                    </button>
                  </form>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
