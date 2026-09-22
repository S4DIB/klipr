import { test } from "node:test";
import assert from "node:assert/strict";
import {
  takaToPoisha,
  poishaToTaka,
  perViewPoisha,
  clipperEarningsPoisha,
  agencyCostPoisha,
  agencyCostForClipperPayout,
  retainerInstallmentPoisha,
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
  assert.equal(agencyCostPoisha(1000), 6000); // ৳60
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
  rateAgencyPer1k: 6000,
};

test("settlement: plain case — 4,200 views pays ৳210 / costs ৳252 / margin ৳42", () => {
  const m = settlementMath({ ...base, lockedViews: 4200 });
  assert.equal(m.payableViews, 4200);
  assert.equal(m.clipperEarnPoisha, 21_000);
  assert.equal(m.agencyCostPoisha, 25_200);
  assert.equal(m.marginPoisha, 4_200);
  assert.equal(m.belowMinimum, false);
  // zero-sum by construction
  assert.equal(m.clipperEarnPoisha + m.marginPoisha, m.agencyCostPoisha);
});

test("settlement: below qualification minimum ⇒ ৳0", () => {
  const m = settlementMath({ ...base, lockedViews: 1999 });
  assert.equal(m.payableViews, 0);
  assert.equal(m.clipperEarnPoisha, 0);
  assert.equal(m.agencyCostPoisha, 0);
  assert.equal(m.belowMinimum, true);
});

