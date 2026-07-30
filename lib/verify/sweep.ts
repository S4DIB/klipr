/**
 * The sweep — poll · fraud-check · settle · XP · close, idempotently.
 * Runs every ~15 minutes (cron route) and on demand from the admin console.
 * Safe to re-run: settlement writes are keyed by unique ledger event ids,
 * the overlap guard drops concurrent runs, and every step tolerates partial
 * failure (a missed poll is just a missing snapshot — deltas, not totals).
 */
import type { Platform, Profile, Submission } from "@/lib/db/types";
import {
  acquireSweepLock,
  appendLedgerEvent,
  appendSnapshots,
  appendXpEvents,
  createFraudFlag,
  getCampaign,
  getConnectedAccount,
  getProfile,
  getSubmission,
  listCampaigns,
  listFraudFlags,
  listPendingSubmissions,
  listSnapshots,
  listSubmissions,
  listSubmissionsDue,
  listSubmissionsPolling,
  newId,
  updateCampaign,
  updateProfile,
  updateSubmission,
} from "@/lib/db";
import { getAdapter } from "./index.ts";
import type { StatsQuery, StatsResult } from "./types.ts";
import { evaluateFraud } from "./fraud.ts";
import { settlementMath } from "@/lib/money";
import { buildRefundEvent, buildSettlementEvent } from "@/lib/ledger";
import { streakBonusXp, tierFor, xpForSettlement } from "@/lib/xp";
import { dhakaWeek } from "@/lib/format";
import { remainingBudgetPoisha } from "@/lib/campaign-rules";

export interface SweepReport {
  at: string;
  skipped?: "overlap";
  baselined: number;
  rejectedAtBaseline: number;
  polled: number;
  held: number;
  settled: number;
  settledZero: number;
  xpAwarded: number;
  tierUpgrades: number;
  campaignsSettling: number;
  campaignsCompleted: number;
  errors: string[];
}

const BASELINE_RETRY_HOURS = 24;

async function fetchStatsByPlatform(
  subs: Submission[],
): Promise<Map<string, StatsResult>> {
  const byPlatform = new Map<Platform, StatsQuery[]>();
  for (const s of subs) {
    const list = byPlatform.get(s.platform) ?? [];
    list.push({ mediaId: s.mediaId, submittedAt: s.submittedAt });
    byPlatform.set(s.platform, list);
  }
  const out = new Map<string, StatsResult>();
  for (const [platform, queries] of byPlatform) {
    const results = await getAdapter(platform).fetchStats(queries);
    for (const r of results) out.set(`${platform}:${r.mediaId}`, r);
  }
  return out;
}

