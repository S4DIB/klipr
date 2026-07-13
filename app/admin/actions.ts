"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import {
  updateSubmission,
  getCampaign,
  upsertCampaign,
  listSubmissions,
  replacePayoutsForCampaign,
  updatePayout,
  newId,
} from "@/lib/db";
import { computePayouts } from "@/lib/payout";
import type { Payout } from "@/lib/db/types";

async function requireAdmin() {
  const user = await currentUser();
  if (!user || user.role !== "admin") throw new Error("Not authorised");
  return user;
}

export async function recordVerification(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("submissionId"));
  const views = z.coerce.number().int().min(0).parse(formData.get("views"));
  await updateSubmission(id, {
    verifiedViews: views,
    status: "verified",
    verifiedBy: admin.id,
    verifiedAt: new Date().toISOString(),
  });
  revalidatePath("/admin");
}

export async function rejectSubmission(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("submissionId"));
  const reason = String(formData.get("reason") || "Did not meet guidelines");
  await updateSubmission(id, { status: "rejected", rejectReason: reason });
  revalidatePath("/admin");
}

/** Close a campaign and materialise the proportional payout batch (immutable). */
export async function closeCampaign(formData: FormData) {
  await requireAdmin();
  const campaignId = String(formData.get("campaignId"));
  const campaign = await getCampaign(campaignId);
  if (!campaign) return;

  const subs = await listSubmissions({ campaignId });
  const result = computePayouts(
    campaign.budget,
    campaign.minViewThreshold,
    subs.map((s) => ({
      id: s.id,
      profileId: s.profileId,
      verifiedViews: s.verifiedViews,
      status: s.status,
    })),
  );

  const rows: Payout[] = result.lines.map((l) => ({
    id: newId("pay"),
    campaignId,
    profileId: l.profileId,
    viewsUsed: l.views,
    amount: l.amount,
    status: "pending",
    createdAt: new Date().toISOString(),
  }));
  await replacePayoutsForCampaign(campaignId, rows);

  await upsertCampaign({ ...campaign, status: "closed" });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function markPaid(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("payoutId"));
  const txnRef = String(formData.get("txnRef") || "").trim() || `TX${Date.now()}`;
  await updatePayout(id, {
    status: "paid",
    txnRef,
    paidAt: new Date().toISOString(),
  });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}
