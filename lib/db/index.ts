/**
 * Data access facade — the ONLY module app code imports for persistence.
 * Async surface backed by Supabase when configured, otherwise the local JSON
 * store (zero-config dev). Swapping persistence never touches call sites.
 */
import { hasSupabase } from "@/lib/env";
import * as local from "./store";
import * as remote from "./supabase-impl";
import type {
  Application,
  ApplicationPage,
  Campaign,
  CampaignStatus,
  ConnectedAccount,
  FraudFlag,
  LedgerEntry,
  Notification,
  PayoutBatch,
  Profile,
  Submission,
  SubmissionStatus,
  ViewSnapshot,
  XpEvent,
} from "./types";
import type { LedgerDraft } from "@/lib/ledger";

export { newId } from "./store";
export type { LeaderboardRow } from "./store";

/* ── Profiles ── */
export const getProfile = (id: string): Promise<Profile | undefined> =>
  hasSupabase ? remote.getProfile(id) : Promise.resolve(local.getProfile(id));
export const getProfileByEmail = (email: string): Promise<Profile | undefined> =>
  hasSupabase ? remote.getProfileByEmail(email) : Promise.resolve(local.getProfileByEmail(email));
export const listProfiles = (role?: Profile["role"]): Promise<Profile[]> =>
  hasSupabase ? remote.listProfiles(role) : Promise.resolve(local.listProfiles(role));
export const getProfilesByIds = (ids: string[]): Promise<Profile[]> =>
  hasSupabase ? remote.getProfilesByIds(ids) : Promise.resolve(local.getProfilesByIds(ids));
export const upsertProfile = (p: Profile): Promise<Profile> =>
  hasSupabase ? remote.upsertProfile(p) : Promise.resolve(local.upsertProfile(p));
export const updateProfile = (id: string, patch: Partial<Profile>): Promise<Profile | undefined> =>
  hasSupabase ? remote.updateProfile(id, patch) : Promise.resolve(local.updateProfile(id, patch));

/* ── Applications (the access loop) ── */
export const createApplication = (app: Application, pages: ApplicationPage[]): Promise<Application> =>
  hasSupabase ? remote.createApplication(app, pages) : Promise.resolve(local.createApplication(app, pages));
export const listApplications = (status?: Application["status"]): Promise<Application[]> =>
  hasSupabase ? remote.listApplications(status) : Promise.resolve(local.listApplications(status));
export const getApplication = (id: string): Promise<Application | undefined> =>
  hasSupabase ? remote.getApplication(id) : Promise.resolve(local.getApplication(id));
export const latestApplicationForProfile = (profileId: string): Promise<Application | undefined> =>
  hasSupabase
    ? remote.latestApplicationForProfile(profileId)
    : Promise.resolve(local.latestApplicationForProfile(profileId));
export const updateApplication = (
  id: string,
  patch: Partial<Application>,
): Promise<Application | undefined> =>
  hasSupabase ? remote.updateApplication(id, patch) : Promise.resolve(local.updateApplication(id, patch));
export const listApplicationPages = (applicationId: string): Promise<ApplicationPage[]> =>
  hasSupabase
    ? remote.listApplicationPages(applicationId)
    : Promise.resolve(local.listApplicationPages(applicationId));
export const updateApplicationPage = (
  id: string,
  patch: Partial<ApplicationPage>,
): Promise<ApplicationPage | undefined> =>
  hasSupabase
    ? remote.updateApplicationPage(id, patch)
    : Promise.resolve(local.updateApplicationPage(id, patch));
export const listVettedPagesForProfile = (profileId: string): Promise<ApplicationPage[]> =>
  hasSupabase
    ? remote.listVettedPagesForProfile(profileId)
    : Promise.resolve(local.listVettedPagesForProfile(profileId));

/* ── Connected accounts ── */
export const listConnectedAccounts = (profileId?: string): Promise<ConnectedAccount[]> =>
  hasSupabase
    ? remote.listConnectedAccounts(profileId)
    : Promise.resolve(local.listConnectedAccounts(profileId));
export const getConnectedAccount = (id: string): Promise<ConnectedAccount | undefined> =>
  hasSupabase ? remote.getConnectedAccount(id) : Promise.resolve(local.getConnectedAccount(id));
export const upsertConnectedAccount = (a: ConnectedAccount): Promise<ConnectedAccount> =>
  hasSupabase ? remote.upsertConnectedAccount(a) : Promise.resolve(local.upsertConnectedAccount(a));
