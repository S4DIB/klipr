/**
 * Supabase-backed data access (async). Uses the user-scoped server client so
 * Postgres RLS enforces authorisation. Same function surface as the local store
 * — selected at runtime by lib/db/index.ts when Supabase env is configured.
 */
import { createSupabaseServer } from "@/lib/supabase/server";
import type {
  Profile,
  Campaign,
  Submission,
  Payout,
  Platform,
} from "./types";

/* ── row mappers (snake_case ⇄ camelCase) ── */
/* eslint-disable @typescript-eslint/no-explicit-any */
const toProfile = (r: any): Profile => ({
  id: r.id, email: r.email, displayName: r.display_name, avatarUrl: r.avatar_url ?? undefined,
  role: r.role, payoutNumber: r.payout_number ?? undefined, pageUrl: r.page_url ?? undefined,
  handle: r.handle ?? undefined, platform: (r.platform as Platform) ?? undefined,
  followerCount: r.follower_count ?? undefined, accountStatus: r.account_status,
  profileCompleted: r.profile_completed, createdAt: r.created_at,
});
const toCampaign = (r: any): Campaign => ({
  id: r.id, name: r.name, brand: r.brand, brief: r.brief, guidelines: r.guidelines, niche: r.niche,
  allowedPlatforms: r.allowed_platforms ?? [], sourceUrl: r.source_url, budget: r.budget,
  minViewThreshold: r.min_view_threshold, startDate: r.start_date, endDate: r.end_date,
  status: r.status, createdAt: r.created_at,
});
const toSubmission = (r: any): Submission => ({
  id: r.id, campaignId: r.campaign_id, profileId: r.profile_id, postingHandle: r.posting_handle,
  platform: r.platform, postUrl: r.post_url, proofUrl: r.proof_url ?? undefined, status: r.status,
  rejectReason: r.reject_reason ?? undefined, verifiedViews: r.verified_views,
  verifiedBy: r.verified_by ?? undefined, verifiedAt: r.verified_at ?? undefined, createdAt: r.created_at,
});
const toPayout = (r: any): Payout => ({
  id: r.id, campaignId: r.campaign_id, profileId: r.profile_id, viewsUsed: r.views_used,
  amount: r.amount, status: r.status, txnRef: r.txn_ref ?? undefined, paidAt: r.paid_at ?? undefined,
  createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

async function sb() {
  return createSupabaseServer();
}

/* ── Profiles ── */
export async function getProfile(id: string): Promise<Profile | undefined> {
  const { data } = await (await sb()).from("profiles").select("*").eq("id", id).maybeSingle();
  return data ? toProfile(data) : undefined;
}
export async function getProfileByEmail(email: string): Promise<Profile | undefined> {
  const { data } = await (await sb()).from("profiles").select("*").eq("email", email).maybeSingle();
  return data ? toProfile(data) : undefined;
}
export async function listProfiles(): Promise<Profile[]> {
  const { data } = await (await sb()).from("profiles").select("*");
  return (data ?? []).map(toProfile);
}
export async function upsertProfile(p: Profile): Promise<Profile> {
  await (await sb()).from("profiles").upsert({
    id: p.id, email: p.email, display_name: p.displayName, avatar_url: p.avatarUrl,
    role: p.role, payout_number: p.payoutNumber, page_url: p.pageUrl, handle: p.handle,
    platform: p.platform, follower_count: p.followerCount, account_status: p.accountStatus,
    profile_completed: p.profileCompleted,
  });
  return p;
}

/* ── Campaigns ── */
export async function listCampaigns(status?: Campaign["status"]): Promise<Campaign[]> {
  let q = (await sb()).from("campaigns").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data ?? []).map(toCampaign);
}
export async function getCampaign(id: string): Promise<Campaign | undefined> {
  const { data } = await (await sb()).from("campaigns").select("*").eq("id", id).maybeSingle();
  return data ? toCampaign(data) : undefined;
}
export async function upsertCampaign(c: Campaign): Promise<Campaign> {
  await (await sb()).from("campaigns").upsert({
    id: c.id, name: c.name, brand: c.brand, brief: c.brief, guidelines: c.guidelines, niche: c.niche,
    allowed_platforms: c.allowedPlatforms, source_url: c.sourceUrl, budget: c.budget,
    min_view_threshold: c.minViewThreshold, start_date: c.startDate, end_date: c.endDate, status: c.status,
  });
  return c;
}

/* ── Submissions ── */
export async function listSubmissions(filter?: {
  campaignId?: string; profileId?: string;
}): Promise<Submission[]> {
  let q = (await sb()).from("submissions").select("*");
  if (filter?.campaignId) q = q.eq("campaign_id", filter.campaignId);
  if (filter?.profileId) q = q.eq("profile_id", filter.profileId);
  const { data } = await q;
  return (data ?? []).map(toSubmission);
}
export async function getSubmissionByUrl(postUrl: string): Promise<Submission | undefined> {
  const { data } = await (await sb()).from("submissions").select("*").eq("post_url", postUrl).maybeSingle();
  return data ? toSubmission(data) : undefined;
}
export async function createSubmission(s: Submission): Promise<Submission> {
  await (await sb()).from("submissions").insert({
    id: s.id, campaign_id: s.campaignId, profile_id: s.profileId, posting_handle: s.postingHandle,
    platform: s.platform, post_url: s.postUrl, proof_url: s.proofUrl, status: s.status,
    verified_views: s.verifiedViews,
  });
  return s;
}
export async function updateSubmission(
  id: string, patch: Partial<Submission>,
): Promise<Submission | undefined> {
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.verifiedViews !== undefined) row.verified_views = patch.verifiedViews;
  if (patch.verifiedBy !== undefined) row.verified_by = patch.verifiedBy;
  if (patch.verifiedAt !== undefined) row.verified_at = patch.verifiedAt;
  if (patch.rejectReason !== undefined) row.reject_reason = patch.rejectReason;
  const { data } = await (await sb()).from("submissions").update(row).eq("id", id).select("*").maybeSingle();
  return data ? toSubmission(data) : undefined;
}

/* ── Payouts ── */
export async function listPayouts(filter?: {
  campaignId?: string; profileId?: string;
}): Promise<Payout[]> {
  let q = (await sb()).from("payouts").select("*");
  if (filter?.campaignId) q = q.eq("campaign_id", filter.campaignId);
  if (filter?.profileId) q = q.eq("profile_id", filter.profileId);
  const { data } = await q;
  return (data ?? []).map(toPayout);
}
export async function replacePayoutsForCampaign(campaignId: string, rows: Payout[]): Promise<void> {
  const client = await sb();
  await client.from("payouts").delete().eq("campaign_id", campaignId);
  if (rows.length) {
    await client.from("payouts").insert(
      rows.map((p) => ({
        id: p.id, campaign_id: p.campaignId, profile_id: p.profileId, views_used: p.viewsUsed,
        amount: p.amount, status: p.status,
      })),
    );
  }
}
export async function updatePayout(
  id: string, patch: Partial<Payout>,
): Promise<Payout | undefined> {
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.txnRef !== undefined) row.txn_ref = patch.txnRef;
  if (patch.paidAt !== undefined) row.paid_at = patch.paidAt;
  const { data } = await (await sb()).from("payouts").update(row).eq("id", id).select("*").maybeSingle();
  return data ? toPayout(data) : undefined;
}
