import type { Metadata } from "next";
import { requireActiveClipper } from "@/lib/auth/guards";
import {
  latestApplicationForProfile,
  ledgerBalance,
  listApplicationPages,
  listConnectedAccounts,
  listSubmissions,
  listVettedPagesForProfile,
  xpByAccount,
} from "@/lib/db";
import { clipperAccount } from "@/lib/ledger";
import { GlassPanel } from "@/components/app/glass-panel";
import { StatusChip } from "@/components/app/status-chip";
import { TierBadge } from "@/components/app/tier-badge";
import { EmptyState } from "@/components/app/empty-state";
import { AddAccountSheet } from "@/components/app/add-account-sheet";
import { IconClock } from "@/components/icons";
import { PLATFORMS } from "@/lib/platforms";
import { views as fmtViews, takaFromPoisha } from "@/lib/format";
import { tierFor, nextTier } from "@/lib/xp";
import { connectVettedPage } from "@/app/onboarding/actions";

export const metadata: Metadata = { title: "Accounts" };

/**
 * Clipper: vetted pages + their connection state.
 * Agency: the Network Manager. Per-page XP & tier roster; payouts roll up
 * into a single transfer.
 */
export default async function ConnectionsPage() {
  const user = await requireActiveClipper();
  const [vetted, accounts, xpPerAccount, application] = await Promise.all([
    listVettedPagesForProfile(user.id),
    listConnectedAccounts(user.id),
    xpByAccount(user.id),
    latestApplicationForProfile(user.id),
  ]);
  // Include pending (awaiting admin approval) as well as active — a page with a
  // pending account shows "In review", not another Connect button.
  const accountByPage = new Map(
    accounts.filter((a) => a.status !== "revoked").map((a) => [a.applicationPageId, a]),
  );
  const isAgency = user.role === "agency";

  if (!isAgency) {
    /* ── Clipper: simple vetted-pages list ── */
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-[14px] lg:max-w-none">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink-900">
            Connected accounts
          </h1>
          <AddAccountSheet />
        </header>

        {vetted.length === 0 ? (
          <GlassPanel>
            <EmptyState
              title="No vetted accounts"
              line="Pages get vetted during your application review."
            />
          </GlassPanel>
        ) : (
          <div className="grid grid-cols-1 gap-[14px] lg:grid-cols-2">
          {vetted.map((page) => {
            const acc = accountByPage.get(page.id);
            return (
              <GlassPanel key={page.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-ink-900">{page.handle}</p>
                    <p className="mt-0.5 text-[12px] text-ink-500">
                      {PLATFORMS[page.platform].surface} · {page.niche}
                      {acc?.followerCount ? ` · ${fmtViews(acc.followerCount)} followers` : ""}
                    </p>
                  </div>
                  {acc?.status === "active" ? (
                    <StatusChip status="active" label="Connected" />
                  ) : acc?.status === "pending" ? (
                    <StatusChip status="pending" label="In review" />
                  ) : (
                    <StatusChip status="approved" label="Vetted" />
                  )}
                </div>
                {acc?.status === "pending" && (
                  <p className="mt-2 text-[12px] text-ink-500">
                    We&rsquo;re confirming this page is yours. You can submit clips once it&rsquo;s
                    approved.
                  </p>
                )}
                {!acc && (
                  <form action={connectVettedPage} className="mt-3.5">
                    <input type="hidden" name="pageId" value={page.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-volt-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-violet-700"
                    >
                      Connect
                    </button>
                  </form>
                )}
              </GlassPanel>
            );
          })}
          </div>
        )}
      </div>
    );
  }

  /* ── Agency: Network Manager ── */
  const allPages = application ? await listApplicationPages(application.id) : [];
  const pendingPages = allPages.filter((p) => p.vetStatus === "pending");
  const subs = await listSubmissions({ profileId: user.id });
  const balance = await ledgerBalance(clipperAccount(user.id));

  const viewsByAccount = new Map<string, number>();
  for (const s of subs) {
    const settledV = s.status === "settled" ? (s.lockedViews ?? 0) : 0;
    viewsByAccount.set(
      s.connectedAccountId,
      (viewsByAccount.get(s.connectedAccountId) ?? 0) + settledV,
    );
  }
  const liveClips = subs.filter((s) => s.status === "tracking" || s.status === "held").length;
  const verifiedViews = [...viewsByAccount.values()].reduce((a, v) => a + v, 0);

  const roster = vetted
    .map((page) => {
      const acc = accountByPage.get(page.id);
      const xp = acc ? (xpPerAccount[acc.id] ?? 0) : 0;
      const tier = tierFor(xp, { cleanRecord: true, streakWeeks: user.streakWeeks });
      const upcoming = nextTier(tier);
      const pct = upcoming ? Math.min(100, Math.round((xp / upcoming.threshold) * 100)) : 100;
      return { page, acc, xp, tier, pct };
    })
    .sort((a, b) => b.xp - a.xp);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="eyebrow text-violet-600">Agency · {user.orgName || user.displayName}</p>
        <h1 className="mt-1 text-[28px] font-extrabold tracking-[-0.02em] text-ink-900">
          Network Manager
        </h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-600">
          Every page in your roster is vetted individually. XP and tier are tracked per page;
          payouts roll up into a single transfer.
        </p>
      </header>

      {/* stat grid. Rolled-up balance is the one ink tile */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <GlassPanel variant="ink" className="p-4">
          <p className="eyebrow text-[rgba(255,255,244,0.6)]">Rolled-up balance</p>
          <p className="mt-2 font-mono text-[28px] font-semibold [font-variant-numeric:tabular-nums]">
            {takaFromPoisha(balance)}
          </p>
        </GlassPanel>
        <GlassPanel className="p-4">
          <p className="eyebrow">Vetted pages</p>
          <p className="mt-2 font-mono text-[28px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
            {vetted.length}{" "}
            {allPages.length > vetted.length ? (
              <span className="text-[14px] text-ink-400">/ {allPages.length}</span>
            ) : null}
          </p>
        </GlassPanel>
        <GlassPanel className="p-4">
          <p className="eyebrow">Live clips</p>
          <p className="mt-2 font-mono text-[28px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
            {liveClips}
          </p>
        </GlassPanel>
        <GlassPanel className="p-4">
          <p className="eyebrow">Verified views</p>
          <p className="mt-2 font-mono text-[28px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
            {fmtViews(verifiedViews)}
          </p>
        </GlassPanel>
      </div>

      {/* roster */}
      <GlassPanel className="p-5">
        <span className="eyebrow">01 / Roster · per-page XP &amp; tier</span>
        {roster.length === 0 && pendingPages.length === 0 ? (
          <EmptyState
            title="No pages in the roster"
            line="Pages get vetted during your application review."
          />
        ) : (
          <div className="mt-2 overflow-x-auto">
            <div className="min-w-[680px]">
              {roster.map(({ page, acc, xp, tier, pct }, i) => (
                <div
                  key={page.id}
                  className={
                    i < roster.length - 1 || pendingPages.length > 0
                      ? "grid grid-cols-[2fr_1fr_1.4fr_1fr_1fr] items-center gap-3 border-b border-[rgba(53,5,90,0.06)] py-3.5"
                      : "grid grid-cols-[2fr_1fr_1.4fr_1fr_1fr] items-center gap-3 py-3.5"
                  }
                >
                  <div className="flex min-w-0 items-center gap-[11px]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-volt-600 font-mono text-[13px] text-yellow">
                      {page.handle.replace(/^@/, "").charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold text-ink-900">{page.handle}</p>
                      <p className="text-[11px] text-ink-500">
                        {PLATFORMS[page.platform].label} · {page.niche}
                      </p>
                    </div>
                  </div>
                  <TierBadge tier={tier} />
                  <div>
                    <div className="glass-well h-[7px] overflow-hidden rounded-full">
                      <div className="h-full bg-yellow" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 font-mono text-[10.5px] text-ink-500 [font-variant-numeric:tabular-nums]">
                      {xp.toLocaleString("en-US")} XP
                    </p>
                  </div>
                  {acc?.status === "pending" ? (
                    <StatusChip status="pending" label="In review" />
                  ) : acc ? (
                    acc.proof === "simulated" ? (
                      <StatusChip status="simulated" />
                    ) : (
                      <StatusChip status="active" label="Connected" />
                    )
                  ) : (
                    <form action={connectVettedPage}>
                      <input type="hidden" name="pageId" value={page.id} />
                      <button
                        type="submit"
                        className="rounded-full bg-volt-500 px-3.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-violet-700"
                      >
                        Connect
                      </button>
                    </form>
                  )}
                  <span className="font-mono text-[13px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
                    {acc ? fmtViews(viewsByAccount.get(acc.id) ?? 0) : "—"}
                  </span>
                </div>
              ))}

              {pendingPages.map((page, i) => (
                <div
                  key={page.id}
                  className={
                    i < pendingPages.length - 1
                      ? "grid grid-cols-[2fr_1fr_1.4fr_1fr_1fr] items-center gap-3 border-b border-[rgba(53,5,90,0.06)] py-3.5 opacity-70"
                      : "grid grid-cols-[2fr_1fr_1.4fr_1fr_1fr] items-center gap-3 py-3.5 opacity-70"
                  }
                >
                  <div className="flex min-w-0 items-center gap-[11px]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-150 text-ink-400">
                      <IconClock size={16} strokeWidth={1.4} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold text-ink-600">{page.handle}</p>
                      <p className="text-[11px] text-ink-500">
                        {PLATFORMS[page.platform].label} · {page.niche}
                      </p>
                    </div>
                  </div>
                  <StatusChip status="waitlisted" label="In review" />
                  <span className="font-mono text-[11px] text-ink-400">Pending vetting</span>
                  <span className="font-mono text-[11px] text-ink-400">—</span>
                  <span className="font-mono text-[11px] text-ink-400">—</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