export async function runSweep(now = new Date()): Promise<SweepReport> {
  const nowIso = now.toISOString();
  const report: SweepReport = {
    at: nowIso,
    baselined: 0,
    rejectedAtBaseline: 0,
    polled: 0,
    held: 0,
    settled: 0,
    settledZero: 0,
    xpAwarded: 0,
    tierUpgrades: 0,
    campaignsSettling: 0,
    campaignsCompleted: 0,
    errors: [],
  };

  // 0 — overlap guard: one run per 5-minute bucket
  const lockKey = `sweep:${Math.floor(now.getTime() / 300_000)}`;
  if (!(await acquireSweepLock(lockKey))) {
    return { ...report, skipped: "overlap" };
  }

  // Manual-mode clips (no platform API) are never auto-baselined, polled, or
  // settled — an admin enters their view count via /admin/clips. Skip them here.
  const notManual = (s: Submission) => getAdapter(s.platform).mode() !== "manual";

  // 1 — baseline: pending submissions get their starting count
  const pending = (await listPendingSubmissions()).filter(notManual);
  if (pending.length) {
    const stats = await fetchStatsByPlatform(pending);
    for (const sub of pending) {
      const r = stats.get(`${sub.platform}:${sub.mediaId}`);
      if (!r) continue;
      if (r.ok) {
        await updateSubmission(sub.id, {
          baselineViews: r.views,
          latestViews: r.views,
          countedViews: 0,
          status: "tracking",
        });
        await appendSnapshots([
          { id: newId("snp"), submissionId: sub.id, views: r.views, source: r.source, capturedAt: nowIso },
        ]);
        report.baselined++;
      } else if (r.error === "not_found" || r.error === "private") {
        const ageH = (now.getTime() - new Date(sub.submittedAt).getTime()) / 3600_000;
        if (ageH > BASELINE_RETRY_HOURS || r.error === "private") {
          await updateSubmission(sub.id, {
            status: "rejected",
            rejectReason:
              r.error === "private"
                ? "The post is private — verification needs a public post."
                : "The platform can't find this post.",
          });
          report.rejectedAtBaseline++;
        }
      }
      // api_error / quota → leave pending, retried next run
    }
  }

  // 2 — poll: open-window submissions get a snapshot + fraud check
  const polling = (await listSubmissionsPolling(nowIso)).filter(notManual);
  if (polling.length) {
    const stats = await fetchStatsByPlatform(polling);
    for (const sub of polling) {
      const r = stats.get(`${sub.platform}:${sub.mediaId}`);
      if (!r) continue;
      if (!r.ok) {
        if (r.error === "not_found" || r.error === "private") {
          await updateSubmission(sub.id, {
            status: "rejected",
            rejectReason:
              r.error === "private"
                ? "The post went private during tracking."
                : "The post was deleted during tracking.",
          });
        }
        continue; // quota/api errors: skip, retry next run
      }
      const counted = Math.max(0, r.views - sub.baselineViews);
      await updateSubmission(sub.id, { latestViews: r.views, countedViews: counted });
      await appendSnapshots([
        { id: newId("snp"), submissionId: sub.id, views: r.views, source: r.source, capturedAt: nowIso },
      ]);
      report.polled++;

      if (sub.status === "tracking") {
        const [snaps, account, existingFlags] = await Promise.all([
          listSnapshots(sub.id),
          getConnectedAccount(sub.connectedAccountId),
          listFraudFlags({ submissionId: sub.id }),
        ]);
        if (existingFlags.some((f) => f.status === "open")) continue;
        const verdict = evaluateFraud({ countedViews: counted }, snaps, account?.followerCount);
        if (verdict) {
          await updateSubmission(sub.id, {
            status: "held",
            holdReason: `Automatic ${verdict.rule.replace("_", " ")} check`,
          });
          await createFraudFlag({
            id: newId("flg"),
            submissionId: sub.id,
            rule: verdict.rule,
            detail: JSON.stringify(verdict.detail),
            status: "open",
            createdAt: nowIso,
          });
          report.held++;
        }
      }
    }
  }

  // 3 — settle: windows that just closed lock their views and pay
  const due = (await listSubmissionsDue(nowIso)).filter(notManual);
  if (due.length) {
    // best-effort final count
    const finalStats = await fetchStatsByPlatform(due);
    for (const sub of due) {
      try {
        const r = finalStats.get(`${sub.platform}:${sub.mediaId}`);
        const lockedViews = r?.ok ? Math.max(0, r.views - sub.baselineViews) : sub.countedViews;
        const outcome = await settleOne(sub, lockedViews, nowIso);
        report.settled++;
        if (outcome.zero) report.settledZero++;
        report.xpAwarded += outcome.xp;
        if (outcome.tierUpgraded) report.tierUpgrades++;
      } catch (err) {
        report.errors.push(`settle ${sub.id}: ${(err as Error).message}`);
      }
    }
  }

  // 4 — campaign lifecycle: endDate stops NEW submissions; open windows drain
  for (const c of await listCampaigns("active")) {
    if (c.endDate <= nowIso || remainingBudgetPoisha(c) <= 0) {
      await updateCampaign(c.id, { status: "settling" });
      report.campaignsSettling++;
    }
  }
  for (const c of await listCampaigns("settling")) {
    const open = (await listSubmissions({ campaignId: c.id })).filter(
      (s) => s.status === "pending" || s.status === "tracking" || s.status === "held",
    );
    if (open.length === 0) {
      const remainder = remainingBudgetPoisha(c);
      if (remainder > 0) {
        await appendLedgerEvent(buildRefundEvent(c.id, remainder));
      }
      await updateCampaign(c.id, { status: "completed" });
      report.campaignsCompleted++;
    }
  }

  return report;
}

