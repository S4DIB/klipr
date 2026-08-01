/**
 * Klipr V2.1 domain model — aligned to `Klipr Product Flows v2.pdf` and
 * KLIPR-BUILD-PLAN.md §3. Everything compiles against this file.
 *
 * Money: ALL amounts are integer poisha (৳ × 100). Per-view amounts are
 * exact integers (clipper 5 poisha, brand 6 poisha) — no floats, ever.
 */

export type Role = "clipper" | "brand" | "agency" | "admin";

/** Canonical lowercase platform ids. */
export type Platform = "facebook" | "tiktok" | "instagram" | "youtube";

/** Marketplace access for clipper/agency — the gated "apply → vet → let in" model. */
export type Access = "none" | "waitlisted" | "active" | "declined";

export type Tier = "beginner" | "hustler" | "pro" | "elite";

/** ৳50 per 1,000 verified views — identical at every tier, forever. */
export const RATE_CLIPPER_PER_1K = 5000; // poisha
/** ৳60 per 1,000 verified views (campaigns snapshot this; future tiered client rates change the snapshot, never the clipper rate). */
export const RATE_BRAND_PER_1K = 6000; // poisha

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  /** Personal details (settings). displayName is kept as `${firstName} ${lastName}`. */
  firstName?: string;
  lastName?: string;
  username?: string;
  location?: string;
  /** Free-text: languages the clipper posts in (e.g. "Bangla, English"). */
  postLanguages?: string;
  role: Role;
  /** "active" gates the (app) shell for clipper/agency. Brands/admins: "active". */
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
  /** Brand / agency organisation name. */
  orgName?: string;
  /* ── Brand onboarding (collected in the 3-step brand setup) ── */
  /** Brand logo — public URL in the Supabase `brand-logos` storage bucket. */
  logoUrl?: string;
  website?: string;
  industry?: string;
  monthlySpend?: string;
  /** "not_yet" | "a_few" | "often" — brand's clipping-campaign history. */
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
  role: "clipper" | "agency";
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
  brandProfileId: string;
  name: string;
  brandName: string;
  brief: string;
  guidelines: string;
  niche: string;
  allowedPlatforms: Platform[];
  sourceUrl: string;
  coverUrl?: string;
  /** Escrow ceiling. */
  budgetPoisha: number;
  /** Brand-side accrual, updated at each settlement. */
  spentPoisha: number;
  /** Rate snapshots (support future tiered client rates without model change). */
  rateClipperPer1k: number;
  rateBrandPer1k: number;
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
  /** Enables per-page XP in the agency portfolio. */
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
  /** Sweep overlap-guard keys (`sweep:{bucket}`). */
  sweepLocks: string[];
  /** Stub-store reseed trigger. */
  version: 4;
}
