import { test } from "node:test";
import assert from "node:assert/strict";
import { taka, takaFromPoisha, views, dhakaWeek, endOfDhakaDay } from "./format.ts";

test("taka formats plain amounts", () => {
  assert.equal(taka(50), "৳50");
  assert.equal(taka(41250), "৳41,250");
});

test("takaFromPoisha: whole and fractional poisha", () => {
  assert.equal(takaFromPoisha(21_000), "৳210");
  assert.equal(takaFromPoisha(21_005), "৳210.05");
  assert.equal(takaFromPoisha(5), "৳0.05");
  assert.equal(takaFromPoisha(0), "৳0");
  assert.equal(takaFromPoisha(-4_000_000), "−৳40,000");
});

test("views compaction", () => {
  assert.equal(views(999), "999");
  assert.equal(views(4_200), "4.2K");
  assert.equal(views(128_400), "128K");
  assert.equal(views(2_500_000), "2.5M");
});

test("dhakaWeek: same Dhaka day ⇒ same week key", () => {
  assert.equal(dhakaWeek("2026-01-01T00:00:00Z"), "2026-W01");
  // 17:00 UTC Sunday = 23:00 Dhaka Sunday · 20:00 UTC Sunday = 02:00 Dhaka Monday
  const sunday = dhakaWeek("2026-07-19T17:00:00Z");
  const mondayEarly = dhakaWeek("2026-07-19T20:00:00Z");
  assert.notEqual(sunday, mondayEarly); // the Dhaka offset decides the week, not UTC
  assert.equal(dhakaWeek("2026-07-19T20:00:00Z"), dhakaWeek("2026-07-20T10:00:00Z"));
});

test("endOfDhakaDay: 23:59:59.999 Dhaka = 17:59:59.999 UTC", () => {
  assert.equal(endOfDhakaDay("2026-07-21"), "2026-07-21T17:59:59.999Z");
  assert.throws(() => endOfDhakaDay("not-a-date"));
});
