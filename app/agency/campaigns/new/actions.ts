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
  RATE_AGENCY_PER_1K,
  RATE_CLIPPER_PER_1K,
  type Campaign,
  type CampaignStatus,
  type Platform,
} from "@/lib/db/types";
import { agencyCostForClipperPayout, takaToPoisha } from "@/lib/money";
import { endOfDhakaDay } from "@/lib/format";
import { normalizeUrl } from "@/lib/url";
import { resolveCoverPatch } from "@/lib/storage/campaign-cover";
import { NICHES } from "@/lib/platforms";
import { RETAINER_MAX_SLOTS, RETAINER_MAX_VIDEOS } from "@/lib/campaign-rules";

/** Fields every campaign shares, whatever it pays. */
const baseSchema = z.object({
  name: z.string().trim().min(3, "Give the campaign a clear name").max(80),
  niche: z.enum(NICHES),
  brief: z.string().trim().min(10, "Write a short brief: what should clippers post?").max(1200),
  guidelines: z.string().trim().max(1200).optional(),
  sourceUrl: z.preprocess(
    (v) => (typeof v === "string" ? normalizeUrl(v) : v),
    z.string().url("Link the exact clip file clippers will post"),
  ),
  minQualifyViews: z.coerce.number().int().min(2_000).max(4_000),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick an end date"),
});

/** Open (marketplace) campaigns set their own ceiling and per-clipper limits. */
const openFields = {
  budgetTaka: z.coerce.number().int().min(5_000, "Minimum budget is ৳5,000").max(10_000_000),
  maxPerClipperTaka: z.coerce.number().int().min(500, "At least ৳500 per clipper").max(1_000_000),
  submissionCapBase: z.coerce.number().int().min(1).max(10),
};

/**
 * The money fields, by payout model. A retainer derives its ceiling and
 * per-clipper limits from the fee, video count and slots, so it takes none of
 * the open-campaign fields.
 */
const modelSchema = z.discriminatedUnion("payoutModel", [
  z.object({ payoutModel: z.literal("views"), ...openFields }),
  z.object({
    payoutModel: z.literal("per_video"),
    /** what a clipper earns for one accepted video */
    perVideoTaka: z.coerce.number().int().min(50, "At least ৳50 per video").max(1_000_000),
    ...openFields,
  }),
  z.object({
    payoutModel: z.literal("retainer"),
    /** what one clipper earns for the whole campaign */
    retainerTaka: z.coerce
      .number()
      .int()
      .min(500, "At least ৳500 per clipper on retainer")
      .max(1_000_000),
    retainerVideos: z.coerce
      .number()
      .int()
      .min(1, "Set how many videos each clipper delivers")
      .max(RETAINER_MAX_VIDEOS, `At most ${RETAINER_MAX_VIDEOS} videos per clipper`),
    retainerSlots: z.coerce
      .number()
      .int()
      .min(1, "Set how many clippers you're hiring")
      .max(RETAINER_MAX_SLOTS, `At most ${RETAINER_MAX_SLOTS} clippers on one retainer`),
  }),
]);
type ModelData = z.infer<typeof modelSchema>;
type CampaignFormData = z.infer<typeof baseSchema> & ModelData;

/** Campaigns can only be edited/deleted before they go live to clippers. */
const EDITABLE_STATUSES: CampaignStatus[] = ["draft", "pending_funding"];

export type NewCampaignState = { error?: string };

