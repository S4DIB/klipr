/**
 * Pure campaign-visibility and window rules shared by marketplace, detail
 * and the submit action. No I/O.
 */
import type { Campaign, Tier } from "@/lib/db/types";
import { meetsTier } from "./xp.ts";

/** Early-access lock: visible only to ≥ tier until earlyAccessEndsAt. */
export function isEarlyAccessLocked(
  campaign: Pick<Campaign, "earlyAccessTier" | "earlyAccessEndsAt">,
  tier: Tier,
  nowIso: string,
): boolean {
  if (!campaign.earlyAccessTier) return false;
  if (campaign.earlyAccessEndsAt && campaign.earlyAccessEndsAt <= nowIso) return false;
  return !meetsTier(tier, campaign.earlyAccessTier);
}

export function remainingBudgetPoisha(c: Pick<Campaign, "budgetPoisha" | "spentPoisha">): number {
  return Math.max(0, c.budgetPoisha - c.spentPoisha);
}

/** windowEndsAt = submittedAt + trackingWindowDays, clamped to endDate + window. */
export function submissionWindowEnd(
  campaign: Pick<Campaign, "trackingWindowDays" | "endDate">,
  submittedAtIso: string,
): string {
  const windowMs = campaign.trackingWindowDays * 86400_000;
  const natural = new Date(submittedAtIso).getTime() + windowMs;
  const clamp = new Date(campaign.endDate).getTime() + windowMs;
  return new Date(Math.min(natural, clamp)).toISOString();
}

/** Campaigns accept submissions only while active and before endDate. */
export function acceptsSubmissions(c: Pick<Campaign, "status" | "endDate">, nowIso: string): boolean {
  return c.status === "active" && c.endDate > nowIso;
}
