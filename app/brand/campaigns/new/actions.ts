"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { newId, upsertCampaign } from "@/lib/db";
import { RATE_BRAND_PER_1K, RATE_CLIPPER_PER_1K, type Platform } from "@/lib/db/types";
import { takaToPoisha } from "@/lib/money";
import { endOfDhakaDay } from "@/lib/format";
import { NICHES } from "@/lib/platforms";

const schema = z.object({
  name: z.string().trim().min(3, "Give the campaign a clear name").max(80),
  niche: z.enum(NICHES),
  brief: z.string().trim().min(10, "Write a short brief: what should clippers post?").max(1200),
  guidelines: z.string().trim().max(1200).optional(),
  sourceUrl: z.string().trim().url("Link the exact clip file clippers will post"),
  budgetTaka: z.coerce.number().int().min(5_000, "Minimum budget is ৳5,000").max(10_000_000),
  minQualifyViews: z.coerce.number().int().min(2_000).max(4_000),
  maxPerClipperTaka: z.coerce.number().int().min(500, "At least ৳500 per clipper").max(1_000_000),
  submissionCapBase: z.coerce.number().int().min(1).max(10),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick an end date"),
  earlyAccess: z.enum(["none", "pro", "elite"]),
  earlyAccessDays: z.coerce.number().int().min(1).max(14).optional(),
});

export type NewCampaignState = { error?: string };

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

  const platforms = (["tiktok", "youtube", "instagram", "facebook"] as Platform[]).filter(
    (p) => formData.get(`platform_${p}`) === "on",
  );
  if (platforms.length === 0) return { error: "Pick at least one platform." };

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
    earlyAccess: formData.get("earlyAccess") ?? "none",
    earlyAccessDays: formData.get("earlyAccessDays") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const d = parsed.data;

  const now = new Date();
  const endIso = endOfDhakaDay(d.endDate);
  if (endIso <= now.toISOString()) return { error: "End date must be in the future." };

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
    earlyAccessTier: d.earlyAccess === "none" ? undefined : d.earlyAccess,
    earlyAccessEndsAt:
      d.earlyAccess === "none"
        ? undefined
        : new Date(now.getTime() + (d.earlyAccessDays ?? 3) * 86400_000).toISOString(),
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
