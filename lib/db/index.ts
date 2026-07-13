/**
 * Data access facade. Async surface backed by Supabase when configured,
 * otherwise the local JSON store (zero-config dev). App code imports ONLY
 * from here — swapping persistence never touches the call sites.
 */
import { hasSupabase } from "@/lib/env";
import * as local from "./store";
import * as remote from "./supabase-impl";
import type { Campaign, Payout, Profile, Submission } from "./types";

export { newId } from "./store";

/* ── Profiles ── */
export const getProfile = (id: string): Promise<Profile | undefined> =>
  hasSupabase ? remote.getProfile(id) : Promise.resolve(local.getProfile(id));
export const getProfileByEmail = (email: string): Promise<Profile | undefined> =>
  hasSupabase ? remote.getProfileByEmail(email) : Promise.resolve(local.getProfileByEmail(email));
export const listProfiles = (): Promise<Profile[]> =>
  hasSupabase ? remote.listProfiles() : Promise.resolve(local.listProfiles());
export const upsertProfile = (p: Profile): Promise<Profile> =>
  hasSupabase ? remote.upsertProfile(p) : Promise.resolve(local.upsertProfile(p));

/* ── Campaigns ── */
export const listCampaigns = (status?: Campaign["status"]): Promise<Campaign[]> =>
  hasSupabase ? remote.listCampaigns(status) : Promise.resolve(local.listCampaigns(status));
export const getCampaign = (id: string): Promise<Campaign | undefined> =>
  hasSupabase ? remote.getCampaign(id) : Promise.resolve(local.getCampaign(id));
export const upsertCampaign = (c: Campaign): Promise<Campaign> =>
  hasSupabase ? remote.upsertCampaign(c) : Promise.resolve(local.upsertCampaign(c));

/* ── Submissions ── */
export const listSubmissions = (filter?: {
  campaignId?: string;
  profileId?: string;
}): Promise<Submission[]> =>
  hasSupabase ? remote.listSubmissions(filter) : Promise.resolve(local.listSubmissions(filter));
export const getSubmissionByUrl = (postUrl: string): Promise<Submission | undefined> =>
  hasSupabase ? remote.getSubmissionByUrl(postUrl) : Promise.resolve(local.getSubmissionByUrl(postUrl));
export const createSubmission = (s: Submission): Promise<Submission> =>
  hasSupabase ? remote.createSubmission(s) : Promise.resolve(local.createSubmission(s));
export const updateSubmission = (
  id: string,
  patch: Partial<Submission>,
): Promise<Submission | undefined> =>
  hasSupabase ? remote.updateSubmission(id, patch) : Promise.resolve(local.updateSubmission(id, patch));

/* ── Payouts ── */
export const listPayouts = (filter?: {
  campaignId?: string;
  profileId?: string;
}): Promise<Payout[]> =>
  hasSupabase ? remote.listPayouts(filter) : Promise.resolve(local.listPayouts(filter));
export const replacePayoutsForCampaign = (
  campaignId: string,
  rows: Payout[],
): Promise<void> =>
  hasSupabase
    ? remote.replacePayoutsForCampaign(campaignId, rows)
    : Promise.resolve(local.replacePayoutsForCampaign(campaignId, rows));
export const updatePayout = (
  id: string,
  patch: Partial<Payout>,
): Promise<Payout | undefined> =>
  hasSupabase ? remote.updatePayout(id, patch) : Promise.resolve(local.updatePayout(id, patch));
