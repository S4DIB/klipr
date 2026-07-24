import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildFundingEvent,
  buildSettlementEvent,
  buildPayoutEvent,
  buildRefundEvent,
  balance,
  assertZeroSum,
  escrowAccount,
  clipperAccount,
  ACCOUNT_EXTERNAL,
  ACCOUNT_MARGIN,
} from "./ledger.ts";
import { settlementMath } from "./money.ts";

test("funding event: zero-sum, escrow credited", () => {
  const e = buildFundingEvent("cmp_1", 4_000_000);
  assert.equal(e.length, 2);
  assertZeroSum(e);
  assert.equal(balance(e, escrowAccount("cmp_1")), 4_000_000);
  assert.equal(balance(e, ACCOUNT_EXTERNAL), -4_000_000);
  assert.ok(e.every((x) => x.eventId === "fund:cmp_1"));
  assert.throws(() => buildFundingEvent("cmp_1", 0));
  assert.throws(() => buildFundingEvent("cmp_1", 10.5));
});

test("settlement event: escrow → clipper + margin, zero-sum, idempotency key", () => {
  const math = settlementMath({
    lockedViews: 4200,
    minQualifyViews: 2000,
    remainingEscrowPoisha: 4_000_000,
    clipperCapRemainingPoisha: 500_000,
    rateClipperPer1k: 5000,
    rateBrandPer1k: 6000,
  });
  const e = buildSettlementEvent({
    submissionId: "sub_1",
    campaignId: "cmp_1",
    profileId: "usr_1",
    math,
  });
  assert.equal(e.length, 3);
  assertZeroSum(e);
  assert.equal(balance(e, escrowAccount("cmp_1")), -25_200);
  assert.equal(balance(e, clipperAccount("usr_1")), 21_000);
  assert.equal(balance(e, ACCOUNT_MARGIN), 4_200);
  assert.ok(e.every((x) => x.eventId === "settle:sub_1"));
});

test("৳0 settlement books nothing", () => {
  const math = settlementMath({
    lockedViews: 100,
    minQualifyViews: 2000,
    remainingEscrowPoisha: 1_000_000,
    clipperCapRemainingPoisha: 500_000,
    rateClipperPer1k: 5000,
    rateBrandPer1k: 6000,
  });
  assert.deepEqual(
    buildSettlementEvent({ submissionId: "s", campaignId: "c", profileId: "p", math }),
    [],
  );
});

test("payout + refund events: zero-sum, correct directions", () => {
  const pay = buildPayoutEvent({ payoutBatchId: "pb_1", profileId: "usr_1", amountPoisha: 21_000 });
  assertZeroSum(pay);
  assert.equal(balance(pay, clipperAccount("usr_1")), -21_000);
  assert.equal(balance(pay, ACCOUNT_EXTERNAL), 21_000);

  const refund = buildRefundEvent("cmp_1", 3_974_800);
  assertZeroSum(refund);
  assert.equal(balance(refund, escrowAccount("cmp_1")), -3_974_800);
  assert.throws(() => buildPayoutEvent({ payoutBatchId: "x", profileId: "p", amountPoisha: 0 }));
  assert.throws(() => buildRefundEvent("c", -5));
});

test("a full campaign lifecycle nets to zero across all accounts", () => {
  const math = settlementMath({
    lockedViews: 4200,
    minQualifyViews: 2000,
    remainingEscrowPoisha: 4_000_000,
    clipperCapRemainingPoisha: 500_000,
    rateClipperPer1k: 5000,
    rateBrandPer1k: 6000,
  });
  const all = [
    ...buildFundingEvent("cmp_1", 4_000_000),
    ...buildSettlementEvent({ submissionId: "sub_1", campaignId: "cmp_1", profileId: "usr_1", math }),
    ...buildPayoutEvent({ payoutBatchId: "pb_1", profileId: "usr_1", amountPoisha: 21_000 }),
    ...buildRefundEvent("cmp_1", 4_000_000 - 25_200),
  ];
  assertZeroSum(all);
  // escrow fully drained; clipper fully paid out; margin retains the spread
  assert.equal(balance(all, escrowAccount("cmp_1")), 0);
  assert.equal(balance(all, clipperAccount("usr_1")), 0);
  assert.equal(balance(all, ACCOUNT_MARGIN), 4_200);
});

test("assertZeroSum rejects unbalanced events", () => {
  assert.throws(() => assertZeroSum([{ amountPoisha: 5 }, { amountPoisha: -4 }]));
});
