"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { getProfile, listPayoutBatches, updatePayoutBatch, updateProfile } from "@/lib/db";

/**
 * Verify a submitted NID (one of the five human touchpoints). Any payout
 * batches blocked on it release to the queue automatically.
 */
export async function verifyNid(formData: FormData): Promise<void> {
  await requireAdmin();
  const profileId = String(formData.get("profileId") ?? "");
  const profile = await getProfile(profileId);
  if (!profile || profile.nidStatus !== "submitted") return;

  await updateProfile(profileId, { nidStatus: "verified" });
  const blocked = await listPayoutBatches({ profileId, status: "blocked_nid" });
  for (const b of blocked) {
    await updatePayoutBatch(b.id, { status: "queued" });
  }
  revalidatePath("/admin/clippers");
  revalidatePath("/admin/payouts");
  revalidatePath("/wallet");
}

export async function toggleBlock(formData: FormData): Promise<void> {
  await requireAdmin();
  const profileId = String(formData.get("profileId") ?? "");
  const profile = await getProfile(profileId);
  if (!profile || profile.role === "admin") return;
  await updateProfile(profileId, {
    accountStatus: profile.accountStatus === "blocked" ? "active" : "blocked",
  });
  revalidatePath("/admin/clippers");
}
