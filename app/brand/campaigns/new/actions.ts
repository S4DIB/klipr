"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireRole, requireUser } from "@/lib/auth/guards";
import {
  createNotification,
  deleteCampaign,
  getCampaign,
  newId,
  updateCampaign,
  upsertCampaign,
} from "@/lib/db";
import {
  RATE_BRAND_PER_1K,
  RATE_CLIPPER_PER_1K,
  type Campaign,
  type CampaignStatus,
  type Platform,
} from "@/lib/db/types";
import { takaToPoisha } from "@/lib/money";
import { endOfDhakaDay } from "@/lib/format";
import { normalizeUrl } from "@/lib/url";
import { NICHES } from "@/lib/platforms";

const schema = z.object({
  name: z.string().trim().min(3, "Give the campaign a clear name").max(80),
  niche: z.enum(NICHES),
  brief: z.string().trim().min(10, "Write a short brief: what should clippers post?").max(1200),
  guidelines: z.string().trim().max(1200).optional(),
  sourceUrl: z.preprocess(
    (v) => (typeof v === "string" ? normalizeUrl(v) : v),
    z.string().url("Link the exact clip file clippers will post"),
  ),
  budgetTaka: z.coerce.number().int().min(5_000, "Minimum budget is ৳5,000").max(10_000_000),
  minQualifyViews: z.coerce.number().int().min(2_000).max(4_000),
  maxPerClipperTaka: z.coerce.number().int().min(500, "At least ৳500 per clipper").max(1_000_000),
  submissionCapBase: z.coerce.number().int().min(1).max(10),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick an end date"),
});

/** Campaigns can only be edited/deleted before they go live to clippers. */
const EDITABLE_STATUSES: CampaignStatus[] = ["draft", "pending_funding"];

export type NewCampaignState = { error?: string };

/** Read + validate the wizard fields shared by create and edit. */
function parseCampaignForm(
  formData: FormData,
):
  | { ok: true; data: z.infer<typeof schema>; platforms: Platform[]; endIso: string }
  | { ok: false; error: string } {
  const platforms = (["tiktok", "youtube", "instagram", "facebook"] as Platform[]).filter(
    (p) => formData.get(`platform_${p}`) === "on",
  );
  if (platforms.length === 0) return { ok: false, error: "Pick at least one platform." };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    niche: formData.get("niche"),
    brief: formData.get("brief"),
    guidelines: formData.get("guidelines") || undefined,
    sourceUrl: formData.get("sourceUrl"),
    budgetTaka: formData.get("budgetTaka"),
    minQualifyViews: formData.get("minQualifyViews"),
    maxPerClipperTaka: formData.get("maxPerClipperTaka"),
    submissionCapBase: formData.get("submissionCapBase"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const endIso = endOfDhakaDay(parsed.data.endDate);
  if (endIso <= new Date().toISOString()) {
    return { ok: false, error: "End date must be in the future." };
  }
  return { ok: true, data: parsed.data, platforms, endIso };
}

/** Only the owning brand or a SaaS admin may manage a campaign. */
async function authorizeManage(campaign: Campaign) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false as const, error: "Sign in required." };
  }
  const isOwner = user.role === "brand" && campaign.brandProfileId === user.id;
  if (user.role !== "admin" && !isOwner) {
    return { ok: false as const, error: "Not authorized." };
  }
  return { ok: true as const, user };
}

/**
 * Create → PENDING FUNDING. The rate is fixed (৳60/1,000 verified views) and
 * snapshotted; the campaign only goes live once an admin confirms the escrow
 * arrived.
 */
export async function createCampaign(
  _prev: NewCampaignState,
  formData: FormData,
): Promise<NewCampaignState> {
  let user;
  try {
    user = await requireRole("brand");
  } catch {
    return { error: "Brand account required." };
  }

  const parsed = parseCampaignForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const { data: d, platforms, endIso } = parsed;

  const now = new Date();
  const id = newId("cmp");
  await upsertCampaign({
    id,
    brandProfileId: user.id,
    name: d.name,
    brandName: user.orgName || user.displayName,
    brief: d.brief,
    guidelines: d.guidelines ?? "",
    niche: d.niche,
    allowedPlatforms: platforms,
    sourceUrl: d.sourceUrl,
    budgetPoisha: takaToPoisha(d.budgetTaka),
    spentPoisha: 0,
    rateClipperPer1k: RATE_CLIPPER_PER_1K,
    rateBrandPer1k: RATE_BRAND_PER_1K,
    minQualifyViews: d.minQualifyViews,
    maxPayoutPerClipperPoisha: takaToPoisha(d.maxPerClipperTaka),
    submissionCapBase: d.submissionCapBase,
    trackingWindowDays: 7,
    startDate: now.toISOString(),
    endDate: endIso,
    status: "pending_funding",
    createdAt: now.toISOString(),
  });

  revalidatePath("/brand");
  revalidatePath("/admin/campaigns");
  redirect(`/brand/campaigns/${id}`);
}

