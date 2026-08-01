"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { appendLedgerEvent, getCampaign, updateCampaign } from "@/lib/db";
import { buildFundingEvent, buildRefundEvent } from "@/lib/ledger";
import { remainingBudgetPoisha } from "@/lib/campaign-rules";

/**
 * Cancel a campaign. Pre-funding: just cancelled. Active: stops new
 * submissions (→ settling); open windows drain and the sweep refunds the
 * remainder when the last one closes.
 */
export async function cancelCampaign(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("campaignId") ?? "");
  const campaign = await getCampaign(id);
  if (!campaign) return;

  if (campaign.status === "draft" || campaign.status === "pending_funding") {
    await updateCampaign(id, { status: "cancelled" });
  } else if (campaign.status === "active") {
    await updateCampaign(id, { status: "settling" });
  } else if (campaign.status === "settling") {
    // If nothing is open the sweep would do this too. Allow the manual close.
    const remainder = remainingBudgetPoisha(campaign);
    if (remainder > 0) await appendLedgerEvent(buildRefundEvent(id, remainder));
    await updateCampaign(id, { status: "completed" });
  }
  revalidatePath("/admin/campaigns");
  revalidatePath("/brand");
  revalidatePath("/campaigns");
}

/* ── Approval model (public-only approve; funding is a separate step) ── */

/** Approve → make the campaign public to clippers. Money is NOT touched here. */
export async function approveCampaign(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("campaignId") ?? "");
  const campaign = await getCampaign(id);
  if (!campaign || campaign.status !== "pending_funding") return;
  await updateCampaign(id, { status: "active" });
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${id}`);
  revalidatePath("/campaigns");
  revalidatePath("/brand");
}

/** Reject a pending campaign → cancelled. */
export async function rejectCampaign(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("campaignId") ?? "");
  const campaign = await getCampaign(id);
  if (!campaign) return;
  if (campaign.status === "pending_funding" || campaign.status === "draft") {
    await updateCampaign(id, { status: "cancelled" });
  }
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${id}`);
  revalidatePath("/brand");
}

/**
 * Mark the brand's money as received — the SEPARATE funding step (detail page).
 * Writes the escrow/funding ledger entry so clippers can be paid for this
 * campaign. Independent of public approval; only runs once.
 */
export async function markCampaignFunded(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("campaignId") ?? "");
  const campaign = await getCampaign(id);
  if (!campaign || campaign.fundedAt) return;
  const { inserted } = await appendLedgerEvent(buildFundingEvent(id, campaign.budgetPoisha));
  if (inserted) {
    await updateCampaign(id, { fundedAt: new Date().toISOString() });
  }
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${id}`);
  revalidatePath("/brand");
}
