import { test } from "node:test";
import assert from "node:assert/strict";
import {
  XP_CONFIG,
  xpForSettlement,
  streakBonusXp,
  tierFor,
  nextTier,
  submissionCap,
  meetsTier,
} from "./xp.ts";

test("xpForSettlement: views ÷ 100 + completion bonus", () => {
  const withBonus = xpForSettlement({ lockedViews: 4200, completionBonusEligible: true });
  assert.equal(withBonus.viewsXp, 42);
  assert.equal(withBonus.completionXp, XP_CONFIG.completionBonus);
  assert.equal(withBonus.totalXp, 42 + XP_CONFIG.completionBonus);

  const noBonus = xpForSettlement({ lockedViews: 250, completionBonusEligible: false });
  assert.equal(noBonus.viewsXp, 2); // floor(250/100)
  assert.equal(noBonus.completionXp, 0);

  assert.equal(xpForSettlement({ lockedViews: 0, completionBonusEligible: false }).totalXp, 0);
});

test("streak bonus is the configured constant", () => {
  assert.equal(streakBonusXp(), XP_CONFIG.streakBonusPerWeek);
});

test("tierFor: thresholds gate tiers", () => {
  const clean = { cleanRecord: true, streakWeeks: 0 };
  assert.equal(tierFor(0, clean), "beginner");
  assert.equal(tierFor(XP_CONFIG.thresholds.hustler - 1, clean), "beginner");
  assert.equal(tierFor(XP_CONFIG.thresholds.hustler, clean), "hustler");
  assert.equal(tierFor(XP_CONFIG.thresholds.pro, clean), "pro");
});

test("tierFor: Pro requires a clean fraud record", () => {
  const dirty = { cleanRecord: false, streakWeeks: 20 };
  assert.equal(tierFor(XP_CONFIG.thresholds.pro, dirty), "hustler");
  assert.equal(tierFor(XP_CONFIG.thresholds.elite, dirty), "hustler");
});

test("tierFor: Elite requires XP + clean record + sustained streak", () => {
  const xp = XP_CONFIG.thresholds.elite;
  assert.equal(tierFor(xp, { cleanRecord: true, streakWeeks: XP_CONFIG.eliteMinStreakWeeks }), "elite");
  assert.equal(tierFor(xp, { cleanRecord: true, streakWeeks: XP_CONFIG.eliteMinStreakWeeks - 1 }), "pro");
});

test("nextTier walks the ladder and ends at elite", () => {
  assert.deepEqual(nextTier("beginner"), { tier: "hustler", threshold: XP_CONFIG.thresholds.hustler });
  assert.deepEqual(nextTier("pro"), { tier: "elite", threshold: XP_CONFIG.thresholds.elite });
  assert.equal(nextTier("elite"), undefined);
});

test("submissionCap scales by tier and never drops below the base", () => {
  assert.equal(submissionCap(1, "beginner"), 1);
  assert.equal(submissionCap(1, "hustler"), XP_CONFIG.submissionCapMultiplier.hustler);
  assert.equal(submissionCap(2, "elite"), 2 * XP_CONFIG.submissionCapMultiplier.elite);
  assert.equal(submissionCap(0, "beginner"), 1); // floor at 1
});

test("meetsTier: early-access gate ordering", () => {
  assert.ok(meetsTier("pro", "pro"));
  assert.ok(meetsTier("elite", "pro"));
  assert.ok(!meetsTier("hustler", "pro"));
  assert.ok(!meetsTier("beginner", "elite"));
});
