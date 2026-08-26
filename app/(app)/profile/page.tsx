import type { Metadata } from "next";
import { requireActiveClipper } from "@/lib/auth/guards";
import {
  ledgerBalance,
  listConnectedAccounts,
  listPayoutBatches,
  listSubmissions,
} from "@/lib/db";
import { TierBadge } from "@/components/app/tier-badge";
import { clipperAccount } from "@/lib/ledger";
import { nextTier } from "@/lib/xp";
import { GlassPanel } from "@/components/app/glass-panel";
import { CoverControls } from "./cover-controls";
import { PersonalPanel } from "@/app/(app)/settings/personal-form";
import { Button } from "@/components/ui/button";
import { IconFire } from "@/components/icons";
import { takaFromPoisha, views as fmtViews } from "@/lib/format";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireActiveClipper();

  const [balance, batches, subs, accounts] = await Promise.all([
    ledgerBalance(clipperAccount(user.id)),
    listPayoutBatches({ profileId: user.id }),
    listSubmissions({ profileId: user.id }),
    listConnectedAccounts(user.id),
  ]);
  const paidOut = batches
    .filter((b) => b.status === "paid")
    .reduce((a, b) => a + b.amountPoisha, 0);
  const lifetime = balance + paidOut;

  const settledViews = subs
    .filter((s) => s.status === "settled")
    .reduce((a, s) => a + (s.lockedViews ?? 0), 0);
  const activePages = accounts.filter((a) => a.status === "active").length;

  const upcoming = nextTier(user.tier);
  const xpPct = upcoming ? Math.min(100, Math.round((user.xpTotal / upcoming.threshold) * 100)) : 100;
  const nextLabel = upcoming
    ? upcoming.tier.charAt(0).toUpperCase() + upcoming.tier.slice(1)
    : undefined;

  const initial = (user.displayName || "K").trim().charAt(0).toUpperCase();
  const joined = new Date(user.createdAt).toLocaleDateString("en-US", {
    timeZone: "Asia/Dhaka",
    month: "short",
    year: "numeric",
  });

  const stats = [
    { label: "Pages", value: String(activePages) },
    { label: "Clips", value: String(subs.length) },
    { label: "Verified views", value: fmtViews(settledViews) },
    { label: "Earned", value: takaFromPoisha(lifetime) },
    { label: "XP", value: user.xpTotal.toLocaleString("en-US") },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 sm:max-w-none">
      {/* profile header — cover · avatar · name · XP · stats */}
      <GlassPanel className="overflow-hidden">
        <div className="field-cover relative h-[112px] sm:h-[148px]">
          <CoverControls coverUrl={user.coverUrl} />
        </div>

        <div className="relative px-5 pb-5 sm:px-7 sm:pb-6">
          {/* avatar — straddles the cover edge */}
          <span className="absolute -top-[44px] left-5 flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full bg-volt-600 font-mono text-[32px] text-yellow shadow-[0_12px_28px_-10px_rgba(31,3,53,0.35)] ring-4 ring-white sm:-top-[52px] sm:left-7 sm:h-[104px] sm:w-[104px] sm:text-[38px]">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              initial
            )}
          </span>

          {/* spacer row beside the avatar — the quiet action lives here */}
          <div className="flex min-h-[44px] items-start justify-end sm:min-h-[52px]">
            <Button href="/settings" variant="ghost" className="mt-2.5 h-9 px-4 text-[13px] sm:mt-3 sm:h-10 sm:px-5 sm:text-[13.5px]">
              Account settings
            </Button>
          </div>

          <h1 className="mt-2 text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink-900 sm:text-[26px]">
            {user.displayName}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <TierBadge tier={user.tier} />
            {user.username ? (
              <span className="text-[12.5px] text-ink-500">@{user.username}</span>
            ) : null}
            {user.streakWeeks > 0 ? (
              <span className="flex items-center gap-1.5 text-[12px] font-bold text-warning-600">
                <span className="flame" aria-hidden="true">
                  <IconFire size={15} strokeWidth={1.4} />
                </span>
                {user.streakWeeks}-week streak
              </span>
            ) : null}
            <span className="text-[12.5px] text-ink-500">Joined {joined}</span>
          </div>

          {/* tier progress */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div
              className="glass-well h-2 min-w-[140px] flex-1 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={user.xpTotal}
              aria-valuemin={0}
              aria-valuemax={upcoming?.threshold ?? user.xpTotal}
              aria-label={nextLabel ? `XP progress to ${nextLabel}` : "XP"}
            >
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--yellow),#ecf230)]"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <span className="font-mono text-[12px] text-ink-500 [font-variant-numeric:tabular-nums]">
              <span className="font-semibold text-ink-900">
                {user.xpTotal.toLocaleString("en-US")}
              </span>
              {upcoming ? (
                <> / {upcoming.threshold.toLocaleString("en-US")} XP to {nextLabel}</>
              ) : (
                <> XP</>
              )}
            </span>
          </div>

          {/* stats strip */}
          <div className="mt-5 grid grid-cols-3 gap-y-4 border-t border-[rgba(53,5,90,0.07)] pt-4 sm:grid-cols-5">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={
                  "px-2 text-center sm:border-l sm:border-[rgba(53,5,90,0.07)]" +
                  (i === 0 ? " sm:border-l-0" : "")
                }
              >
                <p className="font-mono text-[17px] font-bold tracking-[-0.02em] text-ink-900 [font-variant-numeric:tabular-nums] sm:text-[19px] xl:text-[21px]">
                  {s.value}
                </p>
                <p className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>

      {/* the only settings that live here: who you are. Payouts, notifications,
          identity and closing the account stay on /settings. */}
      <div className="rounded-[22px] bg-white p-6 shadow-[0_1px_2px_rgba(31,3,53,0.04)] sm:p-7">
        <PersonalPanel
          personal={{
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            location: user.location,
            postLanguages: user.postLanguages,
          }}
          email={user.email}
          tier={user.tier}
          initial={initial}
          showIdentity={false}
        />
      </div>
    </div>
  );
}
