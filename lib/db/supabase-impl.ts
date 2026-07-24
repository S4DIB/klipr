/**
 * Supabase-backed data access (async) — mirrors lib/db/store.ts exactly.
 * Reads that RLS can scope go through the user-scoped server client.
 * Privileged reads/writes (vetting, verification, money, sweep) go through
 * the service-role client — their callers have already authorised via
 * lib/auth/guards or the CRON_SECRET. Selected at runtime by lib/db/index.ts.
 */
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  Application,
  ApplicationPage,
  Campaign,
  CampaignStatus,
  ConnectedAccount,
  FraudFlag,
  LedgerEntry,
  PayoutBatch,
  Profile,
  Submission,
  SubmissionStatus,
  ViewSnapshot,
  XpEvent,
} from "./types";
import { newId, type LeaderboardRow } from "./store";
import type { LedgerDraft } from "@/lib/ledger";

/* ── row mappers (snake_case ⇄ camelCase) ── */
/* eslint-disable @typescript-eslint/no-explicit-any */

const toProfile = (r: any): Profile => ({
  id: r.id, email: r.email, displayName: r.display_name, avatarUrl: r.avatar_url ?? undefined,
  role: r.role, access: r.access, tier: r.tier, xpTotal: r.xp_total, streakWeeks: r.streak_weeks,
  bkashNumber: r.bkash_number ?? undefined, nidStatus: r.nid_status,
  nidNumberEnc: r.nid_number_enc ?? undefined, orgName: r.org_name ?? undefined,
  leaderboardOptOut: r.leaderboard_opt_out, accountStatus: r.account_status,
  profileCompleted: r.profile_completed, onboardingStep: r.onboarding_step, createdAt: r.created_at,
});
const fromProfile = (p: Profile) => ({
  id: p.id, email: p.email, display_name: p.displayName, avatar_url: p.avatarUrl ?? null,
  role: p.role, access: p.access, tier: p.tier, xp_total: p.xpTotal, streak_weeks: p.streakWeeks,
  bkash_number: p.bkashNumber ?? null, nid_status: p.nidStatus,
  nid_number_enc: p.nidNumberEnc ?? null, org_name: p.orgName ?? null,
  leaderboard_opt_out: p.leaderboardOptOut, account_status: p.accountStatus,
  profile_completed: p.profileCompleted, onboarding_step: p.onboardingStep, created_at: p.createdAt,
});

const toApplication = (r: any): Application => ({
  id: r.id, profileId: r.profile_id, role: r.role, note: r.note, status: r.status,
  declineReason: r.decline_reason ?? undefined, reviewedBy: r.reviewed_by ?? undefined,
  reviewedAt: r.reviewed_at ?? undefined, createdAt: r.created_at,
});
const fromApplication = (a: Application) => ({
  id: a.id, profile_id: a.profileId, role: a.role, note: a.note, status: a.status,
  decline_reason: a.declineReason ?? null, reviewed_by: a.reviewedBy ?? null,
  reviewed_at: a.reviewedAt ?? null, created_at: a.createdAt,
});

const toApplicationPage = (r: any): ApplicationPage => ({
  id: r.id, applicationId: r.application_id, platform: r.platform, handle: r.handle, url: r.url,
  selfReportedFollowers: r.self_reported_followers, niche: r.niche, vetStatus: r.vet_status,
  vetChecklist: r.vet_checklist ?? undefined, vetNote: r.vet_note ?? undefined,
});
const fromApplicationPage = (p: ApplicationPage) => ({
  id: p.id, application_id: p.applicationId, platform: p.platform, handle: p.handle, url: p.url,
  self_reported_followers: p.selfReportedFollowers, niche: p.niche, vet_status: p.vetStatus,
  vet_checklist: p.vetChecklist ?? null, vet_note: p.vetNote ?? null,
});

