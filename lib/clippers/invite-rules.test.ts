import { test } from "node:test";
import assert from "node:assert/strict";
import {
  INVITE_DAILY_LIMIT,
  inviteBlock,
  inviteStatus,
  inviteWindowStart,
} from "./invite-rules.ts";
import type { CampaignInvite, Profile, Submission } from "../db/types.ts";

const NOW = "2026-09-20T10:00:00.000Z";

const clipper: Profile = {
  id: "usr_c",
  email: "c@example.com",
  displayName: "Clipper",
  role: "clipper",
  access: "active",
  tier: "beginner",
  xpTotal: 0,
  streakWeeks: 0,
  nidStatus: "none",
  leaderboardOptOut: false,
  accountStatus: "active",
  profileCompleted: true,
  onboardingStep: 4,
  createdAt: "2026-06-01T00:00:00.000Z",
};

const campaign = { agencyProfileId: "usr_agency", status: "active" as const, endDate: "2026-12-31T00:00:00.000Z" };

const ok = {
  campaign,
  agencyId: "usr_agency",
  clipper,
  alreadyInvited: false,
  sentInWindow: 0,
  nowIso: NOW,
};

test("inviteWindowStart: rolling 24h", () => {
  assert.equal(inviteWindowStart(NOW), "2026-09-19T10:00:00.000Z");
});

test("inviteBlock: the happy path is allowed", () => {
  assert.equal(inviteBlock(ok), null);
});

test("inviteBlock: ownership is checked before anything else", () => {
  assert.equal(inviteBlock({ ...ok, campaign: undefined }), "not_owner");
  assert.equal(inviteBlock({ ...ok, agencyId: "usr_other" }), "not_owner");
});

test("inviteBlock: only live, unexpired campaigns", () => {
  assert.equal(inviteBlock({ ...ok, campaign: { ...campaign, status: "pending_funding" } }), "campaign_not_accepting");
  assert.equal(inviteBlock({ ...ok, campaign: { ...campaign, status: "completed" } }), "campaign_not_accepting");
  assert.equal(inviteBlock({ ...ok, campaign: { ...campaign, endDate: "2026-09-19T00:00:00.000Z" } }), "campaign_not_accepting");
});

test("inviteBlock: the clipper must be directory-visible", () => {
  assert.equal(inviteBlock({ ...ok, clipper: undefined }), "clipper_unavailable");
  assert.equal(inviteBlock({ ...ok, clipper: { ...clipper, accountStatus: "blocked" } }), "clipper_unavailable");
  assert.equal(inviteBlock({ ...ok, clipper: { ...clipper, role: "agency" } }), "clipper_unavailable");
  assert.equal(inviteBlock({ ...ok, clipper: { ...clipper, profileCompleted: false } }), "clipper_unavailable");
});

test("inviteBlock: no duplicates, and a daily ceiling", () => {
  assert.equal(inviteBlock({ ...ok, alreadyInvited: true }), "already_invited");
  assert.equal(inviteBlock({ ...ok, sentInWindow: INVITE_DAILY_LIMIT - 1 }), null);
  assert.equal(inviteBlock({ ...ok, sentInWindow: INVITE_DAILY_LIMIT }), "rate_limited");
});

test("inviteStatus: submitted once any non-rejected clip lands on that campaign", () => {
  const invite: CampaignInvite = {
    id: "inv_1",
    campaignId: "cmp_1",
    agencyProfileId: "usr_agency",
    clipperProfileId: "usr_c",
    createdAt: NOW,
  };
  const base: Submission = {
    id: "sub_1",
    campaignId: "cmp_1",
    profileId: "usr_c",
    connectedAccountId: "acc",
    platform: "tiktok",
    postUrl: "u",
    mediaId: "m",
    baselineViews: 0,
    latestViews: 0,
    countedViews: 0,
    status: "tracking",
    submittedAt: NOW,
    windowEndsAt: NOW,
  };
  assert.equal(inviteStatus(invite, []), "sent");
  assert.equal(inviteStatus(invite, [{ ...base, status: "rejected" }]), "sent");
  assert.equal(inviteStatus(invite, [{ ...base, campaignId: "cmp_other" }]), "sent");
  assert.equal(inviteStatus(invite, [{ ...base, profileId: "usr_other" }]), "sent");
  assert.equal(inviteStatus(invite, [base]), "submitted");
  assert.equal(inviteStatus(invite, [{ ...base, status: "settled" }]), "submitted");
});
