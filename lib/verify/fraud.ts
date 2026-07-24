/**
 * Fraud rules v1 — pure functions over a submission's snapshot history.
 * A tripped rule HOLDS the submission (it keeps polling, can't settle) until
 * an admin releases or upholds. Upheld ⇒ rejected, zero XP, streak reset.
 */
import type { FraudFlag, Submission, ViewSnapshot } from "@/lib/db/types";

export const FRAUD_CONFIG = {
  /** Absolute hourly ceiling before an automatic hold. */
  maxHourlyDelta: 50_000,
  /**
   * Hold when the latest hourly rate exceeds N× the clip's own PEAK prior
   * rate. Peak (not median) tolerates the organic S-curve knee while still
   * catching bot step-functions, which jump far past any prior hour.
   */
  peakMultiplier: 8,
  /** Need at least this many prior rates before the peak rule can fire. */
  minPriorRates: 3,
  /** The peak rule also needs a real absolute rate — tiny clips never trip it. */
  peakRuleMinRate: 2_000,
  /** follower_ratio rule floor — below this many counted views it never fires. */
  followerRuleMinViews: 10_000,
  /** counted views > N × followers ⇒ hold (when follower count is known). */
  followerMultiplier: 30,
} as const;

export interface FraudVerdict {
  rule: FraudFlag["rule"];
  detail: Record<string, number | string>;
}

/** Hourly view-rate between two snapshots (guards zero/negative intervals). */
function hourlyRate(a: ViewSnapshot, b: ViewSnapshot): number {
  const dViews = b.views - a.views;
  const dHours = Math.max(
    (new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()) / 3600_000,
    1 / 60,
  );
  return dViews / dHours;
}

export function evaluateFraud(
  submission: Pick<Submission, "countedViews">,
  snapshots: ViewSnapshot[], // ascending by capturedAt
  followerCount?: number,
): FraudVerdict | null {
  // 1) velocity
  if (snapshots.length >= 2) {
    const rates: number[] = [];
    for (let i = 1; i < snapshots.length; i++) {
      rates.push(hourlyRate(snapshots[i - 1], snapshots[i]));
    }
    const latest = rates[rates.length - 1];
    if (latest > FRAUD_CONFIG.maxHourlyDelta) {
      return {
        rule: "velocity",
        detail: { latestHourlyRate: Math.round(latest), ceiling: FRAUD_CONFIG.maxHourlyDelta },
      };
    }
    const prior = rates.slice(0, -1).filter((r) => r > 0);
    if (prior.length >= FRAUD_CONFIG.minPriorRates) {
      const peak = Math.max(...prior);
      if (
        peak > 0 &&
        latest > FRAUD_CONFIG.peakRuleMinRate &&
        latest > peak * FRAUD_CONFIG.peakMultiplier
      ) {
        return {
          rule: "velocity",
          detail: {
            latestHourlyRate: Math.round(latest),
            peakHourlyRate: Math.round(peak),
            multiplier: FRAUD_CONFIG.peakMultiplier,
          },
        };
      }
    }
  }

  // 2) views ≫ followers
  if (
    followerCount !== undefined &&
    followerCount > 0 &&
    submission.countedViews > FRAUD_CONFIG.followerRuleMinViews &&
    submission.countedViews > followerCount * FRAUD_CONFIG.followerMultiplier
  ) {
    return {
      rule: "follower_ratio",
      detail: {
        countedViews: submission.countedViews,
        followerCount,
        multiplier: FRAUD_CONFIG.followerMultiplier,
      },
    };
  }

  return null;
}