test("settlement: escrow clamp — agency cost can never exceed remaining escrow", () => {
  const m = settlementMath({ ...base, lockedViews: 100_000, remainingEscrowPoisha: 25 });
  // floor(25 / 6) = 4 payable views → cost 24 ≤ 25
  assert.equal(m.payableViews, 4);
  assert.equal(m.agencyCostPoisha, 24);
  assert.ok(m.agencyCostPoisha <= 25);
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

test("per-video agency cost carries the same 5:6 platform margin", () => {
  assert.equal(agencyCostForClipperPayout(50_000), 60_000); // ৳500 → ৳600
  assert.equal(agencyCostForClipperPayout(100), 120); // ৳1 → ৳1.20
  assert.throws(() => agencyCostForClipperPayout(0));
  assert.throws(() => agencyCostForClipperPayout(-100));
  assert.throws(() => agencyCostForClipperPayout(1)); // not a multiple of 5 poisha
});

const perVideo = {
  ...base,
  payoutModel: "per_video" as const,
  perVideoClipperPoisha: 50_000, // ৳500
  perVideoAgencyPoisha: 60_000, // ৳600
};

test("per-video: a qualifying clip pays the flat amount, whatever the views", () => {
  const m = settlementMath({ ...perVideo, lockedViews: 4200 });
  assert.equal(m.paid, true);
  assert.equal(m.paidVideos, 1);
  assert.equal(m.payableViews, 0); // views are not what's being bought
  assert.equal(m.clipperEarnPoisha, 50_000);
  assert.equal(m.agencyCostPoisha, 60_000);
  assert.equal(m.marginPoisha, 10_000);

  // 10x the views, identical money
  const big = settlementMath({ ...perVideo, lockedViews: 42_000 });
  assert.equal(big.clipperEarnPoisha, 50_000);
  assert.equal(big.agencyCostPoisha, 60_000);
});

test("per-video: below the view minimum still settles at ৳0 with no XP gate open", () => {
  const m = settlementMath({ ...perVideo, lockedViews: 1999 });
  assert.equal(m.belowMinimum, true);
  assert.equal(m.paid, false);
  assert.equal(m.paidVideos, 0);
  assert.equal(m.clipperEarnPoisha, 0);
  assert.equal(m.agencyCostPoisha, 0);
});

test("per-video is atomic — a video the escrow can't fully cover pays nothing", () => {
  const short = settlementMath({
    ...perVideo,
    lockedViews: 4200,
    remainingEscrowPoisha: 59_999, // one poisha short of the agency cost
  });
  assert.equal(short.paid, false);
  assert.equal(short.clipperEarnPoisha, 0);
  assert.equal(short.agencyCostPoisha, 0);

  const exact = settlementMath({ ...perVideo, lockedViews: 4200, remainingEscrowPoisha: 60_000 });
  assert.equal(exact.paid, true);
  assert.equal(exact.agencyCostPoisha, 60_000);
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

/* ── retainer payout model ────────────────────────────── */

test("retainer installments split the fee evenly and sum exactly to it", () => {
  // ৳10,000 over 3 videos: 333,334 + 333,333 + 333,333 poisha = 1,000,000
  assert.equal(retainerInstallmentPoisha(1_000_000, 3, 1), 333_334);
  assert.equal(retainerInstallmentPoisha(1_000_000, 3, 2), 333_333);
  assert.equal(retainerInstallmentPoisha(1_000_000, 3, 3), 333_333);
  // past the last video there is nothing left
  assert.equal(retainerInstallmentPoisha(1_000_000, 3, 4), 0);

  for (const total of [50_000, 1_000_000, 1_234_567, 99_999_999]) {
    for (const n of [1, 2, 3, 7, 10, 30]) {
      const parts = Array.from({ length: n }, (_, i) => retainerInstallmentPoisha(total, n, i + 1));
      assert.equal(parts.reduce((a, b) => a + b, 0), total, `${total} / ${n} sums exactly`);
      assert.ok(Math.max(...parts) - Math.min(...parts) <= 1, `${total} / ${n} is even`);
    }
  }

  assert.throws(() => retainerInstallmentPoisha(1_000_000, 0, 1));
  assert.throws(() => retainerInstallmentPoisha(-1, 3, 1));
  assert.throws(() => retainerInstallmentPoisha(1_000_000, 3, 0));
});

const retainer = {
  ...base,
  payoutModel: "retainer" as const,
  retainerClipperPoisha: 1_000_000, // ৳10,000 per clipper
  retainerAgencyPoisha: 1_200_000, // ৳12,000 the agency pays
  retainerVideos: 3,
  clipperCapRemainingPoisha: 1_000_000, // the campaign's cap IS the fee
};

test("retainer: each accepted video pays its installment, whatever the views", () => {
  const first = settlementMath({ ...retainer, lockedViews: 4200, paidVideosPrior: 0 });
  assert.equal(first.paid, true);
  assert.equal(first.paidVideos, 1);
  assert.equal(first.payableViews, 0);
  assert.equal(first.clipperEarnPoisha, 333_334);
  assert.equal(first.agencyCostPoisha, 400_000);
  assert.equal(first.marginPoisha, 66_666);

  const viral = settlementMath({ ...retainer, lockedViews: 4_200_000, paidVideosPrior: 0 });
  assert.equal(viral.clipperEarnPoisha, 333_334);

  const second = settlementMath({
    ...retainer,
    lockedViews: 2000,
    paidVideosPrior: 1,
    clipperCapRemainingPoisha: 1_000_000 - 333_334,
  });
  assert.equal(second.clipperEarnPoisha, 333_333);
  assert.equal(second.agencyCostPoisha, 400_000);
});

test("retainer: three installments land exactly on both snapshotted fees", () => {
  let capLeft = retainer.retainerClipperPoisha;
  let escrowLeft = retainer.retainerAgencyPoisha;
  let earned = 0;
  let cost = 0;
  for (let k = 0; k < 3; k++) {
    const m = settlementMath({
      ...retainer,
      lockedViews: 3000,
      paidVideosPrior: k,
      clipperCapRemainingPoisha: capLeft,
      remainingEscrowPoisha: escrowLeft,
    });
    assert.equal(m.paid, true);
    earned += m.clipperEarnPoisha;
    cost += m.agencyCostPoisha;
    capLeft -= m.clipperEarnPoisha;
    escrowLeft -= m.agencyCostPoisha;
  }
  assert.equal(earned, 1_000_000);
  assert.equal(cost, 1_200_000);
  assert.equal(capLeft, 0);
  assert.equal(escrowLeft, 0);
});

test("retainer: below the view minimum settles at ৳0 and does not use up a video", () => {
  const m = settlementMath({ ...retainer, lockedViews: 1999, paidVideosPrior: 0 });
  assert.equal(m.belowMinimum, true);
  assert.equal(m.paid, false);
  assert.equal(m.paidVideos, 0);
  assert.equal(m.clipperEarnPoisha, 0);
  assert.equal(m.agencyCostPoisha, 0);
});

test("retainer: once the video count is delivered, extra clips pay nothing", () => {
  const m = settlementMath({ ...retainer, lockedViews: 9000, paidVideosPrior: 3 });
  assert.equal(m.paid, false);
  assert.equal(m.clipperEarnPoisha, 0);
});

test("retainer: an installment is atomic — escrow or cap short by a poisha pays nothing", () => {
  const escrowShort = settlementMath({
    ...retainer,
    lockedViews: 4200,
    paidVideosPrior: 0,
    remainingEscrowPoisha: 399_999,
  });
  assert.equal(escrowShort.paid, false);
  const capShort = settlementMath({
    ...retainer,
    lockedViews: 4200,
    paidVideosPrior: 0,
    clipperCapRemainingPoisha: 333_333,
  });
  assert.equal(capShort.paid, false);
  const exact = settlementMath({
    ...retainer,
    lockedViews: 4200,
    paidVideosPrior: 0,
    remainingEscrowPoisha: 400_000,
  });
  assert.equal(exact.paid, true);
});

test("retainer: a malformed campaign (no fee or video count) never pays", () => {
  const noVideos = settlementMath({ ...retainer, lockedViews: 4200, retainerVideos: 0 });
  assert.equal(noVideos.paid, false);
  const noFee = settlementMath({ ...retainer, lockedViews: 4200, retainerClipperPoisha: 0 });
  assert.equal(noFee.paid, false);
});

test("agencyCost never exceeds the escrow in any model", () => {
  for (const escrow of [0, 1, 59_999, 60_000, 399_999, 400_000, 4_000_000]) {
    for (const model of ["views", "per_video", "retainer"] as const) {
      const m = settlementMath({
        ...perVideo,
        ...retainer,
        payoutModel: model,
        lockedViews: 42_000,
        remainingEscrowPoisha: escrow,
      });
      assert.ok(m.agencyCostPoisha <= escrow, `${model} @ ${escrow}`);
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
