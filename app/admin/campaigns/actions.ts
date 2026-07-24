"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { appendLedgerEvent, getCampaign, updateCampaign } from "@/lib/db";
import { buildFundingEvent, buildRefundEvent } from "@/lib/ledger";
import { remainingBudgetPoisha } from "@/lib/campaign-rules";

/**
 * Confirm the brand's escrow arrived: writes the zero-sum funding event and
 * flips the campaign live. One of the five human touchpoints.
 */
export async function confirmFunding(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("campaignId") ?? "");
  const campaign = await getCampaign(id);
  if (!campaign || campaign.status !== "pending_funding") return;

  const { inserted } = await appendLedgerEvent(buildFundingEvent(id, campaign.budgetPoisha));
  if (inserted) {
    await updateCampaign(id, { status: "active", fundedAt: new Date().toISOString() });
  }
  revalidatePath("/admin/campaigns");
  revalidatePath("/admin");
  revalidatePath("/brand");
  revalidatePath("/campaigns");
}

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
