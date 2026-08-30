import { test } from "node:test";
import assert from "node:assert/strict";
import {
  takaToPoisha,
  poishaToTaka,
  perViewPoisha,
  clipperEarningsPoisha,
  brandCostPoisha,
  brandCostForClipperPayout,
  settlementMath,
} from "./money.ts";

test("taka ⇄ poisha round trip", () => {
  assert.equal(takaToPoisha(50), 5000);
  assert.equal(takaToPoisha(0), 0);
  assert.equal(poishaToTaka(5000), 50);
  assert.throws(() => takaToPoisha(-1));
  assert.throws(() => takaToPoisha(Number.NaN));
});

test("fixed platform rates: ৳50/৳60 per 1,000 views", () => {
  assert.equal(perViewPoisha(5000), 5);
  assert.equal(perViewPoisha(6000), 6);
  assert.equal(clipperEarningsPoisha(1000), 5000); // ৳50
  assert.equal(brandCostPoisha(1000), 6000); // ৳60
  assert.equal(clipperEarningsPoisha(4200), 21_000); // ৳210
  assert.throws(() => perViewPoisha(5500)); // not a multiple of 1000
  assert.throws(() => clipperEarningsPoisha(-5));
  assert.throws(() => clipperEarningsPoisha(1.5));
});

const base = {
  minQualifyViews: 2000,
  remainingEscrowPoisha: 4_000_000,
  clipperCapRemainingPoisha: 500_000,
  rateClipperPer1k: 5000,
  rateBrandPer1k: 6000,
};

test("settlement: plain case — 4,200 views pays ৳210 / costs ৳252 / margin ৳42", () => {
  const m = settlementMath({ ...base, lockedViews: 4200 });
  assert.equal(m.payableViews, 4200);
  assert.equal(m.clipperEarnPoisha, 21_000);
  assert.equal(m.brandCostPoisha, 25_200);
  assert.equal(m.marginPoisha, 4_200);
  assert.equal(m.belowMinimum, false);
  // zero-sum by construction
  assert.equal(m.clipperEarnPoisha + m.marginPoisha, m.brandCostPoisha);
});

test("settlement: below qualification minimum ⇒ ৳0", () => {
  const m = settlementMath({ ...base, lockedViews: 1999 });
  assert.equal(m.payableViews, 0);
  assert.equal(m.clipperEarnPoisha, 0);
  assert.equal(m.brandCostPoisha, 0);
  assert.equal(m.belowMinimum, true);
});

test("settlement: escrow clamp — brand cost can never exceed remaining escrow", () => {
  const m = settlementMath({ ...base, lockedViews: 100_000, remainingEscrowPoisha: 25 });
  // floor(25 / 6) = 4 payable views → cost 24 ≤ 25
  assert.equal(m.payableViews, 4);
  assert.equal(m.brandCostPoisha, 24);
  assert.ok(m.brandCostPoisha <= 25);
});

test("settlement: per-clipper cap clamp", () => {
  const m = settlementMath({ ...base, lockedViews: 100_000, clipperCapRemainingPoisha: 10 });
  // floor(10 / 5) = 2 payable views → earn 10 ≤ cap
  assert.equal(m.payableViews, 2);
  assert.equal(m.clipperEarnPoisha, 10);
});

test("settlement: exhausted escrow ⇒ ৳0 (honest late-settler outcome)", () => {
  const m = settlementMath({ ...base, lockedViews: 5000, remainingEscrowPoisha: 0 });
  assert.equal(m.payableViews, 0);
  assert.equal(m.belowMinimum, false);
});

test("settlement: negative inputs are treated as empty, not exploitable", () => {
  const m = settlementMath({
    ...base,
    lockedViews: 5000,
    remainingEscrowPoisha: -100,
    clipperCapRemainingPoisha: -100,
  });
  assert.equal(m.payableViews, 0);
  assert.throws(() => settlementMath({ ...base, lockedViews: -1 }));
});

/* ── per-video payout model ───────────────────────────── */

test("per-video brand cost carries the same 5:6 platform margin", () => {
  assert.equal(brandCostForClipperPayout(50_000), 60_000); // ৳500 → ৳600
  assert.equal(brandCostForClipperPayout(100), 120); // ৳1 → ৳1.20
  assert.throws(() => brandCostForClipperPayout(0));
  assert.throws(() => brandCostForClipperPayout(-100));
  assert.throws(() => brandCostForClipperPayout(1)); // not a multiple of 5 poisha
});

const perVideo = {
  ...base,
  payoutModel: "per_video" as const,
  perVideoClipperPoisha: 50_000, // ৳500
  perVideoBrandPoisha: 60_000, // ৳600
};

test("per-video: a qualifying clip pays the flat amount, whatever the views", () => {
  const m = settlementMath({ ...perVideo, lockedViews: 4200 });
  assert.equal(m.paid, true);
  assert.equal(m.paidVideos, 1);
  assert.equal(m.payableViews, 0); // views are not what's being bought
  assert.equal(m.clipperEarnPoisha, 50_000);
  assert.equal(m.brandCostPoisha, 60_000);
  assert.equal(m.marginPoisha, 10_000);

  // 10x the views, identical money
  const big = settlementMath({ ...perVideo, lockedViews: 42_000 });
  assert.equal(big.clipperEarnPoisha, 50_000);
  assert.equal(big.brandCostPoisha, 60_000);
});

test("per-video: below the view minimum still settles at ৳0 with no XP gate open", () => {
  const m = settlementMath({ ...perVideo, lockedViews: 1999 });
  assert.equal(m.belowMinimum, true);
  assert.equal(m.paid, false);
  assert.equal(m.paidVideos, 0);
  assert.equal(m.clipperEarnPoisha, 0);
  assert.equal(m.brandCostPoisha, 0);
});

test("per-video is atomic — a video the escrow can't fully cover pays nothing", () => {
  const short = settlementMath({
    ...perVideo,
    lockedViews: 4200,
    remainingEscrowPoisha: 59_999, // one poisha short of the brand cost
  });
  assert.equal(short.paid, false);
  assert.equal(short.clipperEarnPoisha, 0);
  assert.equal(short.brandCostPoisha, 0);

  const exact = settlementMath({ ...perVideo, lockedViews: 4200, remainingEscrowPoisha: 60_000 });
  assert.equal(exact.paid, true);
  assert.equal(exact.brandCostPoisha, 60_000);
});

test("per-video: the clipper cap blocks a video it can't fully cover", () => {
  const capped = settlementMath({
    ...perVideo,
    lockedViews: 4200,
    clipperCapRemainingPoisha: 49_999,
  });
  assert.equal(capped.paid, false);
  assert.equal(capped.clipperEarnPoisha, 0);
});

test("brandCost never exceeds the escrow in either model", () => {
  for (const escrow of [0, 1, 59_999, 60_000, 4_000_000]) {
    for (const model of ["views", "per_video"] as const) {
      const m = settlementMath({
        ...perVideo,
        payoutModel: model,
        lockedViews: 42_000,
        remainingEscrowPoisha: escrow,
      });
      assert.ok(m.brandCostPoisha <= escrow, `${model} @ ${escrow}`);
    }
  }
});

test("omitting payoutModel keeps the original views behaviour", () => {
  const implicit = settlementMath({ ...base, lockedViews: 4200 });
  const explicit = settlementMath({ ...base, lockedViews: 4200, payoutModel: "views" });
  assert.deepEqual(implicit, explicit);
  assert.equal(implicit.paid, true);
  assert.equal(implicit.paidVideos, 0);
});
