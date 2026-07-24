/**
 * Deterministic simulated verification — the shared core behind every
 * platform whose app review hasn't passed yet. Same inputs ⇒ same counts:
 * demos are reproducible and settlement is testable.
 *
 * Curve: views(h) = cap · 1/(1+e^(−k·(h−h₀))) with cap/k/h₀ derived from an
 * FNV-1a hash of the media id, plus ±3% deterministic per-hour jitter.
 * Every result is labeled source:"simulated" — the UI shows the chip.
 */
import type { StatsQuery, StatsResult } from "./types.ts";

/** FNV-1a 32-bit — stable, dependency-free seed. */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic [0,1) stream from a seed and lane. */
function unit(seed: number, lane: number): number {
  const x = Math.imul(seed ^ Math.imul(lane + 1, 0x9e3779b1), 0x85ebca6b);
  return ((x >>> 8) & 0xffffff) / 0x1000000;
}

export interface SimCurve {
  cap: number;
  k: number;
  h0: number;
}

export function curveFor(mediaId: string): SimCurve {
  const seed = fnv1a(mediaId);
  return {
    cap: Math.round(2_000 + unit(seed, 0) * 78_000), // 2k … 80k
    k: 0.15 + unit(seed, 1) * 0.35, // 0.15 … 0.5
    h0: 12 + unit(seed, 2) * 36, // 12 … 48 h
  };
}

/**
 * Total simulated platform views at `hours` since submission.
 * The count advances once per hour bucket (like real platform counters) and
 * is a RUNNING MAX over jittered bucket values — strictly non-decreasing.
 */
export function simulatedViews(mediaId: string, hours: number): number {
  const { cap, k, h0 } = curveFor(mediaId);
  const seed = fnv1a(mediaId);
  const bucket = Math.max(0, Math.floor(hours));
  const last = Math.min(bucket, 24 * 30); // cap the walk at 30 days — curve is flat by then
  let max = 0;
  for (let b = 0; b <= last; b++) {
    const base = cap / (1 + Math.exp(-k * (b - h0)));
    const jitter = 1 + (unit(seed, 100 + b) - 0.5) * 0.06; // ±3% per hour bucket
    const v = Math.round(base * jitter);
    if (v > max) max = v;
  }
  return max;
}

export function simulatedFetchStats(queries: StatsQuery[]): StatsResult[] {
  const now = Date.now();
  return queries.map(({ mediaId, submittedAt }) => {
    const hours = Math.max(0, (now - new Date(submittedAt).getTime()) / 3600_000);
    return {
      ok: true as const,
      mediaId,
      views: simulatedViews(mediaId, hours),
      source: "simulated" as const,
      fetchedAt: new Date(now).toISOString(),
    };
  });
}
