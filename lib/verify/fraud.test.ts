import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateFraud, FRAUD_CONFIG } from "./fraud.ts";
import { simulatedViews } from "./simulated.ts";
import type { ViewSnapshot } from "../db/types.ts";

const T0 = Date.parse("2026-07-01T00:00:00Z");
const snap = (hours: number, views: number): ViewSnapshot => ({
  id: `s${hours}`,
  submissionId: "sub_x",
  views,
  source: "simulated",
  capturedAt: new Date(T0 + hours * 3600_000).toISOString(),
});

test("velocity: absolute hourly ceiling trips", () => {
  const snaps = [snap(0, 0), snap(1, 1000), snap(2, 2000), snap(3, 90_000)];
  const v = evaluateFraud({ countedViews: 90_000 }, snaps, 50_000);
  assert.ok(v);
  assert.equal(v.rule, "velocity");
});

test("velocity: bot step-function past the clip's own peak trips", () => {
  // steady ~1k/h for 5 hours, then 20k in one hour (20× peak)
  const snaps = [0, 1000, 2100, 3000, 4100, 5000, 25_000].map((v, i) => snap(i, v));
  const verdict = evaluateFraud({ countedViews: 25_000 }, snaps, 100_000);
  assert.ok(verdict);
  assert.equal(verdict.rule, "velocity");
});

test("velocity: the organic S-curve knee does NOT trip", () => {
  // a real logistic ramp — steep, but each hour grows smoothly
  const id = "demoVid0002"; // steep curve (k≈0.49)
  const snaps = [0, 6, 12, 18, 24, 30].map((h) => snap(h, simulatedViews(id, h)));
  const verdict = evaluateFraud(
    { countedViews: simulatedViews(id, 30) },
    snaps,
    1_000_000, // followers high enough that the ratio rule can't fire
  );
  assert.equal(verdict, null);
});

test("follower_ratio: huge counted views on a tiny page trips; honest reach doesn't", () => {
  const grow = [0, 4000, 9000, 12_000, 15_000].map((v, i) => snap(i * 6, v));
  const tiny = evaluateFraud({ countedViews: 15_000 }, grow, 200);
  assert.ok(tiny);
  assert.equal(tiny.rule, "follower_ratio");

  const normal = evaluateFraud({ countedViews: 15_000 }, grow, 8_000);
  assert.equal(normal, null);

  // below the floor the rule never fires, even with 0-ish followers
  const small = evaluateFraud({ countedViews: 9_000 }, grow.slice(0, 3), 10);
  assert.equal(small, null);
});

test("too little history: no verdict", () => {
  assert.equal(evaluateFraud({ countedViews: 100 }, [snap(0, 100)], 1000), null);
  assert.equal(evaluateFraud({ countedViews: 0 }, [], undefined), null);
});

test("config sanity", () => {
  assert.ok(FRAUD_CONFIG.peakMultiplier > 1);
  assert.ok(FRAUD_CONFIG.followerMultiplier > 1);
});