export const updateConnectedAccount = (
  id: string,
  patch: Partial<ConnectedAccount>,
): Promise<ConnectedAccount | undefined> =>
  hasSupabase
    ? remote.updateConnectedAccount(id, patch)
    : Promise.resolve(local.updateConnectedAccount(id, patch));

/* ── Campaigns ── */
export const listCampaigns = (status?: CampaignStatus): Promise<Campaign[]> =>
  hasSupabase ? remote.listCampaigns(status) : Promise.resolve(local.listCampaigns(status));
export const listCampaignsByBrand = (brandProfileId: string): Promise<Campaign[]> =>
  hasSupabase
    ? remote.listCampaignsByBrand(brandProfileId)
    : Promise.resolve(local.listCampaignsByBrand(brandProfileId));
export const getCampaign = (id: string): Promise<Campaign | undefined> =>
  hasSupabase ? remote.getCampaign(id) : Promise.resolve(local.getCampaign(id));
export const getCampaignsByIds = (ids: string[]): Promise<Campaign[]> =>
  hasSupabase ? remote.getCampaignsByIds(ids) : Promise.resolve(local.getCampaignsByIds(ids));
export const upsertCampaign = (c: Campaign): Promise<Campaign> =>
  hasSupabase ? remote.upsertCampaign(c) : Promise.resolve(local.upsertCampaign(c));
export const updateCampaign = (id: string, patch: Partial<Campaign>): Promise<Campaign | undefined> =>
  hasSupabase ? remote.updateCampaign(id, patch) : Promise.resolve(local.updateCampaign(id, patch));
export const deleteCampaign = (id: string): Promise<void> =>
  hasSupabase ? remote.deleteCampaign(id) : Promise.resolve(local.deleteCampaign(id));

/* ── Submissions ── */
export const listSubmissions = (filter?: {
  campaignId?: string;
  profileId?: string;
  status?: SubmissionStatus;
}): Promise<Submission[]> =>
  hasSupabase ? remote.listSubmissions(filter) : Promise.resolve(local.listSubmissions(filter));
export const listSubmissionsForCampaigns = (campaignIds: string[]): Promise<Submission[]> =>
  hasSupabase
    ? remote.listSubmissionsForCampaigns(campaignIds)
    : Promise.resolve(local.listSubmissionsForCampaigns(campaignIds));
export const getSubmission = (id: string): Promise<Submission | undefined> =>
  hasSupabase ? remote.getSubmission(id) : Promise.resolve(local.getSubmission(id));
export const getSubmissionByUrl = (postUrl: string): Promise<Submission | undefined> =>
  hasSupabase ? remote.getSubmissionByUrl(postUrl) : Promise.resolve(local.getSubmissionByUrl(postUrl));
export const findSubmissionByMedia = (
  campaignId: string,
  mediaId: string,
): Promise<Submission | undefined> =>
  hasSupabase
    ? remote.findSubmissionByMedia(campaignId, mediaId)
    : Promise.resolve(local.findSubmissionByMedia(campaignId, mediaId));
export const createSubmission = (s: Submission): Promise<Submission> =>
  hasSupabase ? remote.createSubmission(s) : Promise.resolve(local.createSubmission(s));
export const updateSubmission = (
  id: string,
  patch: Partial<Submission>,
): Promise<Submission | undefined> =>
  hasSupabase ? remote.updateSubmission(id, patch) : Promise.resolve(local.updateSubmission(id, patch));
export const listSubmissionsDue = (nowIso: string): Promise<Submission[]> =>
  hasSupabase ? remote.listSubmissionsDue(nowIso) : Promise.resolve(local.listSubmissionsDue(nowIso));
export const listSubmissionsPolling = (nowIso: string): Promise<Submission[]> =>
  hasSupabase
    ? remote.listSubmissionsPolling(nowIso)
    : Promise.resolve(local.listSubmissionsPolling(nowIso));
export const listPendingSubmissions = (): Promise<Submission[]> =>
  hasSupabase ? remote.listPendingSubmissions() : Promise.resolve(local.listPendingSubmissions());

/* ── View snapshots ── */
export const appendSnapshots = (rows: ViewSnapshot[]): Promise<void> =>
  hasSupabase ? remote.appendSnapshots(rows) : Promise.resolve(local.appendSnapshots(rows));
