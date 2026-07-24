import Link from "next/link";
import type { Metadata } from "next";
import { requireActiveClipper } from "@/lib/auth/guards";
import {
  getCampaign,
  ledgerBalance,
  listConnectedAccounts,
  listPayoutBatches,
  listSnapshots,
  listSubmissions,
} from "@/lib/db";
import { Sparkline } from "@/components/ui/sparkline";
import { StatusChip } from "@/components/app/status-chip";
import { clipperAccount } from "@/lib/ledger";
import { nextTier } from "@/lib/xp";
import { GlassPanel } from "@/components/app/glass-panel";
import { SetupChecklist } from "@/components/app/setup-checklist";
import { Button } from "@/components/ui/button";
import {
  IconAdd,
  IconFire,
  IconMegaphone,
  IconPlay,
  IconUpload,
  IconWallet,
} from "@/components/icons";
import { takaFromPoisha, views as fmtViews } from "@/lib/format";
import { PLATFORMS } from "@/lib/platforms";

export const metadata: Metadata = { title: "Home" };

/** Big ink-hero money: integer part large, decimals faded. */
function BalancePoisha({ poisha }: { poisha: number }) {
  const whole = Math.floor(Math.abs(poisha) / 100);
  const rem = Math.abs(poisha) % 100;
  return (
    <span className="font-mono text-[38px] font-semibold tracking-[-0.02em] [font-variant-numeric:tabular-nums]">
      {poisha < 0 ? "−" : ""}৳{whole.toLocaleString("en-US")}
      <span className="text-[16px] text-[rgba(255,255,244,0.5)]">
        .{String(rem).padStart(2, "0")}
      </span>
    </span>
  );
}

const QUICK_ACTIONS = [
  {
    href: "/campaigns",
    icon: IconMegaphone,
    title: "Browse campaigns",
    line: "Find a live campaign and grab the clip.",
  },
  {
    href: "/campaigns",
    icon: IconUpload,
    title: "Submit clips",
    line: "Add clips to campaigns you've joined.",
  },
  {
    href: "/wallet",
    icon: IconWallet,
    title: "Manage earnings",
    line: "Set up your payout method and cash out.",
  },
];

