import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth/session";
import { routeFor } from "@/lib/auth/guards";
import { listConnectedAccounts, listVettedPagesForProfile } from "@/lib/db";
import { Logo } from "@/components/ui/logo";
import { GlassPanel } from "@/components/app/glass-panel";
import { TierBadge } from "@/components/app/tier-badge";
import { XpBar } from "@/components/app/xp-bar";
import { StatusChip } from "@/components/app/status-chip";
import { Button, ArrowEast } from "@/components/ui/button";
import { IconCheck } from "@/components/icons";
import { PLATFORMS } from "@/lib/platforms";
import { nextTier, XP_CONFIG } from "@/lib/xp";
import { BkashForm } from "./bkash-form";
import { connectVettedPage, continueToPayout, completeOnboarding } from "./actions";

export const metadata: Metadata = { title: "Set up" };

/**
 * Post-approval onboarding: connect vetted pages → payout number → tier
 * welcome. Progress persists in Profile.onboardingStep (refresh-safe).
 */
export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "brand" || user.role === "admin") redirect(routeFor(user));
  if (user.access !== "active") redirect(routeFor(user));
  if (user.profileCompleted) redirect("/home");

  const step = Math.min(user.onboardingStep, 2);
  const [vettedPages, accounts] = await Promise.all([
    listVettedPagesForProfile(user.id),
    listConnectedAccounts(user.id),
  ]);
  const connectedPageIds = new Set(
    accounts.filter((a) => a.status === "active").map((a) => a.applicationPageId),
  );

  const STEPS = ["Connect pages", "Payout", "Your tier"];
  const upcoming = nextTier("beginner");

  return (
    <div className="relative min-h-dvh">
      <div className="field-app fixed inset-0 -z-10" aria-hidden="true" />
      <main className="mx-auto w-full max-w-xl px-5 py-12">
        <Link href="/" className="mb-8 flex justify-center text-text-hi">
          <Logo className="text-[17px]" />
        </Link>

        {/* stepper */}
        <ol className="mb-8 flex items-center justify-center gap-2" aria-label="Setup progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={
                  i <= step
                    ? "flex h-7 w-7 items-center justify-center rounded-full bg-volt-500 font-mono text-[12px] text-white"
                    : "glass-well flex h-7 w-7 items-center justify-center rounded-full font-mono text-[12px] text-text-low"
                }
                aria-current={i === step ? "step" : undefined}
              >
                {i < step ? <IconCheck size={13} className="text-white" strokeWidth={1.6} /> : i + 1}
              </span>
              <span
                className={`hidden text-[12.5px] sm:block ${i <= step ? "text-text-hi" : "text-text-low"}`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="hairline w-6" />}
            </li>
          ))}
        </ol>

        <GlassPanel className="p-6 sm:p-8">
          {step === 0 && (
            <>
              <h1 className="title text-[22px] text-text-hi">Connect your vetted pages.</h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-text-mid">
                Only pages that passed review can be linked. The link is how
                Klipr reads your real views from the platform. No screenshots,
                ever.
              </p>

              <div className="mt-5 space-y-2.5">
                {vettedPages.length === 0 ? (
                  <p className="glass-well px-4 py-3 text-[13px] text-text-mid">
                    No vetted pages on this account yet.
                  </p>
                ) : (
                  vettedPages.map((p) => {
                    const connected = connectedPageIds.has(p.id);
                    return (
                      <div
                        key={p.id}
                        className="glass-well flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-medium text-text-hi">
                            {p.handle}
                          </p>
                          <p className="text-[12px] text-text-low">
                            {PLATFORMS[p.platform].surface}
                          </p>
                        </div>
                        {connected ? (
                          <StatusChip status="active" label="connected" />
                        ) : (
                          <form action={connectVettedPage}>
                            <input type="hidden" name="pageId" value={p.id} />
                            <button
                              type="submit"
                              className="rounded-full bg-volt-500 px-4 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-volt-400"
                            >
                              Connect
                            </button>
                          </form>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <form action={continueToPayout} className="mt-6">
                <Button type="submit" className="w-full">
                  Continue <ArrowEast />
                </Button>
              </form>
              <p className="mt-3 text-center text-[12px] text-text-low">
                You can connect later. But submissions require a linked page.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="title text-[22px] text-text-hi">Where should the money go?</h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-text-mid">
                Earnings settle automatically after each clip&rsquo;s tracking
                window and pay out to bKash.
              </p>
              <div className="mt-5">
                <BkashForm defaultValue={user.bkashNumber} />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="text-center">
              <TierBadge tier="beginner" className="mx-auto" />
              <h1 className="title mt-4 text-[24px] text-text-hi">
                Welcome. You start at Beginner.
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-text-mid">
                Every verified view earns XP. Tiers unlock access and privileges
               . The rate is ৳50 per 1,000 verified views at every tier,
                always.
              </p>
              <div className="mx-auto mt-6 max-w-xs text-left">
                <XpBar xp={user.xpTotal} nextThreshold={upcoming?.threshold} nextTierLabel="Hustler" />
              </div>
              <p className="mt-4 text-[12.5px] text-text-low">
                Hustler unlocks a higher submission cap per campaign
                (currently ×{XP_CONFIG.submissionCapMultiplier.hustler}).
              </p>
              <form action={completeOnboarding} className="mt-7">
                <Button type="submit" className="w-full">
                  Enter Klipr <ArrowEast />
                </Button>
              </form>
            </div>
          )}
        </GlassPanel>
      </main>
    </div>
  );
}
