import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clipperStats,
  filterClippers,
  isDirectoryVisible,
  matchesQuery,
  median,
  normalizeSort,
  sortClippers,
  toPublicClipper,
  type PublicClipper,
} from "./stats.ts";
import type { ConnectedAccount, Profile, Submission } from "../db/types.ts";

const profile = (over: Partial<Profile> = {}): Profile => ({
  id: "usr_a",
  email: "a@example.com",
  displayName: "Ayesha Rahman",
  role: "clipper",
  access: "active",
  tier: "hustler",
  xpTotal: 1_500,
  streakWeeks: 3,
  nidStatus: "verified",
  bkashNumber: "01711111111",
  leaderboardOptOut: false,
  accountStatus: "active",
  profileCompleted: true,
  onboardingStep: 4,
  createdAt: "2026-06-01T00:00:00.000Z",
  ...over,
});

const sub = (over: Partial<Submission> = {}): Submission => ({
  id: "sub_1",
  campaignId: "cmp_1",
  profileId: "usr_a",
  connectedAccountId: "acc_1",
  platform: "tiktok",
  postUrl: "https://www.tiktok.com/@a/video/1",
  mediaId: "1",
  baselineViews: 0,
  latestViews: 0,
  countedViews: 0,
  status: "settled",
  submittedAt: "2026-07-01T00:00:00.000Z",
  windowEndsAt: "2026-07-08T00:00:00.000Z",
  ...over,
});

const account = (over: Partial<ConnectedAccount> = {}): ConnectedAccount => ({
  id: "acc_1",
  profileId: "usr_a",
  platform: "tiktok",
  applicationPageId: "apg_1",
  externalId: "x",
  handle: "@ayesha",
  followerCount: 12_000,
  proof: "manual",
  status: "active",
  createdAt: "2026-06-01T00:00:00.000Z",
  ...over,
});

test("median: empty, odd, even", () => {
  assert.equal(median([]), 0);
  assert.equal(median([5]), 5);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 3); // rounds the midpoint
});

test("clipperStats: qualified means paid, campaigns count distinct paid ones", () => {
  const subs = [
    sub({ id: "s1", campaignId: "c1", lockedViews: 4_000, earnedPoisha: 20_000 }),
    sub({ id: "s2", campaignId: "c1", lockedViews: 6_000, earnedPoisha: 30_000 }),
    sub({ id: "s3", campaignId: "c2", lockedViews: 500, earnedPoisha: 0 }), // below minimum
    sub({ id: "s4", campaignId: "c3", status: "tracking", countedViews: 900 }),
    sub({ id: "s5", campaignId: "c3", status: "rejected" }),
  ];
  const s = clipperStats(subs);
  assert.equal(s.clipsDelivered, 3);
  assert.equal(s.liveClips, 1);
  assert.equal(s.campaignsCompleted, 1); // only c1 paid
  assert.equal(s.settledViews, 10_500);
  assert.equal(s.medianViewsPerClip, 4_000); // median of 4000, 6000, 500
  assert.equal(s.qualifyRate, 2 / 3);
  assert.equal(s.lastActiveAt, "2026-07-01T00:00:00.000Z");
});

test("clipperStats: nothing settled yet → null qualify rate, zero everything", () => {
  const s = clipperStats([sub({ status: "tracking" })]);
  assert.equal(s.clipsDelivered, 0);
  assert.equal(s.qualifyRate, null);
  assert.equal(s.medianViewsPerClip, 0);
  assert.equal(s.settledViews, 0);
});

test("isDirectoryVisible: active, onboarded earners only", () => {
  assert.equal(isDirectoryVisible(profile()), true);
  assert.equal(isDirectoryVisible(profile({ role: "network" })), true);
  assert.equal(isDirectoryVisible(profile({ role: "agency" })), false);
  assert.equal(isDirectoryVisible(profile({ role: "admin" })), false);
  assert.equal(isDirectoryVisible(profile({ access: "waitlisted" })), false);
  assert.equal(isDirectoryVisible(profile({ accountStatus: "blocked" })), false);
  assert.equal(isDirectoryVisible(profile({ profileCompleted: false })), false);
  // opting out of the leaderboard does NOT hide a clipper from agencies
  assert.equal(isDirectoryVisible(profile({ leaderboardOptOut: true })), true);
});