export default async function HomePage() {
  const user = await requireActiveClipper();

  const [balance, batches, subs, accounts] = await Promise.all([
    ledgerBalance(clipperAccount(user.id)),
    listPayoutBatches({ profileId: user.id }),
    listSubmissions({ profileId: user.id }),
    listConnectedAccounts(user.id),
  ]);
  const held = batches
    .filter((b) => b.status === "queued" || b.status === "blocked_nid" || b.status === "processing")
    .reduce((a, b) => a + b.amountPoisha, 0);
  const available = balance - held;
  const paidOut = batches
    .filter((b) => b.status === "paid")
    .reduce((a, b) => a + b.amountPoisha, 0);
  const lifetime = balance + paidOut;

  const settledViews = subs
    .filter((s) => s.status === "settled")
    .reduce((a, s) => a + (s.lockedViews ?? 0), 0);
  const activePages = accounts.filter((a) => a.status === "active").length;

  // getting-started checklist — real state, hidden once every step is done
  const setupSteps = [
    {
      title: "Connect a page",
      subtitle: "TikTok, YouTube, Instagram or Facebook.",
      done: activePages > 0,
      icon: "link" as const,
      actionLabel: "Connect",
      href: "/connections",
    },
    {
      title: "Set up bKash payouts",
      subtitle: "So your earnings have somewhere to land.",
      done: Boolean(user.bkashNumber),
      icon: "wallet" as const,
      actionLabel: "Add bKash",
      href: "/settings",
    },
    {
      title: "Claim your first campaign",
      subtitle: "Grab a ready-made clip and post it.",
      done: subs.length > 0,
      icon: "megaphone" as const,
      actionLabel: "Browse",
      href: "/campaigns",
    },
  ];

  // top clips. Most verified/counted views first, real data only
  const topClips = [...subs]
    .sort(
      (a, b) =>
        (b.lockedViews ?? b.countedViews) - (a.lockedViews ?? a.countedViews),
    )
    .slice(0, 5);
  // video analytics — verified view curves from real snapshots only
  const recent = [...subs]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 6);
  const now = Date.now();
  const analytics = await Promise.all(
    recent.map(async (s) => {
      const snaps = await listSnapshots(s.id);
      const series = snaps.map((sn) => Math.max(0, sn.views - s.baselineViews));
      const current = s.status === "settled" ? (s.lockedViews ?? 0) : s.countedViews;
      const atCutoff = [...snaps]
        .reverse()
        .find((sn) => new Date(sn.capturedAt).getTime() <= now - 86400_000);
      const countedAtCutoff = atCutoff ? Math.max(0, atCutoff.views - s.baselineViews) : 0;
      const today = snaps.length > 0 ? Math.max(0, (series.at(-1) ?? 0) - countedAtCutoff) : 0;
      return { sub: s, series, current, today };
    }),
  );
  const viewsToday = analytics.reduce((a, r) => a + r.today, 0);

  const campaignNames = new Map<string, string>();
  await Promise.all(
    [...new Set([...topClips, ...recent].map((s) => s.campaignId))].map(async (cid) => {
      const c = await getCampaign(cid);
      if (c) campaignNames.set(cid, c.name);
    }),
  );

  const upcoming = nextTier(user.tier);
  const xpPct = upcoming ? Math.min(100, Math.round((user.xpTotal / upcoming.threshold) * 100)) : 100;
  const tierLabel = user.tier.charAt(0).toUpperCase() + user.tier.slice(1);
  const nextLabel = upcoming
    ? upcoming.tier.charAt(0).toUpperCase() + upcoming.tier.slice(1)
    : undefined;

  const stats = [
    { label: "Pages", value: String(activePages) },
    { label: "Clips", value: String(subs.length) },
    { label: "Verified views", value: fmtViews(settledViews) },
    { label: "Earned", value: takaFromPoisha(lifetime) },
    { label: "XP", value: user.xpTotal.toLocaleString("en-US") },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 lg:max-w-none">
      {/* getting-started checklist — new accounts only, hides when complete */}
      <SetupChecklist steps={setupSteps} />

      {/* xp strip. Thin tier progress bar */}
      <GlassPanel className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
        <span className="text-[15px] font-extrabold tracking-[-0.01em] text-ink-900">
          {tierLabel}
        </span>
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
          {upcoming ? <> / {upcoming.threshold.toLocaleString("en-US")} XP</> : <> XP</>}
        </span>
        {user.streakWeeks > 0 ? (
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-warning-600">
            <span className="flame" aria-hidden="true">
              <IconFire size={15} strokeWidth={1.4} />
            </span>
            {user.streakWeeks}-week streak
          </span>
        ) : null}
      </GlassPanel>

      {/* quick actions */}
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-3">
        {QUICK_ACTIONS.map(({ href, icon: Icon, title, line }) => (
          <Link key={title} href={href} className="block">
            <GlassPanel interactive className="h-full p-5">
              <p className="flex items-center gap-2.5 text-[16px] font-extrabold tracking-[-0.01em] text-ink-900">
                <Icon size={20} strokeWidth={1.4} className="text-violet-600" />
                {title}
              </p>
              <p className="mt-2 text-[13px] leading-[1.5] text-ink-500">{line}</p>
            </GlassPanel>
          </Link>
        ))}
      </div>

      {/* my stats */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink-900">
              My stats
            </h2>
            <p className="text-[13px] text-ink-500">Post clips and watch your stats grow</p>
          </div>
          <Button href="/connections" variant="secondary" className="h-10 px-5 text-[13.5px]">
            Connect accounts
          </Button>
        </div>
        <div className="mt-3.5 grid grid-cols-2 gap-[14px] sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <GlassPanel key={s.label} className="p-4">
              <p className="text-[13.5px] font-semibold text-ink-700">{s.label}</p>
              <p className="mt-5 text-right font-mono text-[24px] font-bold text-ink-900 [font-variant-numeric:tabular-nums]">
                {s.value}
              </p>
            </GlassPanel>
          ))}
        </div>
      </section>

      {/* video analytics — real snapshot curves, never fabricated */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink-900">
              Video analytics
            </h2>
            <p className="text-[13px] text-ink-500">Verified views across your clips</p>
          </div>
          {viewsToday > 0 ? (
            <p className="text-[13px] font-bold text-success-600">
              +{viewsToday.toLocaleString("en-US")} views today
            </p>
          ) : null}
        </div>

        <GlassPanel className="mt-3.5 p-4">
          {analytics.length === 0 ? (
            <p className="px-1 py-6 text-center text-[13px] text-ink-500">
              Analytics appear once your first clip starts tracking.
            </p>
          ) : (
            <div className="flex flex-col">
              {analytics.map(({ sub, series, current, today }, i) => (
                <Link
                  key={sub.id}
                  href={`/clips/${sub.id}`}
                  className={
                    "liftrow grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-[12px] px-2.5 py-3 sm:grid-cols-[1.3fr_minmax(150px,1fr)_auto]" +
                    (i < analytics.length - 1 ? " border-b border-[rgba(53,5,90,0.06)]" : "")
                  }
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-bold text-ink-900">
                      {campaignNames.get(sub.campaignId) ?? "Clip"}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-500">
                      {PLATFORMS[sub.platform].label}
                      <StatusChip status={sub.status} />
                    </span>
                  </span>
                  <span className="col-span-2 sm:col-span-1">
                    {series.length >= 2 ? (
                      <Sparkline
                        points={series}
                        width={220}
                        height={44}
                        stroke="var(--violet-600)"
                        className="block h-[44px] w-full"
                      />
                    ) : (
                      <span className="block text-[11px] text-ink-400">
                        Curve appears after the first snapshots land.
                      </span>
                    )}
                  </span>
                  <span className="text-right">
                    <span className="block font-mono text-[15px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
                      {current.toLocaleString("en-US")}
                    </span>
                    {today > 0 ? (
                      <span className="block font-mono text-[11px] font-semibold text-success-600 [font-variant-numeric:tabular-nums]">
                        +{today.toLocaleString("en-US")} today
                      </span>
                    ) : (
                      <span className="block text-[11px] text-ink-400">
                        {sub.status === "settled" ? "settled" : "no views today"}
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </GlassPanel>
      </section>

      {/* wallet. The one ink surface */}
      <GlassPanel variant="ink" className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <span className="eyebrow text-[rgba(255,255,244,0.6)]">Wallet</span>
          <div className="mt-1.5">
            <BalancePoisha poisha={available} />
          </div>
          <p className="text-[13px] text-[rgba(255,255,244,0.6)]">Available to withdraw</p>
        </div>
        <div className="flex flex-col items-start gap-2.5 sm:items-end">
          {user.nidStatus !== "verified" ? (
            <span className="rounded-full border border-[rgba(250,255,71,0.25)] bg-[rgba(250,255,71,0.12)] px-2 py-1 text-[11px] font-bold text-yellow">
              NID needed to withdraw
            </span>
          ) : null}
          <Button href="/wallet" variant="highlight" className="h-9 px-4 text-[13.5px]">
            Open wallet
          </Button>
        </div>
      </GlassPanel>

      {/* top clips */}
      <section>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink-900">Top clips</h2>
        <p className="text-[13px] text-ink-500">Your most viewed Klipr clips</p>
        <div className="mt-3.5 flex gap-3.5 overflow-x-auto pb-1">
          {topClips.map((s) => (
            <Link key={s.id} href={`/clips/${s.id}`} className="w-[132px] shrink-0">
              <span className="flex h-[180px] items-center justify-center rounded-[18px] bg-[#111] text-[rgba(255,255,244,0.85)] transition-transform hover:scale-[1.02]">
                <IconPlay size={30} strokeWidth={1.2} />
              </span>
              <span className="mt-2 block truncate text-[12.5px] font-bold text-ink-900">
                {campaignNames.get(s.campaignId) ?? "Clip"}
              </span>
              <span className="block font-mono text-[11.5px] text-ink-500 [font-variant-numeric:tabular-nums]">
                {fmtViews(s.lockedViews ?? s.countedViews)} views ·{" "}
                {PLATFORMS[s.platform].label}
              </span>
            </Link>
          ))}
          <Link href="/campaigns" className="w-[132px] shrink-0" aria-label="Add a clip">
            <span className="flex h-[180px] flex-col items-center justify-center gap-2 rounded-[18px] bg-[rgba(53,5,90,0.05)] text-ink-600 transition-colors hover:bg-[rgba(53,5,90,0.08)] hover:text-ink-900">
              <IconAdd size={22} strokeWidth={1.4} />
              <span className="text-[14px] font-bold">Add</span>
            </span>
          </Link>
        </div>
      </section>

    </div>
  );
}
