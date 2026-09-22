/**
 * Klipr V2.1 domain model — aligned to `Klipr Product Flows v2.pdf` and
 * KLIPR-BUILD-PLAN.md §3. Everything compiles against this file.
 *
 * Money: ALL amounts are integer poisha (৳ × 100). Per-view amounts are
 * exact integers (clipper 5 poisha, agency 6 poisha) — no floats, ever.
 */

/* "network" is DORMANT — the old clipper-side "agency" role (one operator, many
 * pages). Kept in code and data, hidden from every screen; nobody new can get
 * it. "agency" now means the client side that funds campaigns. */
export type Role = "clipper" | "agency" | "network" | "admin";

/** Canonical lowercase platform ids. */
export type Platform = "facebook" | "tiktok" | "instagram" | "youtube";

/** Marketplace access for clipper/network — the gated "apply → vet → let in" model. */
export type Access = "none" | "waitlisted" | "active" | "declined";

export type Tier = "beginner" | "hustler" | "pro" | "elite";

/**
 * How a campaign pays. "views" is the original model — a per-1,000-verified-
 * views rate. "per_video" pays a flat amount for each accepted video that
 * clears minQualifyViews, so the agency's cost per clip is known up front.
 * "retainer" hires clippers on a fixed fee: each clipper the agency brings on
 * earns the same amount for delivering a set number of accepted videos, paid
 * out in equal installments per video. Retainers are invite-only — they never
 * appear in the marketplace; the agency hand-picks clippers from the directory.
 */
export type PayoutModel = "views" | "per_video" | "retainer";

/** ৳50 per 1,000 verified views — identical at every tier, forever. */
export const RATE_CLIPPER_PER_1K = 5000; // poisha
/** ৳60 per 1,000 verified views (campaigns snapshot this; future tiered client rates change the snapshot, never the clipper rate). */
export const RATE_AGENCY_PER_1K = 6000; // poisha

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  /** Custom /home profile-header cover photo; unset falls back to the gradient. */
  coverUrl?: string;
  /** Personal details (settings). displayName is kept as `${firstName} ${lastName}`. */
  firstName?: string;
  lastName?: string;
  username?: string;
  location?: string;
  /** Free-text: languages the clipper posts in (e.g. "Bangla, English"). */
  postLanguages?: string;
  role: Role;
  /** "active" gates the (app) shell for clipper/network. Agencies/admins: "active". */
  access: Access;
  /** Derived from XP thresholds; denormalized for cheap reads. */
  tier: Tier;
  xpTotal: number;
  /** Consecutive active weeks (≥1 qualifying settlement per Dhaka week). */
  streakWeeks: number;
  bkashNumber?: string;
  /** Gates the FIRST payout release — never browsing or submitting. */
  nidStatus: "none" | "submitted" | "verified";
  /** AES-256-GCM ciphertext; service-role read only; minimal PII. */
  nidNumberEnc?: string;
  /** Agency / network organisation name. */
  orgName?: string;
  /* ── Agency onboarding (collected in the 3-step agency setup) ── */
  /** Agency logo — public URL in the Supabase `brand-logos` storage bucket. */
  logoUrl?: string;
  website?: string;
  industry?: string;
  monthlySpend?: string;
  /** "not_yet" | "a_few" | "often" — agency's clipping-campaign history. */
  campaignExperience?: string;
  leaderboardOptOut: boolean;
  accountStatus: "active" | "blocked";
  profileCompleted: boolean;
  onboardingStep: number;
  createdAt: string;
}