/** Read + validate the wizard fields shared by create and edit. */
function parseCampaignForm(
  formData: FormData,
): { ok: true; data: CampaignFormData; platforms: Platform[]; endIso: string } | { ok: false; error: string } {
  const platforms = (["tiktok", "youtube", "instagram", "facebook"] as Platform[]).filter(
    (p) => formData.get(`platform_${p}`) === "on",
  );
  if (platforms.length === 0) return { ok: false, error: "Pick at least one platform." };

  const base = baseSchema.safeParse({
    name: formData.get("name"),
    niche: formData.get("niche"),
    brief: formData.get("brief"),
    guidelines: formData.get("guidelines") || undefined,
    sourceUrl: formData.get("sourceUrl"),
    minQualifyViews: formData.get("minQualifyViews"),
    endDate: formData.get("endDate"),
  });
  if (!base.success) {
    return { ok: false, error: base.error.issues[0]?.message ?? "Check the form and try again." };
  }

  // an absent number reads as "" → 0, so each field's own min() message applies
  const num = (key: string) => formData.get(key) ?? "";
  const model = modelSchema.safeParse({
    payoutModel: formData.get("payoutModel") || "views",
    perVideoTaka: num("perVideoTaka"),
    budgetTaka: num("budgetTaka"),
    maxPerClipperTaka: num("maxPerClipperTaka"),
    submissionCapBase: num("submissionCapBase"),
    retainerTaka: num("retainerTaka"),
    retainerVideos: num("retainerVideos"),
    retainerSlots: num("retainerSlots"),
  });
  if (!model.success) {
    return { ok: false, error: model.error.issues[0]?.message ?? "Check the payout details." };
  }

  const endIso = endOfDhakaDay(base.data.endDate);
  if (endIso <= new Date().toISOString()) {
    return { ok: false, error: "End date must be in the future." };
  }
  return { ok: true, data: { ...base.data, ...model.data }, platforms, endIso };
}

/**
 * The money fields to store for a payout model. Views campaigns carry no flat
 * amounts; per-video campaigns snapshot both sides of the platform margin; a
 * retainer snapshots the fee both ways and derives the escrow ceiling (slots ×
 * agency fee), the per-clipper cap (the fee) and the submission cap (the video
 * count). Every model clears the other models' fields, so an edit that
 * switches model leaves nothing stale behind.
 */
function financials(
  d: ModelData,
): Pick<
  Campaign,
  | "payoutModel"
  | "perVideoClipperPoisha"
  | "perVideoAgencyPoisha"
  | "retainerClipperPoisha"
  | "retainerAgencyPoisha"
  | "retainerVideos"
  | "retainerSlots"
  | "budgetPoisha"
  | "maxPayoutPerClipperPoisha"
  | "submissionCapBase"
> {
  const none = {
    perVideoClipperPoisha: undefined,
    perVideoAgencyPoisha: undefined,
    retainerClipperPoisha: undefined,
    retainerAgencyPoisha: undefined,
    retainerVideos: undefined,
    retainerSlots: undefined,
  };
  if (d.payoutModel === "retainer") {
    const retainerClipperPoisha = takaToPoisha(d.retainerTaka);
    const retainerAgencyPoisha = agencyCostForClipperPayout(retainerClipperPoisha);
    return {
      ...none,
      payoutModel: "retainer",
      retainerClipperPoisha,
      retainerAgencyPoisha,
      retainerVideos: d.retainerVideos,
      retainerSlots: d.retainerSlots,
      budgetPoisha: retainerAgencyPoisha * d.retainerSlots,
      maxPayoutPerClipperPoisha: retainerClipperPoisha,
      submissionCapBase: d.retainerVideos,
    };
  }
  const open = {
    budgetPoisha: takaToPoisha(d.budgetTaka),
    maxPayoutPerClipperPoisha: takaToPoisha(d.maxPerClipperTaka),
    submissionCapBase: d.submissionCapBase,
  };
  if (d.payoutModel === "per_video") {
    const perVideoClipperPoisha = takaToPoisha(d.perVideoTaka);
    return {
      ...none,
      ...open,
      payoutModel: "per_video",
      perVideoClipperPoisha,
      perVideoAgencyPoisha: agencyCostForClipperPayout(perVideoClipperPoisha),
    };
  }
  return { ...none, ...open, payoutModel: "views" };
}

/** Only the owning agency or a SaaS admin may manage a campaign. */
async function authorizeManage(campaign: Campaign) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false as const, error: "Sign in required." };
  }
  const isOwner = user.role === "agency" && campaign.agencyProfileId === user.id;
  if (user.role !== "admin" && !isOwner) {
    return { ok: false as const, error: "Not authorized." };
  }
  return { ok: true as const, user };
}

/**
 * Create → PENDING FUNDING. The rates are fixed and snapshotted (৳60/1,000
 * verified views, or the flat / retainer amounts the wizard set); the campaign
 * only goes live once an admin confirms the escrow arrived.
 */