const toConnectedAccount = (r: any): ConnectedAccount => ({
  id: r.id, profileId: r.profile_id, platform: r.platform,
  applicationPageId: r.application_page_id, externalId: r.external_id, handle: r.handle,
  displayName: r.display_name ?? undefined, avatarUrl: r.avatar_url ?? undefined,
  followerCount: r.follower_count ?? undefined, proof: r.proof,
  accessTokenEnc: r.access_token_enc ?? undefined, refreshTokenEnc: r.refresh_token_enc ?? undefined,
  tokenExpiresAt: r.token_expires_at ?? undefined, status: r.status, createdAt: r.created_at,
});
const fromConnectedAccount = (a: ConnectedAccount) => ({
  id: a.id, profile_id: a.profileId, platform: a.platform,
  application_page_id: a.applicationPageId, external_id: a.externalId, handle: a.handle,
  display_name: a.displayName ?? null, avatar_url: a.avatarUrl ?? null,
  follower_count: a.followerCount ?? null, proof: a.proof,
  access_token_enc: a.accessTokenEnc ?? null, refresh_token_enc: a.refreshTokenEnc ?? null,
  token_expires_at: a.tokenExpiresAt ?? null, status: a.status, created_at: a.createdAt,
});

const toCampaign = (r: any): Campaign => ({
  id: r.id, brandProfileId: r.brand_profile_id, name: r.name, brandName: r.brand_name,
  brief: r.brief, guidelines: r.guidelines, niche: r.niche,
  allowedPlatforms: r.allowed_platforms ?? [], sourceUrl: r.source_url,
  coverUrl: r.cover_url ?? undefined, budgetPoisha: r.budget_poisha, spentPoisha: r.spent_poisha,
  rateClipperPer1k: r.rate_clipper_per_1k, rateBrandPer1k: r.rate_brand_per_1k,
  minQualifyViews: r.min_qualify_views, maxPayoutPerClipperPoisha: r.max_payout_per_clipper_poisha,
  submissionCapBase: r.submission_cap_base, earlyAccessTier: r.early_access_tier ?? undefined,
  earlyAccessEndsAt: r.early_access_ends_at ?? undefined, trackingWindowDays: r.tracking_window_days,
  startDate: r.start_date, endDate: r.end_date, status: r.status,
  fundedAt: r.funded_at ?? undefined, createdAt: r.created_at,
});
const fromCampaign = (c: Campaign) => ({
  id: c.id, brand_profile_id: c.brandProfileId, name: c.name, brand_name: c.brandName,
  brief: c.brief, guidelines: c.guidelines, niche: c.niche,
  allowed_platforms: c.allowedPlatforms, source_url: c.sourceUrl, cover_url: c.coverUrl ?? null,
  budget_poisha: c.budgetPoisha, spent_poisha: c.spentPoisha,
  rate_clipper_per_1k: c.rateClipperPer1k, rate_brand_per_1k: c.rateBrandPer1k,
  min_qualify_views: c.minQualifyViews, max_payout_per_clipper_poisha: c.maxPayoutPerClipperPoisha,
  submission_cap_base: c.submissionCapBase, early_access_tier: c.earlyAccessTier ?? null,
  early_access_ends_at: c.earlyAccessEndsAt ?? null, tracking_window_days: c.trackingWindowDays,
  start_date: c.startDate, end_date: c.endDate, status: c.status,
  funded_at: c.fundedAt ?? null, created_at: c.createdAt,
});

const toSubmission = (r: any): Submission => ({
  id: r.id, campaignId: r.campaign_id, profileId: r.profile_id,
  connectedAccountId: r.connected_account_id, platform: r.platform, postUrl: r.post_url,
  mediaId: r.media_id, baselineViews: r.baseline_views, latestViews: r.latest_views,
  countedViews: r.counted_views, lockedViews: r.locked_views ?? undefined,
  earnedPoisha: r.earned_poisha ?? undefined, xpAwarded: r.xp_awarded ?? undefined,
  status: r.status, holdReason: r.hold_reason ?? undefined,
  rejectReason: r.reject_reason ?? undefined, submittedAt: r.submitted_at,
  windowEndsAt: r.window_ends_at, settledAt: r.settled_at ?? undefined,
});
const fromSubmission = (s: Submission) => ({
  id: s.id, campaign_id: s.campaignId, profile_id: s.profileId,
  connected_account_id: s.connectedAccountId, platform: s.platform, post_url: s.postUrl,
  media_id: s.mediaId, baseline_views: s.baselineViews, latest_views: s.latestViews,
  counted_views: s.countedViews, locked_views: s.lockedViews ?? null,
  earned_poisha: s.earnedPoisha ?? null, xp_awarded: s.xpAwarded ?? null,
  status: s.status, hold_reason: s.holdReason ?? null, reject_reason: s.rejectReason ?? null,
  submitted_at: s.submittedAt, window_ends_at: s.windowEndsAt, settled_at: s.settledAt ?? null,
});

