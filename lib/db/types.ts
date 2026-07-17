/** Klipr domain types (DESIGN.md §10). Generic payout (no bKash specificity). */

export type Role = "individual" | "agency" | "admin";
export type AccountStatus = "active" | "blocked";
export type Platform = "TikTok" | "Instagram" | "YouTube";
export type CampaignStatus = "draft" | "active" | "closed";
export type SubmissionStatus = "pending" | "verified" | "rejected";
export type PayoutStatus = "pending" | "paid";

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: Role;
  /** Generic payout destination (mobile wallet number). */
  payoutNumber?: string;
  /** Page the clipper posts from (for an agency, their primary). */
  pageUrl?: string;
  handle?: string;
  platform?: Platform;
  followerCount?: number;
  accountStatus: AccountStatus;
  /** Drives the forced onboarding gate. */
  profileCompleted: boolean;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  brand: string;
  brief: string;
  guidelines: string;
  niche: string;
  allowedPlatforms: Platform[];
  sourceUrl: string;
  budget: number;
  minViewThreshold: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  createdAt: string;
}

export interface Submission {
  id: string;
  campaignId: string;
  profileId: string;
  /** Captured posting-account metadata (agency model / retargeting). */
  postingHandle: string;
  platform: Platform;
  postUrl: string; // unique
  proofUrl?: string;
  status: SubmissionStatus;
  rejectReason?: string;
  /** Manually recorded by an admin. */
  verifiedViews: number;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface Payout {
  id: string;
  campaignId: string;
  profileId: string;
  viewsUsed: number;
  amount: number; // snapshotted at close, immutable
  status: PayoutStatus;
  txnRef?: string;
  paidAt?: string;
  createdAt: string;
}

export interface DB {
  profiles: Profile[];
  campaigns: Campaign[];
  submissions: Submission[];
  payouts: Payout[];
}