export async function createCampaign(
  _prev: NewCampaignState,
  formData: FormData,
): Promise<NewCampaignState> {
  let user;
  try {
    user = await requireRole("agency");
  } catch {
    return { error: "Agency account required." };
  }

  const parsed = parseCampaignForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const { data: d, platforms, endIso } = parsed;

  const now = new Date();
  const id = newId("cmp");
  await upsertCampaign({
    id,
    agencyProfileId: user.id,
    name: d.name,
    agencyName: user.orgName || user.displayName,
    brief: d.brief,
    guidelines: d.guidelines ?? "",
    niche: d.niche,
    allowedPlatforms: platforms,
    sourceUrl: d.sourceUrl,
    ...financials(d),
    spentPoisha: 0,
    rateClipperPer1k: RATE_CLIPPER_PER_1K,
    rateAgencyPer1k: RATE_AGENCY_PER_1K,
    minQualifyViews: d.minQualifyViews,
    trackingWindowDays: 7,
    startDate: now.toISOString(),
    endDate: endIso,
    status: "pending_funding",
    createdAt: now.toISOString(),
  });

  // after upsert: the cover path is namespaced by the campaign id
  const cover = await resolveCoverPatch(formData, id);
  if (cover) await updateCampaign(id, cover);

  revalidatePath("/agency");
  revalidatePath("/admin/campaigns");
  redirect(`/agency/campaigns/${id}`);
}

/**
 * Edit a campaign that hasn't gone live yet. The owning agency or an admin can
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

  const cover = await resolveCoverPatch(formData, id);

  await updateCampaign(id, {
    ...cover,
    name: d.name,
    brief: d.brief,
    guidelines: d.guidelines ?? "",
    niche: d.niche,
    allowedPlatforms: platforms,
    sourceUrl: d.sourceUrl,
    ...financials(d),
    minQualifyViews: d.minQualifyViews,
    endDate: endIso,
  });

  revalidatePath("/agency");
  revalidatePath("/admin/campaigns");
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
  revalidatePath(`/agency/campaigns/${id}`);
  revalidatePath(`/admin/campaigns/${id}`);
  redirect(auth.user.role === "admin" ? `/admin/campaigns/${id}` : `/agency/campaigns/${id}`);
}

/**
 * Admins delete unconditionally — any campaign, any state, right now. The DB
 * layer cascades submissions / xp / ledger so nothing is orphaned. This also
 * serves as "approve deletion" for an agency's pending request.
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

  // Tell the agency — the campaign row is gone, so this notice stands on its own.
  await createNotification({
    id: newId("ntf"),
    profileId: campaign.agencyProfileId,
    kind: "campaign_deleted",
    title: "Campaign removed",
    body: wasRequested
      ? `Your deletion request for “${campaign.name}” was approved — the campaign has been removed.`
      : `Your campaign “${campaign.name}” was removed by the Klipr team. Reach out to support if you have questions.`,
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/agency");
  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

/**
 * An agency can't delete its own campaign directly — it raises a request that an
 * admin approves. This just flags the campaign; the admin portal surfaces it.
 */
export async function requestCampaignDeletion(formData: FormData): Promise<void> {
  let user;
  try {
    user = await requireRole("agency");
  } catch {
    return;
  }
  const id = String(formData.get("campaignId") ?? "");
  const campaign = await getCampaign(id);
  if (!campaign || campaign.agencyProfileId !== user.id) return;

  if (!campaign.deletionRequestedAt) {
    await updateCampaign(id, { deletionRequestedAt: new Date().toISOString() });
  }

  revalidatePath("/agency");
  revalidatePath(`/agency/campaigns/${id}`);
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${id}`);
  redirect(`/agency/campaigns/${id}`);
}

/**
 * Clear a pending deletion request without deleting: the admin dismissing it or
 * the agency cancelling their own. Owner or admin only.
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

  revalidatePath("/agency");
  revalidatePath(`/agency/campaigns/${id}`);
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${id}`);
  redirect(auth.user.role === "admin" ? "/admin/campaigns" : `/agency/campaigns/${id}`);
}
