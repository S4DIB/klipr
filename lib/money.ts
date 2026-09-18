/**
 * Money core — ALL amounts are integer poisha (৳ × 100).
 * Per-view amounts are exact integers: clipper 5 poisha, agency 6 poisha per
 * view (i.e. ৳50 / ৳60 per 1,000). No floats anywhere in money math.
 */
import { RATE_AGENCY_PER_1K, RATE_CLIPPER_PER_1K, type PayoutModel } from "./db/types.ts";

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

/** Agency cost for a view count at the fixed platform rate. */
export function agencyCostPoisha(views: number, ratePer1k = RATE_AGENCY_PER_1K): number {
  assertViews(views);
  return views * perViewPoisha(ratePer1k);
}

/**
 * Agency cost for a flat per-video clipper payout, at the platform's fixed
 * margin — the same 5:6 ratio the per-1k rates use (৳50 clipper ⇒ ৳60 agency).
 * Exact integer poisha: the wizard takes whole taka, so the payout is always a
 * multiple of 100 and ×6/5 never leaves a remainder.
 */
export function agencyCostForClipperPayout(clipperPoisha: number): number {
  if (!Number.isInteger(clipperPoisha) || clipperPoisha <= 0) {
    throw new Error(`invalid per-video payout: ${clipperPoisha}`);
  }
  const cost = (clipperPoisha * RATE_AGENCY_PER_1K) / RATE_CLIPPER_PER_1K;
  if (!Number.isInteger(cost)) {
    throw new Error(`per-video payout must be a multiple of 5 poisha, got ${clipperPoisha}`);
  }
  return cost;
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
  rateAgencyPer1k: number;
  /** Omitted ⇒ "views", so existing callers keep their exact behaviour. */
  payoutModel?: PayoutModel;
  /** per_video only — the campaign's snapshotted flat amounts. */
  perVideoClipperPoisha?: number;
  perVideoAgencyPoisha?: number;
}

export interface SettlementMath {
  /** views model: the views actually paid for. per_video: always 0. */
  payableViews: number;
  /** per_video: 1 when the video was paid for, else 0. views model: always 0. */
  paidVideos: number;
  /** Anything earned at all — the ledger + XP gate for BOTH models. */
  paid: boolean;
  clipperEarnPoisha: number;
  agencyCostPoisha: number;
  marginPoisha: number;
  /** True when views < minQualifyViews (settles honestly at ৳0, no XP). */
  belowMinimum: boolean;
}

/**
 * The settlement formula (KLIPR-BUILD-PLAN.md §3.4):
 *   payableViews = min(lockedViews,
 *                      floor(remainingEscrow / agencyPerView),
 *                      floor(capRemaining / clipperPerView))
 * Below the qualification minimum ⇒ 0 views payable.
 * Floor arithmetic guarantees agencyCost ≤ remainingEscrow — the ledger can
 * never overdraw an escrow account.
 *
 * Per-video campaigns run the same guards over a flat amount instead: the clip
 * still has to clear minQualifyViews, and it pays only if the full agency cost
 * fits in both the remaining escrow and the clipper's remaining cap. A video is
 * atomic — there is no part-paid video — so it's all or nothing, which keeps
 * the same "agencyCost ≤ remainingEscrow" invariant.
 */
export function settlementMath(input: SettlementMathInput): SettlementMath {
  const {
    lockedViews,
    minQualifyViews,
    remainingEscrowPoisha,
    clipperCapRemainingPoisha,
    rateClipperPer1k,
    rateAgencyPer1k,
    payoutModel = "views",
    perVideoClipperPoisha = 0,
    perVideoAgencyPoisha = 0,
  } = input;
  assertViews(lockedViews);

  const belowMinimum = lockedViews < minQualifyViews;

  if (payoutModel === "per_video") {
    const affordable =
      !belowMinimum &&
      perVideoClipperPoisha > 0 &&
      perVideoAgencyPoisha > 0 &&
      perVideoAgencyPoisha <= Math.max(0, remainingEscrowPoisha) &&
      perVideoClipperPoisha <= Math.max(0, clipperCapRemainingPoisha);

    const clipperEarn = affordable ? perVideoClipperPoisha : 0;
    const agencyCost = affordable ? perVideoAgencyPoisha : 0;
    return {
      payableViews: 0,
      paidVideos: affordable ? 1 : 0,
      paid: affordable,
      clipperEarnPoisha: clipperEarn,
      agencyCostPoisha: agencyCost,
      marginPoisha: agencyCost - clipperEarn,
      belowMinimum,
    };
  }

  const clipperPerView = perViewPoisha(rateClipperPer1k);
  const agencyPerView = perViewPoisha(rateAgencyPer1k);

  const payableViews = belowMinimum
    ? 0
    : Math.max(
        0,
        Math.min(
          lockedViews,
          Math.floor(Math.max(0, remainingEscrowPoisha) / agencyPerView),
          Math.floor(Math.max(0, clipperCapRemainingPoisha) / clipperPerView),
        ),
      );

  const clipperEarn = payableViews * clipperPerView;
  const agencyCost = payableViews * agencyPerView;
  return {
    payableViews,
    paidVideos: 0,
    paid: payableViews > 0,
    clipperEarnPoisha: clipperEarn,
    agencyCostPoisha: agencyCost,
    marginPoisha: agencyCost - clipperEarn,
    belowMinimum,
  };
}