const toSnapshot = (r: any): ViewSnapshot => ({
  id: r.id, submissionId: r.submission_id, views: r.views, source: r.source, capturedAt: r.captured_at,
});
const fromSnapshot = (v: ViewSnapshot) => ({
  id: v.id, submission_id: v.submissionId, views: v.views, source: v.source, captured_at: v.capturedAt,
});

const toXpEvent = (r: any): XpEvent => ({
  id: r.id, profileId: r.profile_id, connectedAccountId: r.connected_account_id ?? undefined,
  submissionId: r.submission_id ?? undefined, campaignId: r.campaign_id ?? undefined,
  amount: r.amount, reason: r.reason, createdAt: r.created_at,
});
const fromXpEvent = (e: XpEvent) => ({
  id: e.id, profile_id: e.profileId, connected_account_id: e.connectedAccountId ?? null,
  submission_id: e.submissionId ?? null, campaign_id: e.campaignId ?? null,
  amount: e.amount, reason: e.reason, created_at: e.createdAt,
});

const toLedgerEntry = (r: any): LedgerEntry => ({
  id: r.id, eventId: r.event_id, eventType: r.event_type, account: r.account,
  amountPoisha: r.amount_poisha, campaignId: r.campaign_id ?? undefined,
  profileId: r.profile_id ?? undefined, submissionId: r.submission_id ?? undefined,
  payoutBatchId: r.payout_batch_id ?? undefined, memo: r.memo ?? undefined, createdAt: r.created_at,
});

const toPayoutBatch = (r: any): PayoutBatch => ({
  id: r.id, profileId: r.profile_id, amountPoisha: r.amount_poisha, bkashNumber: r.bkash_number,
  status: r.status, txnRef: r.txn_ref ?? undefined, paidBy: r.paid_by ?? undefined,
  paidAt: r.paid_at ?? undefined, createdAt: r.created_at,
});
const fromPayoutBatch = (b: PayoutBatch) => ({
  id: b.id, profile_id: b.profileId, amount_poisha: b.amountPoisha, bkash_number: b.bkashNumber,
  status: b.status, txn_ref: b.txnRef ?? null, paid_by: b.paidBy ?? null,
  paid_at: b.paidAt ?? null, created_at: b.createdAt,
});

const toFraudFlag = (r: any): FraudFlag => ({
  id: r.id, submissionId: r.submission_id, rule: r.rule, detail: r.detail, status: r.status,
  resolvedBy: r.resolved_by ?? undefined, resolvedAt: r.resolved_at ?? undefined, createdAt: r.created_at,
});
const fromFraudFlag = (f: FraudFlag) => ({
  id: f.id, submission_id: f.submissionId, rule: f.rule, detail: f.detail, status: f.status,
  resolved_by: f.resolvedBy ?? null, resolved_at: f.resolvedAt ?? null, created_at: f.createdAt,
});

/* eslint-enable @typescript-eslint/no-explicit-any */

const camelToSnake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
/** camelCase patch → snake_case row patch (undefined → NULL). */
function snakePatch(patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) out[camelToSnake(k)] = v === undefined ? null : v;
  return out;
}

