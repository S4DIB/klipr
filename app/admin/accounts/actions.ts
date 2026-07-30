"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { getConnectedAccount, updateConnectedAccount } from "@/lib/db";

/**
 * Manual account verification. With no platform API, an admin confirms a
 * connected page really belongs to the clipper before it can submit clips.
 * Approve → active; reject → revoked. Both stamp the verifier for audit.
 */
export async function approveAccount(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const accountId = String(formData.get("accountId") ?? "");
  const acc = await getConnectedAccount(accountId);
  if (!acc || acc.status !== "pending") return;
  await updateConnectedAccount(accountId, {
    status: "active",
    verifiedBy: admin.id,
    verifiedAt: new Date().toISOString(),
  });
  revalidatePath("/admin/accounts");
  revalidatePath("/connections");
}

export async function rejectAccount(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const accountId = String(formData.get("accountId") ?? "");
  const acc = await getConnectedAccount(accountId);
  if (!acc || acc.status !== "pending") return;
  await updateConnectedAccount(accountId, {
    status: "revoked",
    verifiedBy: admin.id,
    verifiedAt: new Date().toISOString(),
  });
  revalidatePath("/admin/accounts");
  revalidatePath("/connections");
}