test("toPublicClipper: whitelists fields, never leaks money or identity", () => {
  const pub = toPublicClipper({
    profile: profile({ username: "ayesha", location: "Dhaka" }),
    submissions: [sub({ lockedViews: 4_000, earnedPoisha: 20_000 })],
    accounts: [
      account(),
      account({ id: "acc_2", platform: "youtube", handle: "@ayesha-yt", status: "revoked" }),
      account({ id: "acc_3", profileId: "usr_other", handle: "@someoneelse" }),
    ],
    pages: [
      { id: "p1", applicationId: "a", platform: "tiktok", handle: "@ayesha", url: "", selfReportedFollowers: 0, niche: "Gaming", vetStatus: "approved" },
      { id: "p2", applicationId: "a", platform: "youtube", handle: "@ayesha", url: "", selfReportedFollowers: 0, niche: "Gaming", vetStatus: "approved" },
    ],
    rank: 7,
  });
  assert.equal(pub.displayName, "Ayesha Rahman");
  assert.equal(pub.username, "ayesha");
  assert.equal(pub.rank, 7);
  assert.deepEqual(pub.platforms, [{ platform: "tiktok", handle: "@ayesha", followerCount: 12_000 }]);
  assert.deepEqual(pub.niches, ["Gaming"]);
  assert.equal(pub.stats.settledViews, 4_000);
  const keys = Object.keys(pub);
  for (const forbidden of ["email", "bkashNumber", "nidNumberEnc", "nidStatus", "xpTotal", "earnedPoisha"]) {
    assert.equal(keys.includes(forbidden), false, `${forbidden} must not be public`);
  }
});

const entry = (over: Partial<PublicClipper> & { id: string }): PublicClipper => ({
  displayName: over.id,
  tier: "beginner",
  streakWeeks: 0,
  joinedAt: "2026-01-01T00:00:00.000Z",
  platforms: [],
  niches: [],
  stats: {
    clipsDelivered: 0,
    liveClips: 0,
    campaignsCompleted: 0,
    settledViews: 0,
    medianViewsPerClip: 0,
    qualifyRate: null,
  },
  ...over,
});

test("matchesQuery: name, @handle, location, page handle, niche — case-insensitive", () => {
  const c = entry({
    id: "x",
    displayName: "Tanvir Ahmed",
    username: "tanvir",
    location: "Chattogram",
    platforms: [{ platform: "youtube", handle: "@tanclips" }],
    niches: ["Sports"],
  });
  assert.equal(matchesQuery(c, "tanvir"), true);
  assert.equal(matchesQuery(c, "@TANVIR"), true);
  assert.equal(matchesQuery(c, "chattogram"), true);
  assert.equal(matchesQuery(c, "tanclips"), true);
  assert.equal(matchesQuery(c, "sports"), true);
  assert.equal(matchesQuery(c, "  "), true); // blank matches everyone
  assert.equal(matchesQuery(c, "gaming"), false);
});

test("filterClippers: tier, platform, niche compose with AND", () => {
  const a = entry({ id: "a", tier: "pro", platforms: [{ platform: "tiktok", handle: "@a" }], niches: ["Memes"] });
  const b = entry({ id: "b", tier: "pro", platforms: [{ platform: "youtube", handle: "@b" }], niches: ["Memes"] });
  const c = entry({ id: "c", tier: "elite", platforms: [{ platform: "tiktok", handle: "@c" }], niches: ["Tech"] });
  const ids = (l: PublicClipper[]) => l.map((x) => x.id);
  assert.deepEqual(ids(filterClippers([a, b, c], { tier: "pro" })), ["a", "b"]);
  assert.deepEqual(ids(filterClippers([a, b, c], { platform: "tiktok" })), ["a", "c"]);
  assert.deepEqual(ids(filterClippers([a, b, c], { tier: "pro", platform: "tiktok" })), ["a"]);
  assert.deepEqual(ids(filterClippers([a, b, c], { niche: "Tech" })), ["c"]);
});

test("sortClippers: each sort key, unranked last, deterministic ties", () => {
  const a = entry({ id: "a", rank: 2, joinedAt: "2026-03-01T00:00:00.000Z", stats: { ...entry({ id: "a" }).stats, settledViews: 10_000, medianViewsPerClip: 2_000, clipsDelivered: 5 } });
  const b = entry({ id: "b", joinedAt: "2026-05-01T00:00:00.000Z", stats: { ...entry({ id: "b" }).stats, settledViews: 10_000, medianViewsPerClip: 5_000, clipsDelivered: 2 } });
  const c = entry({ id: "c", rank: 1, joinedAt: "2026-04-01T00:00:00.000Z", stats: { ...entry({ id: "c" }).stats, settledViews: 30_000, medianViewsPerClip: 3_000, clipsDelivered: 10 } });
  const ids = (l: PublicClipper[]) => l.map((x) => x.id);
  assert.deepEqual(ids(sortClippers([a, b, c], "views")), ["c", "a", "b"]); // a/b tie → more clips wins
  assert.deepEqual(ids(sortClippers([a, b, c], "perclip")), ["b", "c", "a"]);
  assert.deepEqual(ids(sortClippers([a, b, c], "rank")), ["c", "a", "b"]); // b unranked → last
  assert.deepEqual(ids(sortClippers([a, b, c], "newest")), ["b", "c", "a"]);
  assert.equal(normalizeSort("perclip"), "perclip");
  assert.equal(normalizeSort("nope"), "views");
});