/** One application per attempt; multiple rows per profile = reapplications. */
export interface Application {
  id: string;
  profileId: string;
  role: "clipper" | "network";
  /** Posting-habits note from the applicant. */
  note: string;
  status: "submitted" | "approved" | "declined";
  /** Shown verbatim to the applicant. */
  declineReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface ApplicationPage {
  id: string;
  applicationId: string;
  platform: Platform;
  handle: string;
  url: string;
  selfReportedFollowers: number;
  niche: string;
  vetStatus: "pending" | "approved" | "declined";
  /** The Clipper Standard — three explicit reviewer toggles. */
  vetChecklist?: {
    activeRecently: boolean;
    postingCadence: boolean;
    realEngagement: boolean;
  };
  vetNote?: string;
}

export interface ConnectedAccount {
  id: string;
  profileId: string;
  platform: Platform;
  /** Provenance: only VETTED pages get connected. */
  applicationPageId: string;
  /** YT channelId / FB pageId / IG userId / TikTok openId. */
  externalId: string;
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  followerCount?: number;
  /** How ownership was established. Live platforms require "oauth"; "manual"
   *  = pending admin approval of ownership (no platform API). */
  proof: "oauth" | "simulated" | "manual";
  accessTokenEnc?: string;
  refreshTokenEnc?: string;
  tokenExpiresAt?: string;
  /** "pending" ⇒ awaiting admin ownership approval; only "active" can submit. */
  status: "pending" | "active" | "revoked";
  /** Admin manual-verification audit. */
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
}

export type CampaignStatus =
  | "draft"
  | "pending_funding"
  | "active"
  | "settling"
  | "completed"
  | "cancelled";

export interface Campaign {
  id: string;
  agencyProfileId: string;
  name: string;
  agencyName: string;
  brief: string;
  guidelines: string;
  niche: string;
  allowedPlatforms: Platform[];
  sourceUrl: string;
  coverUrl?: string;
  /** Pre-per-video campaigns read back as "views". */
  payoutModel: PayoutModel;
  /**
   * per_video only — flat amounts snapshotted at create time, exactly like the
   * per-1k rates, so editing platform pricing never re-prices a live campaign.
   */
  perVideoClipperPoisha?: number;
  perVideoAgencyPoisha?: number;
  /**
   * retainer only — the fixed fee one clipper earns for the whole campaign and
   * what the agency pays for it (same 5:6 margin), snapshotted like the rates.
   * Paid as `retainerVideos` equal installments, one per accepted video;
   * maxPayoutPerClipperPoisha mirrors the clipper fee and submissionCapBase
   * mirrors the video count (the cap does not scale by tier on a retainer).
   */
  retainerClipperPoisha?: number;
  retainerAgencyPoisha?: number;
  /** retainer only — accepted videos each clipper delivers for the fee. */
  retainerVideos?: number;
  /** retainer only — how many clippers the agency is hiring; budget = slots × agency fee. */
  retainerSlots?: number;
  /** Escrow ceiling. */
  budgetPoisha: number;
  /** Agency-side accrual, updated at each settlement. */
  spentPoisha: number;
  /** Rate snapshots (support future tiered client rates without model change). */
  rateClipperPer1k: number;
  rateAgencyPer1k: number;
  /** 2,000–4,000 per flows v2 (default 2,000); below ⇒ ৳0 + no XP. */
  minQualifyViews: number;
  maxPayoutPerClipperPoisha: number;
  /** Beginner cap; effective cap = base × XP_CONFIG.submissionCapMultiplier[tier]. */
  submissionCapBase: number;
  /** Visible only to ≥ tier until earlyAccessEndsAt, then opens to everyone. */
  earlyAccessTier?: "pro" | "elite";
  earlyAccessEndsAt?: string;
  /** Default 7. */
  trackingWindowDays: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  fundedAt?: string;
  /** Set when the owning agency asks an admin to delete it; cleared on dismiss. */
  deletionRequestedAt?: string;
  createdAt: string;
}

export type SubmissionStatus = "pending" | "tracking" | "held" | "settled" | "rejected";
// pending: created, baseline not yet snapped → tracking: window open, polled
// held: fraud auto-hold (admin release→tracking / uphold→rejected)
// settled: window ended, views locked, ledger written · rejected: terminal

export interface Submission {
  id: string;
  campaignId: string;
  profileId: string;
  connectedAccountId: string;
  platform: Platform;
  /** Canonical form, globally unique. */
  postUrl: string;
  /** Unique per campaign (dedup across URL forms). */
  mediaId: string;
  baselineViews: number;
  latestViews: number;
  /** max(latest − baseline, 0) after fraud strips. */
  countedViews: number;
  lockedViews?: number;
  earnedPoisha?: number;
  xpAwarded?: number;
  status: SubmissionStatus;
  holdReason?: string;
  rejectReason?: string;
  submittedAt: string;
  windowEndsAt: string;
  settledAt?: string;
}

export interface ViewSnapshot {
  id: string;
  submissionId: string;
  views: number;
  source: "live" | "simulated";
  capturedAt: string;
}

export interface XpEvent {
  id: string;
  profileId: string;
  /** Enables per-page XP in the network portfolio. */
  connectedAccountId?: string;
  submissionId?: string;
  campaignId?: string;
  /** XP integer; zero-XP events are never written. */
  amount: number;
  reason: "views" | "completion_bonus" | "streak_bonus" | "adjustment";
  createdAt: string;
}

/** "external" | `escrow:${campaignId}` | `clipper:${profileId}` | "margin" */
export type LedgerAccount = string;

export type LedgerEventType =
  | "escrow_funding"
  | "settlement"
  | "payout"
  | "escrow_refund"
  | "adjustment";

export interface LedgerEntry {
  id: string;
  /** Entries of one event sum to 0; unique (eventId, account) ⇒ idempotent. */
  eventId: string;
  eventType: LedgerEventType;
  account: LedgerAccount;
  /** Signed: + credit, − debit. */
  amountPoisha: number;
  campaignId?: string;
  profileId?: string;
  submissionId?: string;
  payoutBatchId?: string;
  memo?: string;
  createdAt: string;
}

export interface PayoutBatch {
  id: string;
  profileId: string;
  amountPoisha: number;
  /** Snapshot at queue time. */
  bkashNumber: string;
  status: "queued" | "blocked_nid" | "processing" | "paid" | "failed";
  txnRef?: string;
  paidBy?: string;
  paidAt?: string;
  createdAt: string;
}

export interface FraudFlag {
  id: string;
  submissionId: string;
  rule: "velocity" | "follower_ratio" | "duplicate_media" | "manual";
  /** JSON string of the evidence numbers. */
  detail: string;
  status: "open" | "released" | "upheld";
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

/** An in-app notice delivered to one profile — survives the thing it's about. */
export interface Notification {
  id: string;
  /** Recipient profile. */
  profileId: string;
  kind: "campaign_deleted" | "campaign_invite" | "general";
  title: string;
  body: string;
  /** In-app link the notice opens (e.g. the campaign an invite is for). */
  href?: string;
  /** Set once the recipient has seen/dismissed it. */
  readAt?: string;
  createdAt: string;
}

/**
 * An agency's invitation to one clipper for one live campaign. A nudge, not a
 * handshake: there is no accept/decline — taking part means submitting a
 * clip, so "accepted" is derived from the submissions table. Unique per
 * (campaign, clipper); the app never re-invites.
 */
export interface CampaignInvite {
  id: string;
  campaignId: string;
  /** Sender — denormalised so the daily rate limit is one indexed count. */
  agencyProfileId: string;
  clipperProfileId: string;
  /** Optional personal note, shown in the clipper's notification. */
  message?: string;
  createdAt: string;
}

export interface DB {
  profiles: Profile[];
  applications: Application[];
  applicationPages: ApplicationPage[];
  connectedAccounts: ConnectedAccount[];
  campaigns: Campaign[];
  submissions: Submission[];
  viewSnapshots: ViewSnapshot[];
  xpEvents: XpEvent[];
  ledgerEntries: LedgerEntry[];
  payoutBatches: PayoutBatch[];
  fraudFlags: FraudFlag[];
  notifications: Notification[];
  campaignInvites: CampaignInvite[];
  /** Sweep overlap-guard keys (`sweep:{bucket}`). */
  sweepLocks: string[];
  /** Stub-store reseed trigger. */
  version: 5;
}
