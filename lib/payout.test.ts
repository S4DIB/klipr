import { test } from "node:test";
import assert from "node:assert/strict";
import { computePayouts, type SubmissionInput } from "./payout.ts";

const sub = (
  id: string,
  profileId: string,
  verifiedViews: number,
  status: SubmissionInput["status"] = "verified",
): SubmissionInput => ({ id, profileId, verifiedViews, status });

test("proportional split matches the spec example", () => {
  // 20% of views → 20% of a 20,000 budget = 4,000
  const res = computePayouts(20000, 0, [
    sub("a", "p1", 100_000),
    sub("b", "p2", 400_000),
  ]);
  assert.equal(res.totalQualifyingViews, 500_000);
  const p1 = res.lines.find((l) => l.profileId === "p1")!;
  assert.equal(p1.amount, 4000);
  assert.equal(p1.sharePct, 20);
});

test("total paid never exceeds budget (floor rounding)", () => {
  // three equal accounts split 100 → 33 each, 1 unallocated
  const res = computePayouts(100, 0, [
    sub("a", "p1", 10),
    sub("b", "p2", 10),
    sub("c", "p3", 10),
  ]);
  assert.equal(res.totalPaid, 99);
  assert.equal(res.unallocated, 1);
  assert.ok(res.totalPaid <= 100);
  for (const l of res.lines) assert.equal(l.amount, 33);
});

test("submissions below the min-view threshold are excluded", () => {
  const res = computePayouts(1000, 2000, [
    sub("a", "p1", 5000), // qualifies
    sub("b", "p2", 1999), // below threshold → excluded
  ]);
  assert.equal(res.totalQualifyingViews, 5000);
  assert.equal(res.lines.length, 1);
  assert.equal(res.lines[0].profileId, "p1");
  assert.equal(res.lines[0].amount, 1000);
});

test("pending and rejected submissions never count", () => {
  const res = computePayouts(1000, 0, [
    sub("a", "p1", 1000, "verified"),
    sub("b", "p2", 9000, "pending"),
    sub("c", "p3", 9000, "rejected"),
  ]);
  assert.equal(res.totalQualifyingViews, 1000);
  assert.equal(res.lines.length, 1);
  assert.equal(res.lines[0].amount, 1000);
});

test("divide-by-zero guard: nothing qualifies → nobody paid", () => {
  const res = computePayouts(50000, 2000, [
    sub("a", "p1", 100, "verified"), // below threshold
    sub("b", "p2", 9000, "rejected"),
  ]);
  assert.equal(res.totalQualifyingViews, 0);
  assert.equal(res.totalPaid, 0);
  assert.equal(res.unallocated, 50000);
  assert.deepEqual(res.lines, []);
});

test("agency rollup: one account's many clips are paid once, summed", () => {
  const res = computePayouts(10000, 0, [
    sub("a", "agency1", 100_000),
    sub("b", "agency1", 300_000), // same account, 2 clips
    sub("c", "p2", 100_000),
  ]);
  // agency1 = 400k of 500k = 80% → 8000 ; p2 = 20% → 2000
  assert.equal(res.lines.length, 2);
  const agency = res.lines.find((l) => l.profileId === "agency1")!;
  assert.equal(agency.views, 400_000);
  assert.equal(agency.amount, 8000);
  assert.equal(res.totalPaid, 10000);
});

test("empty campaign is safe", () => {
  const res = computePayouts(10000, 1000, []);
  assert.equal(res.totalPaid, 0);
  assert.equal(res.unallocated, 10000);
});

test("rejects invalid inputs", () => {
  assert.throws(() => computePayouts(-1, 0, []));
  assert.throws(() => computePayouts(100, -5, []));
  assert.throws(() => computePayouts(100, 0, [sub("a", "p1", -10)]));
});