async function sb() {
  return createSupabaseServer();
}
function admin() {
  return createSupabaseAdmin();
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
export async function listProfiles(role?: Profile["role"]): Promise<Profile[]> {
  let q = admin().from("profiles").select("*");
  if (role) q = q.eq("role", role);
  const { data } = await q;
  return (data ?? []).map(toProfile);
}
export async function upsertProfile(p: Profile): Promise<Profile> {
  const { error } = await (await sb()).from("profiles").upsert(fromProfile(p));
  if (error) throw error;
  return p;
}
export async function updateProfile(id: string, patch: Partial<Profile>): Promise<Profile | undefined> {
  const { data, error } = await admin()
    .from("profiles").update(snakePatch(patch)).eq("id", id).select("*").maybeSingle();
  if (error) throw error;
  return data ? toProfile(data) : undefined;
}

/* ── Applications ── */
export async function createApplication(app: Application, pages: ApplicationPage[]): Promise<Application> {
  const client = await sb();
  const { error } = await client.from("applications").insert(fromApplication(app));
  if (error) throw error;
  if (pages.length) {
    const { error: e2 } = await client.from("application_pages").insert(pages.map(fromApplicationPage));
    if (e2) throw e2;
  }
  return app;
}
export async function listApplications(status?: Application["status"]): Promise<Application[]> {
  let q = admin().from("applications").select("*").order("created_at", { ascending: true });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data ?? []).map(toApplication);
}
export async function getApplication(id: string): Promise<Application | undefined> {
  const { data } = await admin().from("applications").select("*").eq("id", id).maybeSingle();
  return data ? toApplication(data) : undefined;
}
export async function latestApplicationForProfile(profileId: string): Promise<Application | undefined> {
  const { data } = await (await sb())
    .from("applications").select("*").eq("profile_id", profileId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data ? toApplication(data) : undefined;
}
export async function updateApplication(
  id: string,
  patch: Partial<Application>,
): Promise<Application | undefined> {
  const { data, error } = await admin()
    .from("applications").update(snakePatch(patch)).eq("id", id).select("*").maybeSingle();
  if (error) throw error;
  return data ? toApplication(data) : undefined;
}
export async function listApplicationPages(applicationId: string): Promise<ApplicationPage[]> {
  const { data } = await admin()
    .from("application_pages").select("*").eq("application_id", applicationId);
  return (data ?? []).map(toApplicationPage);
}
export async function updateApplicationPage(
  id: string,
  patch: Partial<ApplicationPage>,
): Promise<ApplicationPage | undefined> {
  const { data, error } = await admin()
    .from("application_pages").update(snakePatch(patch)).eq("id", id).select("*").maybeSingle();
  if (error) throw error;
  return data ? toApplicationPage(data) : undefined;
}
export async function listVettedPagesForProfile(profileId: string): Promise<ApplicationPage[]> {
  const { data: apps } = await admin().from("applications").select("id").eq("profile_id", profileId);
  const ids = (apps ?? []).map((a) => a.id);
  if (!ids.length) return [];
  const { data } = await admin()
    .from("application_pages").select("*").in("application_id", ids).eq("vet_status", "approved");
  return (data ?? []).map(toApplicationPage);
}

/* ── Connected accounts ── */
export async function listConnectedAccounts(profileId?: string): Promise<ConnectedAccount[]> {
  let q = admin().from("connected_accounts").select("*");
  if (profileId) q = q.eq("profile_id", profileId);
  const { data } = await q;
  return (data ?? []).map(toConnectedAccount);
}
export async function getConnectedAccount(id: string): Promise<ConnectedAccount | undefined> {
  const { data } = await admin().from("connected_accounts").select("*").eq("id", id).maybeSingle();
  return data ? toConnectedAccount(data) : undefined;
}
export async function upsertConnectedAccount(a: ConnectedAccount): Promise<ConnectedAccount> {
  const { error } = await admin().from("connected_accounts").upsert(fromConnectedAccount(a));
  if (error) throw error;
  return a;
}

/* ── Campaigns ── */
export async function listCampaigns(status?: CampaignStatus): Promise<Campaign[]> {
  let q = (await sb()).from("campaigns").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data ?? []).map(toCampaign);
}
export async function listCampaignsByBrand(brandProfileId: string): Promise<Campaign[]> {
  const { data } = await (await sb())
    .from("campaigns").select("*").eq("brand_profile_id", brandProfileId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(toCampaign);
}
export async function getCampaign(id: string): Promise<Campaign | undefined> {
  const { data } = await (await sb()).from("campaigns").select("*").eq("id", id).maybeSingle();
  return data ? toCampaign(data) : undefined;
}
export async function upsertCampaign(c: Campaign): Promise<Campaign> {
  const { error } = await admin().from("campaigns").upsert(fromCampaign(c));
  if (error) throw error;
  return c;
}
export async function updateCampaign(id: string, patch: Partial<Campaign>): Promise<Campaign | undefined> {
  const { data, error } = await admin()
    .from("campaigns").update(snakePatch(patch)).eq("id", id).select("*").maybeSingle();
  if (error) throw error;
  return data ? toCampaign(data) : undefined;
}

/* ── Submissions ── */
export async function listSubmissions(filter?: {
  campaignId?: string;
  profileId?: string;
  status?: SubmissionStatus;
}): Promise<Submission[]> {
  let q = admin().from("submissions").select("*");
  if (filter?.campaignId) q = q.eq("campaign_id", filter.campaignId);
  if (filter?.profileId) q = q.eq("profile_id", filter.profileId);
  if (filter?.status) q = q.eq("status", filter.status);
  const { data } = await q;
  return (data ?? []).map(toSubmission);
}
export async function getSubmission(id: string): Promise<Submission | undefined> {
  const { data } = await admin().from("submissions").select("*").eq("id", id).maybeSingle();
  return data ? toSubmission(data) : undefined;
}
export async function getSubmissionByUrl(postUrl: string): Promise<Submission | undefined> {
  const { data } = await admin().from("submissions").select("*").eq("post_url", postUrl).maybeSingle();
  return data ? toSubmission(data) : undefined;
}
export async function findSubmissionByMedia(
  campaignId: string,
  mediaId: string,
): Promise<Submission | undefined> {
  const { data } = await admin()
    .from("submissions").select("*").eq("campaign_id", campaignId).eq("media_id", mediaId).maybeSingle();
  return data ? toSubmission(data) : undefined;
}
export async function createSubmission(s: Submission): Promise<Submission> {
  const { error } = await admin().from("submissions").insert(fromSubmission(s));
  if (error) throw error;
  return s;
}
export async function updateSubmission(
  id: string,
  patch: Partial<Submission>,
): Promise<Submission | undefined> {
  const { data, error } = await admin()
    .from("submissions").update(snakePatch(patch)).eq("id", id).select("*").maybeSingle();
  if (error) throw error;
  return data ? toSubmission(data) : undefined;
}
export async function listSubmissionsDue(nowIso: string): Promise<Submission[]> {
  const { data } = await admin()
    .from("submissions").select("*").eq("status", "tracking").lte("window_ends_at", nowIso);
  return (data ?? []).map(toSubmission);
}
export async function listSubmissionsPolling(nowIso: string): Promise<Submission[]> {
  const { data } = await admin()
    .from("submissions").select("*").in("status", ["tracking", "held"]).gt("window_ends_at", nowIso);
  return (data ?? []).map(toSubmission);
}
export async function listPendingSubmissions(): Promise<Submission[]> {
  const { data } = await admin().from("submissions").select("*").eq("status", "pending");
  return (data ?? []).map(toSubmission);
}

/* ── View snapshots ── */
export async function appendSnapshots(rows: ViewSnapshot[]): Promise<void> {
  if (!rows.length) return;
  const { error } = await admin().from("view_snapshots").insert(rows.map(fromSnapshot));
  if (error) throw error;
}
export async function listSnapshots(submissionId: string): Promise<ViewSnapshot[]> {
  const { data } = await admin()
    .from("view_snapshots").select("*").eq("submission_id", submissionId)
    .order("captured_at", { ascending: true });
  return (data ?? []).map(toSnapshot);
}

/* ── XP ── */
export async function appendXpEvents(rows: XpEvent[]): Promise<void> {
  if (!rows.length) return;
  const { error } = await admin().from("xp_events").insert(rows.map(fromXpEvent));
  if (error) throw error;
}
export async function listXpEvents(profileId: string): Promise<XpEvent[]> {
  const { data } = await admin().from("xp_events").select("*").eq("profile_id", profileId);
  return (data ?? []).map(toXpEvent);
}
export async function xpByAccount(profileId: string): Promise<Record<string, number>> {
  const rows = await listXpEvents(profileId);
  const out: Record<string, number> = {};
  for (const e of rows) {
    if (!e.connectedAccountId) continue;
    out[e.connectedAccountId] = (out[e.connectedAccountId] ?? 0) + e.amount;
  }
  return out;
}

/* ── Ledger ── */
export async function appendLedgerEvent(drafts: LedgerDraft[]): Promise<{ inserted: boolean }> {
  if (!drafts.length) return { inserted: false };
  const ts = new Date().toISOString();
  const rows = drafts.map((d) => ({
    id: newId("led"),
    event_id: d.eventId,
    event_type: d.eventType,
    account: d.account,
    amount_poisha: d.amountPoisha,
    campaign_id: d.campaignId ?? null,
    profile_id: d.profileId ?? null,
    submission_id: d.submissionId ?? null,
    payout_batch_id: d.payoutBatchId ?? null,
    memo: d.memo ?? null,
    created_at: ts,
  }));
  const { error } = await admin().from("ledger_entries").insert(rows);
  if (error) {
    // 23505 = unique_violation on (event_id, account) → idempotent no-op.
    if ((error as { code?: string }).code === "23505") return { inserted: false };
    throw error;
  }
  return { inserted: true };
}
export async function listLedger(filter?: {
  account?: string;
  profileId?: string;
}): Promise<LedgerEntry[]> {
  let q = admin().from("ledger_entries").select("*").order("created_at", { ascending: false });
  if (filter?.account) q = q.eq("account", filter.account);
  if (filter?.profileId) q = q.eq("profile_id", filter.profileId);
  const { data } = await q;
  return (data ?? []).map(toLedgerEntry);
}
export async function ledgerBalance(account: string): Promise<number> {
  const { data } = await admin().from("ledger_entries").select("amount_poisha").eq("account", account);
  return (data ?? []).reduce((acc, r) => acc + (r.amount_poisha as number), 0);
}

/* ── Payout batches ── */
export async function createPayoutBatch(b: PayoutBatch): Promise<PayoutBatch> {
  const { error } = await admin().from("payout_batches").insert(fromPayoutBatch(b));
  if (error) throw error;
  return b;
}
export async function listPayoutBatches(filter?: {
  profileId?: string;
  status?: PayoutBatch["status"];
}): Promise<PayoutBatch[]> {
  let q = admin().from("payout_batches").select("*").order("created_at", { ascending: false });
  if (filter?.profileId) q = q.eq("profile_id", filter.profileId);
  if (filter?.status) q = q.eq("status", filter.status);
  const { data } = await q;
  return (data ?? []).map(toPayoutBatch);
}
export async function updatePayoutBatch(
  id: string,
  patch: Partial<PayoutBatch>,
): Promise<PayoutBatch | undefined> {
  const { data, error } = await admin()
    .from("payout_batches").update(snakePatch(patch)).eq("id", id).select("*").maybeSingle();
  if (error) throw error;
  return data ? toPayoutBatch(data) : undefined;
}

/* ── Fraud flags ── */
export async function createFraudFlag(f: FraudFlag): Promise<FraudFlag> {
  const { error } = await admin().from("fraud_flags").insert(fromFraudFlag(f));
  if (error) throw error;
  return f;
}
export async function listFraudFlags(filter?: {
  status?: FraudFlag["status"];
  submissionId?: string;
}): Promise<FraudFlag[]> {
  let q = admin().from("fraud_flags").select("*");
  if (filter?.status) q = q.eq("status", filter.status);
  if (filter?.submissionId) q = q.eq("submission_id", filter.submissionId);
  const { data } = await q;
  return (data ?? []).map(toFraudFlag);
}
export async function updateFraudFlag(
  id: string,
  patch: Partial<FraudFlag>,
): Promise<FraudFlag | undefined> {
  const { data, error } = await admin()
    .from("fraud_flags").update(snakePatch(patch)).eq("id", id).select("*").maybeSingle();
  if (error) throw error;
  return data ? toFraudFlag(data) : undefined;
}

/* ── Leaderboard ── */
export async function leaderboard(limit = 20): Promise<LeaderboardRow[]> {
  const { data: subs } = await admin()
    .from("submissions").select("profile_id, locked_views").eq("status", "settled");
  const byProfile = new Map<string, number>();
  for (const s of subs ?? []) {
    if (!s.locked_views) continue;
    byProfile.set(s.profile_id, (byProfile.get(s.profile_id) ?? 0) + s.locked_views);
  }
  if (!byProfile.size) return [];
  const { data: profiles } = await admin()
    .from("profiles").select("id, display_name, tier, role, leaderboard_opt_out, account_status")
    .in("id", [...byProfile.keys()]);
  const rows: LeaderboardRow[] = [];
  for (const p of profiles ?? []) {
    if (p.leaderboard_opt_out || p.account_status !== "active") continue;
    if (p.role !== "clipper" && p.role !== "agency") continue;
    rows.push({
      profileId: p.id,
      displayName: p.display_name,
      tier: p.tier,
      settledViews: byProfile.get(p.id) ?? 0,
    });
  }
  return rows.sort((a, b) => b.settledViews - a.settledViews).slice(0, limit);
}

/* ── Sweep lock ── */
export async function acquireSweepLock(key: string): Promise<boolean> {
  const { error } = await admin().from("sweep_locks").insert({ key });
  if (error) {
    if ((error as { code?: string }).code === "23505") return false;
    throw error;
  }
  return true;
}
