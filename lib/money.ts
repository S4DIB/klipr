/**
 * Money core — ALL amounts are integer poisha (৳ × 100).
 * Per-view amounts are exact integers: clipper 5 poisha, brand 6 poisha per
 * view (i.e. ৳50 / ৳60 per 1,000). No floats anywhere in money math.
 */
import { RATE_BRAND_PER_1K, RATE_CLIPPER_PER_1K } from "./db/types.ts";

export const POISHA_PER_TAKA = 100;

export function takaToPoisha(taka: number): number {
  if (!Number.isFinite(taka) || taka < 0) throw new Error(`invalid taka amount: ${taka}`);
  return Math.round(taka * POISHA_PER_TAKA);
}

export function poishaToTaka(poisha: number): number {
  return poisha / POISHA_PER_TAKA;
}

/** Poisha per single view at a per-1k rate (rate must be a multiple of 1,000). */
export function perViewPoisha(ratePer1k: number): number {
  if (!Number.isInteger(ratePer1k) || ratePer1k <= 0 || ratePer1k % 1000 !== 0) {
    throw new Error(`per-1k rate must be a positive multiple of 1000 poisha, got ${ratePer1k}`);
  }
  return ratePer1k / 1000;
}

/** Clipper earnings for a view count at the fixed platform rate. */
export function clipperEarningsPoisha(views: number, ratePer1k = RATE_CLIPPER_PER_1K): number {
  assertViews(views);
  return views * perViewPoisha(ratePer1k);
}

/** Brand cost for a view count at the fixed platform rate. */
export function brandCostPoisha(views: number, ratePer1k = RATE_BRAND_PER_1K): number {
  assertViews(views);
  return views * perViewPoisha(ratePer1k);
}

function assertViews(views: number) {
  if (!Number.isInteger(views) || views < 0) throw new Error(`invalid view count: ${views}`);
}

export interface SettlementMathInput {
  lockedViews: number;
  minQualifyViews: number;
  /** Escrow left in the campaign, poisha. */
  remainingEscrowPoisha: number;
  /** Campaign cap minus what this clipper already earned in it, poisha. */
  clipperCapRemainingPoisha: number;
  rateClipperPer1k: number;
  rateBrandPer1k: number;
}

export interface SettlementMath {
  payableViews: number;
  clipperEarnPoisha: number;
  brandCostPoisha: number;
  marginPoisha: number;
  /** True when views < minQualifyViews (settles honestly at ৳0, no XP). */
  belowMinimum: boolean;
}

/**
 * The settlement formula (KLIPR-BUILD-PLAN.md §3.4):
 *   payableViews = min(lockedViews,
 *                      floor(remainingEscrow / brandPerView),
 *                      floor(capRemaining / clipperPerView))
 * Below the qualification minimum ⇒ 0 views payable.
 * Floor arithmetic guarantees brandCost ≤ remainingEscrow — the ledger can
 * never overdraw an escrow account.
 */
export function settlementMath(input: SettlementMathInput): SettlementMath {
  const {
    lockedViews,
    minQualifyViews,
    remainingEscrowPoisha,
    clipperCapRemainingPoisha,
    rateClipperPer1k,
    rateBrandPer1k,
  } = input;
  assertViews(lockedViews);

  const clipperPerView = perViewPoisha(rateClipperPer1k);
  const brandPerView = perViewPoisha(rateBrandPer1k);

  const belowMinimum = lockedViews < minQualifyViews;
  const payableViews = belowMinimum
    ? 0
    : Math.max(
        0,
        Math.min(
          lockedViews,
          Math.floor(Math.max(0, remainingEscrowPoisha) / brandPerView),
          Math.floor(Math.max(0, clipperCapRemainingPoisha) / clipperPerView),
        ),
      );

  const clipperEarn = payableViews * clipperPerView;
  const brandCost = payableViews * brandPerView;
  return {
    payableViews,
    clipperEarnPoisha: clipperEarn,
    brandCostPoisha: brandCost,
    marginPoisha: brandCost - clipperEarn,
    belowMinimum,
  };
}
