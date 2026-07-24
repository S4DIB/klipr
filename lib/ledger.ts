/**
 * Ledger core — zero-sum double-entry events over string accounts.
 * Accounts: "external" · `escrow:{campaignId}` · `clipper:{profileId}` · "margin".
 * Every event's entries sum to 0; eventId is unique per event, which makes
 * writes idempotent at the persistence layer (unique (event_id, account)).
 * Pure functions only — persistence lives in lib/db.
 */
import type { LedgerEntry, LedgerEventType } from "./db/types.ts";
import type { SettlementMath } from "./money.ts";

export const ACCOUNT_EXTERNAL = "external";
export const ACCOUNT_MARGIN = "margin";
export const escrowAccount = (campaignId: string) => `escrow:${campaignId}`;
export const clipperAccount = (profileId: string) => `clipper:${profileId}`;

/** An entry before ids/timestamps are stamped by the persistence layer. */
export type LedgerDraft = Omit<LedgerEntry, "id" | "createdAt">;

export function assertZeroSum(entries: Pick<LedgerEntry, "amountPoisha">[]): void {
  const sum = entries.reduce((acc, e) => acc + e.amountPoisha, 0);
  if (sum !== 0) throw new Error(`ledger event is not zero-sum (off by ${sum} poisha)`);
}

function event(
  eventId: string,
  eventType: LedgerEventType,
  rows: Array<Omit<LedgerDraft, "eventId" | "eventType">>,
): LedgerDraft[] {
  const entries = rows.map((r) => ({ ...r, eventId, eventType }));
  assertZeroSum(entries);
  return entries;
}

/** Brand escrow arrives: external −B · escrow:{cmp} +B. */
export function buildFundingEvent(campaignId: string, budgetPoisha: number): LedgerDraft[] {
  if (!Number.isInteger(budgetPoisha) || budgetPoisha <= 0) {
    throw new Error(`invalid funding amount: ${budgetPoisha}`);
  }
  return event(`fund:${campaignId}`, "escrow_funding", [
    { account: ACCOUNT_EXTERNAL, amountPoisha: -budgetPoisha, campaignId },
    { account: escrowAccount(campaignId), amountPoisha: budgetPoisha, campaignId },
  ]);
}

/**
 * A submission settles: escrow −brandCost · clipper +earn · margin +spread.
 * eventId `settle:{submissionId}` — re-running a sweep is a no-op.
 * Returns [] for a ৳0 settlement (below minimum / caps) — nothing to book.
 */
export function buildSettlementEvent(args: {
  submissionId: string;
  campaignId: string;
  profileId: string;
  math: SettlementMath;
  memo?: string;
}): LedgerDraft[] {
  const { submissionId, campaignId, profileId, math, memo } = args;
  if (math.payableViews === 0) return [];
  return event(`settle:${submissionId}`, "settlement", [
    {
      account: escrowAccount(campaignId),
      amountPoisha: -math.brandCostPoisha,
      campaignId, submissionId, profileId, memo,
    },
    {
      account: clipperAccount(profileId),
      amountPoisha: math.clipperEarnPoisha,
      campaignId, submissionId, profileId, memo,
    },
    {
      account: ACCOUNT_MARGIN,
      amountPoisha: math.marginPoisha,
      campaignId, submissionId, profileId, memo,
    },
  ]);
}

/** An executed bKash payout: clipper −A · external +A. */
export function buildPayoutEvent(args: {
  payoutBatchId: string;
  profileId: string;
  amountPoisha: number;
  memo?: string;
}): LedgerDraft[] {
  const { payoutBatchId, profileId, amountPoisha, memo } = args;
  if (!Number.isInteger(amountPoisha) || amountPoisha <= 0) {
    throw new Error(`invalid payout amount: ${amountPoisha}`);
  }
  return event(`payout:${payoutBatchId}`, "payout", [
    { account: clipperAccount(profileId), amountPoisha: -amountPoisha, profileId, payoutBatchId, memo },
    { account: ACCOUNT_EXTERNAL, amountPoisha: amountPoisha, profileId, payoutBatchId, memo },
  ]);
}

/** Unspent escrow returns to the brand: escrow −R · external +R. */
export function buildRefundEvent(campaignId: string, remainderPoisha: number): LedgerDraft[] {
  if (!Number.isInteger(remainderPoisha) || remainderPoisha <= 0) {
    throw new Error(`invalid refund amount: ${remainderPoisha}`);
  }
  return event(`refund:${campaignId}`, "escrow_refund", [
    { account: escrowAccount(campaignId), amountPoisha: -remainderPoisha, campaignId },
    { account: ACCOUNT_EXTERNAL, amountPoisha: remainderPoisha, campaignId },
  ]);
}

/** Sum of an account's signed entries. */
export function balance(entries: Pick<LedgerEntry, "account" | "amountPoisha">[], account: string): number {
  return entries.reduce((acc, e) => (e.account === account ? acc + e.amountPoisha : acc), 0);
}
