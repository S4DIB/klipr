/**
 * Tier & XP engine — pure functions, all constants in one place.
 *
 * ⚠ XP_CONFIG is a WORKING DRAFT. Flows v2 locks the STRUCTURE
 * (per-views + on-time completion bonus + weekly streak bonus; tier
 * thresholds; per-tier submission-cap multipliers) — the NUMBERS need
 * founder sign-off before launch. Tune here only; nothing else hardcodes them.
 *
 * Invariant (absolute): tiers unlock access and privileges only.
 * The payout rate is identical at every tier and never touched by XP.
 */
import type { Tier } from "./db/types.ts";

export const XP_CONFIG = {
  /** XP = verified views ÷ 100. */
  viewsDivisor: 100,
  /** Flat bonus per campaign submitted on time (first qualifying settle per campaign). */
  completionBonus: 50,
  /** Bonus per consecutive active week, awarded at the week boundary. */
  streakBonusPerWeek: 25,
  /** XP totals required to ENTER a tier. DRAFT numbers. */
  thresholds: { hustler: 1_000, pro: 5_000, elite: 20_000 } as Record<
    Exclude<Tier, "beginner">,
    number
  >,
  /** Pro requires a clean record (zero upheld fraud flags). DRAFT. */
  proRequiresCleanRecord: true,
  /** Elite additionally requires a sustained streak. DRAFT. */
  eliteMinStreakWeeks: 8,
  /** Per-campaign submission cap = campaign.submissionCapBase × multiplier. DRAFT. */
  submissionCapMultiplier: { beginner: 1, hustler: 2, pro: 3, elite: 5 } as Record<Tier, number>,
} as const;

export const TIER_ORDER: Tier[] = ["beginner", "hustler", "pro", "elite"];

export interface XpBreakdown {
  viewsXp: number;
  completionXp: number;
  totalXp: number;
}

/**
 * XP for one qualifying settlement. Caller guarantees the settlement
 * qualifies (lockedViews ≥ minQualifyViews, not fraud-upheld) — fraud-upheld
 * submissions earn ZERO XP and reset the streak (handled by the sweep).
 */
export function xpForSettlement(args: {
  lockedViews: number;
  /** First qualifying settlement for this clipper in this campaign, on time. */
  completionBonusEligible: boolean;
}): XpBreakdown {
  const viewsXp = Math.floor(Math.max(0, args.lockedViews) / XP_CONFIG.viewsDivisor);
  const completionXp = args.completionBonusEligible ? XP_CONFIG.completionBonus : 0;
  return { viewsXp, completionXp, totalXp: viewsXp + completionXp };
}

/** Streak bonus when a Dhaka week closes with ≥1 qualifying settlement. */
export function streakBonusXp(): number {
  return XP_CONFIG.streakBonusPerWeek;
}

/**
 * The tier for an XP total plus the extra Pro/Elite conditions.
 * Never used to compute money — tiers gate access only.
 */
export function tierFor(
  xpTotal: number,
  opts: { cleanRecord: boolean; streakWeeks: number },
): Tier {
  const t = XP_CONFIG.thresholds;
  if (xpTotal >= t.elite && opts.cleanRecord && opts.streakWeeks >= XP_CONFIG.eliteMinStreakWeeks) {
    return "elite";
  }
  if (xpTotal >= t.pro && (!XP_CONFIG.proRequiresCleanRecord || opts.cleanRecord)) {
    return "pro";
  }
  if (xpTotal >= t.hustler) return "hustler";
  return "beginner";
}

/** Next tier + its threshold for the XP bar (undefined at elite). */
export function nextTier(tier: Tier): { tier: Tier; threshold: number } | undefined {
  const i = TIER_ORDER.indexOf(tier);
  const next = TIER_ORDER[i + 1];
  if (!next) return undefined;
  return { tier: next, threshold: XP_CONFIG.thresholds[next as Exclude<Tier, "beginner">] };
}

/** Effective per-campaign submission cap for a tier. */
export function submissionCap(base: number, tier: Tier): number {
  return Math.max(1, base) * XP_CONFIG.submissionCapMultiplier[tier];
}

/** True when `tier` satisfies an early-access requirement. */
export function meetsTier(tier: Tier, required: Tier): boolean {
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(required);
}
