import { test } from "node:test";
import assert from "node:assert/strict";
import { isInviteOnly, submissionCapFor } from "./campaign-rules.ts";

test("isInviteOnly: only retainers are hidden from the marketplace", () => {
  assert.equal(isInviteOnly({ payoutModel: "retainer" }), true);
  assert.equal(isInviteOnly({ payoutModel: "views" }), false);
  assert.equal(isInviteOnly({ payoutModel: "per_video" }), false);
});

test("submissionCapFor: open campaigns scale the base by tier", () => {
  const open = { payoutModel: "views" as const, submissionCapBase: 2 };
  assert.equal(submissionCapFor(open, "beginner"), 2);
  assert.equal(submissionCapFor(open, "hustler"), 4);
  assert.equal(submissionCapFor(open, "elite"), 10);
});

test("submissionCapFor: a retainer is a fixed deliverable count at every tier", () => {
  const retainer = { payoutModel: "retainer" as const, submissionCapBase: 10, retainerVideos: 10 };
  assert.equal(submissionCapFor(retainer, "beginner"), 10);
  assert.equal(submissionCapFor(retainer, "elite"), 10);
  // a malformed row still lets one video through rather than locking the clipper out
  assert.equal(
    submissionCapFor({ payoutModel: "retainer", submissionCapBase: 0, retainerVideos: undefined }, "pro"),
    1,
  );
});
