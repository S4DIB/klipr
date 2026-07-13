/**
 * Klipr payout engine — the money-critical core (DESIGN.md §11).
 *
 * Rules:
 *  - Only `verified` submissions that meet the campaign's minViewThreshold qualify.
 *  - Each qualifying account's earnings = (its verified views ÷ total qualifying
 *    views) × budget, FLOORED to a whole unit so the sum can never exceed budget.
 *  - Earnings roll up to the submitting account (an agency that submits many
 *    clips is paid once for the sum — DESIGN.md §9).
 *  - Divide-by-zero is guarded: if nothing qualifies, nobody is paid.
 *
 * Pure & dependency-free so it can be unit-tested in isolation.
 */

export type SubmissionStatus = "pending" | "verified" | "rejected";

export interface SubmissionInput {
  id: string;
  profileId: string;
  verifiedViews: number;
  status: SubmissionStatus;
}

export interface PayoutLine {
  profileId: string;
  views: number; // total qualifying views for this account
  sharePct: number; // 0..100, rounded to 2dp (display only)
  amount: number; // floored payout in whole units (Taka)
}

export interface PayoutResult {
  totalQualifyingViews: number;
  totalPaid: number;
  unallocated: number; // budget − totalPaid (rounding remainder, kept by platform)
  lines: PayoutLine[]; // one per paid account, descending by amount
}

function assertNonNegativeInt(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number (got ${value})`);
  }
}

/**
 * Compute the payout split for a closed campaign.
 *
 * @param budget            total campaign budget (whole units)
 * @param minViewThreshold  minimum verified views a submission needs to qualify
 * @param submissions       all submissions for the campaign
 */
export function computePayouts(
  budget: number,
  minViewThreshold: number,
  submissions: SubmissionInput[],
): PayoutResult {
  assertNonNegativeInt(budget, "budget");
  assertNonNegativeInt(minViewThreshold, "minViewThreshold");

  // 1. Keep only verified submissions at or above the threshold.
  const qualifying = submissions.filter((s) => {
    assertNonNegativeInt(s.verifiedViews, `submission ${s.id} verifiedViews`);
    return s.status === "verified" && s.verifiedViews >= minViewThreshold;
  });

  // 2. Roll qualifying views up to the submitting account (agency aggregation).
  const viewsByAccount = new Map<string, number>();
  for (const s of qualifying) {
    viewsByAccount.set(
      s.profileId,
      (viewsByAccount.get(s.profileId) ?? 0) + s.verifiedViews,
    );
  }

  const totalQualifyingViews = [...viewsByAccount.values()].reduce(
    (a, b) => a + b,
    0,
  );

  // 3. Guard divide-by-zero: nothing qualifies → nobody is paid.
  if (totalQualifyingViews === 0) {
    return {
      totalQualifyingViews: 0,
      totalPaid: 0,
      unallocated: budget,
      lines: [],
    };
  }

  // 4. Proportional split, floored per account (sum can never exceed budget).
  const lines: PayoutLine[] = [...viewsByAccount.entries()]
    .map(([profileId, views]) => ({
      profileId,
      views,
      sharePct: Math.round((views / totalQualifyingViews) * 10000) / 100,
      amount: Math.floor((views / totalQualifyingViews) * budget),
    }))
    .sort((a, b) => b.amount - a.amount || b.views - a.views);

  const totalPaid = lines.reduce((sum, l) => sum + l.amount, 0);

  return {
    totalQualifyingViews,
    totalPaid,
    unallocated: budget - totalPaid,
    lines,
  };
}