/**
 * Edit a campaign that hasn't gone live yet. The owning brand or an admin can
 * change any field; financials stay safe because editing is blocked once the
 * campaign is public (clips + escrow are in play by then).
 */
export async function editCampaign(
  _prev: NewCampaignState,
  formData: FormData,
): Promise<NewCampaignState> {
  const id = String(formData.get("campaignId") ?? "");
  const campaign = await getCampaign(id);
  if (!campaign) return { error: "Campaign not found." };

  const auth = await authorizeManage(campaign);
  if (!auth.ok) return { error: auth.error };
  if (!EDITABLE_STATUSES.includes(campaign.status)) {
    return { error: "This campaign is already live — it can no longer be edited." };
  }

  const parsed = parseCampaignForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const { data: d, platforms, endIso } = parsed;

  await updateCampaign(id, {
    name: d.name,
    brief: d.brief,
    guidelines: d.guidelines ?? "",
    niche: d.niche,
    allowedPlatforms: platforms,
    sourceUrl: d.sourceUrl,
    budgetPoisha: takaToPoisha(d.budgetTaka),
    minQualifyViews: d.minQualifyViews,
    maxPayoutPerClipperPoisha: takaToPoisha(d.maxPerClipperTaka),
    submissionCapBase: d.submissionCapBase,
    endDate: endIso,
  });

  revalidatePath("/brand");
  revalidatePath("/admin/campaigns");
  revalidatePath(`/brand/campaigns/${id}`);
  revalidatePath(`/admin/campaigns/${id}`);
  redirect(auth.user.role === "admin" ? `/admin/campaigns/${id}` : `/brand/campaigns/${id}`);
}

/**
 * Admins delete unconditionally — any campaign, any state, right now. The DB
 * layer cascades submissions / xp / ledger so nothing is orphaned. This also
 * serves as "approve deletion" for a brand's pending request.
 */
export async function adminDeleteCampaign(formData: FormData): Promise<void> {
  try {
    await requireAdmin();
  } catch {
    return;
  }
  const id = String(formData.get("campaignId") ?? "");
  const campaign = await getCampaign(id);
  if (!campaign) return;

  const wasRequested = Boolean(campaign.deletionRequestedAt);
  await deleteCampaign(id);

  // Tell the brand — the campaign row is gone, so this notice stands on its own.
  await createNotification({
    id: newId("ntf"),
    profileId: campaign.brandProfileId,
    kind: "campaign_deleted",
    title: "Campaign removed",
    body: wasRequested
      ? `Your deletion request for “${campaign.name}” was approved — the campaign has been removed.`
      : `Your campaign “${campaign.name}” was removed by the Klipr team. Reach out to support if you have questions.`,
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/brand");
  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

/**
 * A brand can't delete its own campaign directly — it raises a request that an
 * admin approves. This just flags the campaign; the admin portal surfaces it.
 */
export async function requestCampaignDeletion(formData: FormData): Promise<void> {
  let user;
  try {
    user = await requireRole("brand");
  } catch {
    return;
  }
  const id = String(formData.get("campaignId") ?? "");
  const campaign = await getCampaign(id);
  if (!campaign || campaign.brandProfileId !== user.id) return;

  if (!campaign.deletionRequestedAt) {
    await updateCampaign(id, { deletionRequestedAt: new Date().toISOString() });
  }

  revalidatePath("/brand");
  revalidatePath(`/brand/campaigns/${id}`);
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${id}`);
  redirect(`/brand/campaigns/${id}`);
}

/**
 * Clear a pending deletion request without deleting: the admin dismissing it or
 * the brand cancelling their own. Owner or admin only.
 */
export async function clearDeletionRequest(formData: FormData): Promise<void> {
  const id = String(formData.get("campaignId") ?? "");
  const campaign = await getCampaign(id);
  if (!campaign) return;

  const auth = await authorizeManage(campaign);
  if (!auth.ok) return;

  if (campaign.deletionRequestedAt) {
    await updateCampaign(id, { deletionRequestedAt: undefined });
  }

  revalidatePath("/brand");
  revalidatePath(`/brand/campaigns/${id}`);
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${id}`);
  redirect(auth.user.role === "admin" ? "/admin/campaigns" : `/brand/campaigns/${id}`);
}