async function settleOne(
  sub: Submission,
  lockedViews: number,
  nowIso: string,
): Promise<{ zero: boolean; xp: number; tierUpgraded: boolean }> {
  const campaign = await getCampaign(sub.campaignId);
  if (!campaign) throw new Error(`campaign ${sub.campaignId} missing`);

  const minePrior = (
    await listSubmissions({ campaignId: sub.campaignId, profileId: sub.profileId, status: "settled" })
  ).filter((s) => s.id !== sub.id);
  const alreadyEarned = minePrior.reduce((a, s) => a + (s.earnedPoisha ?? 0), 0);

  const math = settlementMath({
    lockedViews,
    minQualifyViews: campaign.minQualifyViews,
    remainingEscrowPoisha: remainingBudgetPoisha(campaign),
    clipperCapRemainingPoisha: Math.max(0, campaign.maxPayoutPerClipperPoisha - alreadyEarned),
    rateClipperPer1k: campaign.rateClipperPer1k,
    rateBrandPer1k: campaign.rateBrandPer1k,
  });

  // money — unique event id makes re-runs no-ops
  if (math.payableViews > 0) {
    const { inserted } = await appendLedgerEvent(
      buildSettlementEvent({
        submissionId: sub.id,
        campaignId: sub.campaignId,
        profileId: sub.profileId,
        math,
      }),
    );
    if (inserted) {
      await updateCampaign(sub.campaignId, {
        spentPoisha: campaign.spentPoisha + math.brandCostPoisha,
      });
    }
  }

  // XP — only for qualifying settlements
  let xpTotalAwarded = 0;
  let tierUpgraded = false;
  if (math.payableViews > 0) {
    const profile = await getProfile(sub.profileId);
    if (profile) {
      const completionBonusEligible =
        minePrior.every((s) => (s.xpAwarded ?? 0) === 0) && sub.submittedAt <= campaign.endDate;
      const breakdown = xpForSettlement({ lockedViews, completionBonusEligible });

      const events = [];
      if (breakdown.viewsXp > 0) {
        events.push({
          id: newId("xp"), profileId: sub.profileId, connectedAccountId: sub.connectedAccountId,
          submissionId: sub.id, campaignId: sub.campaignId,
          amount: breakdown.viewsXp, reason: "views" as const, createdAt: nowIso,
        });
      }
      if (breakdown.completionXp > 0) {
        events.push({
          id: newId("xp"), profileId: sub.profileId, connectedAccountId: sub.connectedAccountId,
          submissionId: sub.id, campaignId: sub.campaignId,
          amount: breakdown.completionXp, reason: "completion_bonus" as const, createdAt: nowIso,
        });
      }

      // streak: a qualifying settle in a NEW consecutive Dhaka week extends it
      const thisWeek = dhakaWeek(nowIso);
      const priorQualifying = (await listSubmissions({ profileId: sub.profileId, status: "settled" }))
        .filter((s) => s.id !== sub.id && (s.earnedPoisha ?? 0) > 0 && s.settledAt)
        .map((s) => dhakaWeek(s.settledAt!));
      const lastWeek = priorQualifying.sort().at(-1);
      let streakWeeks = profile.streakWeeks;
      if (lastWeek !== thisWeek) {
        streakWeeks = lastWeek && isPreviousWeek(lastWeek, thisWeek) ? streakWeeks + 1 : 1;
        events.push({
          id: newId("xp"), profileId: sub.profileId, connectedAccountId: sub.connectedAccountId,
          submissionId: sub.id, campaignId: sub.campaignId,
          amount: streakBonusXp(), reason: "streak_bonus" as const, createdAt: nowIso,
        });
      }

      xpTotalAwarded = events.reduce((a, e) => a + e.amount, 0);
      if (events.length) await appendXpEvents(events);

      const upheld = await hasUpheldFraud(profile);
      const newXpTotal = profile.xpTotal + xpTotalAwarded;
      const newTier = tierFor(newXpTotal, { cleanRecord: !upheld, streakWeeks });
      tierUpgraded = newTier !== profile.tier;
      await updateProfile(profile.id, {
        xpTotal: newXpTotal,
        streakWeeks,
        tier: newTier,
      });
    }
  }

  await updateSubmission(sub.id, {
    status: "settled",
    lockedViews,
    earnedPoisha: math.clipperEarnPoisha,
    xpAwarded: xpTotalAwarded,
    settledAt: nowIso,
  });

  return { zero: math.payableViews === 0, xp: xpTotalAwarded, tierUpgraded };
}

/**
 * Admin manual settlement — settle a submission with an admin-entered view
 * count (no platform API). Runs the exact same money/XP/tier path as the
 * automatic sweep, idempotent by ledger event id. Refuses to re-settle an
 * already-settled/rejected clip (which would double-count XP). Returns null
 * when the submission is gone or already finalized.
 */
export async function settleSubmissionManually(
  submissionId: string,
  lockedViews: number,
  nowIso: string = new Date().toISOString(),
): Promise<{ zero: boolean; xp: number; tierUpgraded: boolean } | null> {
  const sub = await getSubmission(submissionId);
  if (!sub || sub.status === "settled" || sub.status === "rejected") return null;
  return settleOne(sub, Math.max(0, Math.floor(lockedViews)), nowIso);
}

/** Any upheld fraud flag on any of the profile's submissions taints the record. */
async function hasUpheldFraud(profile: Profile): Promise<boolean> {
  const upheld = await listFraudFlags({ status: "upheld" });
  if (upheld.length === 0) return false;
  const mySubs = new Set((await listSubmissions({ profileId: profile.id })).map((s) => s.id));
  return upheld.some((f) => mySubs.has(f.submissionId));
}

/** "2026-W30" follows "2026-W29"; handles year boundaries via date math. */
export function isPreviousWeek(prev: string, next: string): boolean {
  const parse = (w: string) => {
    const [y, ww] = w.split("-W").map(Number);
    // Monday of ISO week ww: Jan 4 is always in week 1
    const jan4 = new Date(Date.UTC(y, 0, 4));
    const mondayW1 = new Date(jan4);
    mondayW1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1));
    return new Date(mondayW1.getTime() + (ww - 1) * 7 * 86400_000);
  };
  return parse(next).getTime() - parse(prev).getTime() === 7 * 86400_000;
}