export const listSnapshots = (submissionId: string): Promise<ViewSnapshot[]> =>
  hasSupabase ? remote.listSnapshots(submissionId) : Promise.resolve(local.listSnapshots(submissionId));

/* ── XP ── */
export const appendXpEvents = (rows: XpEvent[]): Promise<void> =>
  hasSupabase ? remote.appendXpEvents(rows) : Promise.resolve(local.appendXpEvents(rows));
export const listXpEvents = (profileId: string): Promise<XpEvent[]> =>
  hasSupabase ? remote.listXpEvents(profileId) : Promise.resolve(local.listXpEvents(profileId));
export const xpByAccount = (profileId: string): Promise<Record<string, number>> =>
  hasSupabase ? remote.xpByAccount(profileId) : Promise.resolve(local.xpByAccount(profileId));

/* ── Ledger ── */
export const appendLedgerEvent = (drafts: LedgerDraft[]): Promise<{ inserted: boolean }> =>
  hasSupabase ? remote.appendLedgerEvent(drafts) : Promise.resolve(local.appendLedgerEvent(drafts));
export const listLedger = (filter?: {
  account?: string;
  profileId?: string;
}): Promise<LedgerEntry[]> =>
  hasSupabase ? remote.listLedger(filter) : Promise.resolve(local.listLedger(filter));
export const ledgerBalance = (account: string): Promise<number> =>
  hasSupabase ? remote.ledgerBalance(account) : Promise.resolve(local.ledgerBalance(account));

/* ── Payout batches ── */
export const createPayoutBatch = (b: PayoutBatch): Promise<PayoutBatch> =>
  hasSupabase ? remote.createPayoutBatch(b) : Promise.resolve(local.createPayoutBatch(b));
export const listPayoutBatches = (filter?: {
  profileId?: string;
  status?: PayoutBatch["status"];
}): Promise<PayoutBatch[]> =>
  hasSupabase ? remote.listPayoutBatches(filter) : Promise.resolve(local.listPayoutBatches(filter));
export const updatePayoutBatch = (
  id: string,
  patch: Partial<PayoutBatch>,
): Promise<PayoutBatch | undefined> =>
  hasSupabase ? remote.updatePayoutBatch(id, patch) : Promise.resolve(local.updatePayoutBatch(id, patch));

/* ── Fraud flags ── */
export const createFraudFlag = (f: FraudFlag): Promise<FraudFlag> =>
  hasSupabase ? remote.createFraudFlag(f) : Promise.resolve(local.createFraudFlag(f));
export const listFraudFlags = (filter?: {
  status?: FraudFlag["status"];
  submissionId?: string;
}): Promise<FraudFlag[]> =>
  hasSupabase ? remote.listFraudFlags(filter) : Promise.resolve(local.listFraudFlags(filter));
export const updateFraudFlag = (
  id: string,
  patch: Partial<FraudFlag>,
): Promise<FraudFlag | undefined> =>
  hasSupabase ? remote.updateFraudFlag(id, patch) : Promise.resolve(local.updateFraudFlag(id, patch));

/* ── Notifications ── */
export const createNotification = (n: Notification): Promise<Notification> =>
  hasSupabase ? remote.createNotification(n) : Promise.resolve(local.createNotification(n));
export const listNotifications = (profileId: string): Promise<Notification[]> =>
  hasSupabase ? remote.listNotifications(profileId) : Promise.resolve(local.listNotifications(profileId));
export const listUnreadNotifications = (profileId: string): Promise<Notification[]> =>
  hasSupabase
    ? remote.listUnreadNotifications(profileId)
    : Promise.resolve(local.listUnreadNotifications(profileId));
export const markNotificationRead = (id: string, profileId: string): Promise<void> =>
  hasSupabase
    ? remote.markNotificationRead(id, profileId)
    : Promise.resolve(local.markNotificationRead(id, profileId));
export const markAllNotificationsRead = (profileId: string): Promise<void> =>
  hasSupabase
    ? remote.markAllNotificationsRead(profileId)
    : Promise.resolve(local.markAllNotificationsRead(profileId));

/* ── Leaderboard + sweep lock ── */
export const leaderboard = (limit?: number) =>
  hasSupabase ? remote.leaderboard(limit) : Promise.resolve(local.leaderboard(limit));
export const acquireSweepLock = (key: string): Promise<boolean> =>
  hasSupabase ? remote.acquireSweepLock(key) : Promise.resolve(local.acquireSweepLock(key));
