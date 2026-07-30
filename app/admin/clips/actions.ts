"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { getSubmission, updateSubmission } from "@/lib/db";
import { settleSubmissionManually } from "@/lib/verify/sweep";

export type ClipActionState = { error?: string; ok?: string };

/**
 * Manual clip verification: an admin enters the verified view count and the
 * clip settles at the campaign rate (same money/XP path as the sweep). Below
 * the campaign minimum it settles honestly at ৳0.
 */
export async function settleClip(
  _prev: ClipActionState,
  formData: FormData,
): Promise<ClipActionState> {
  await requireAdmin();
  const submissionId = String(formData.get("submissionId") ?? "");
  const raw = String(formData.get("views") ?? "").replace(/[,\s]/g, "");
  const views = Number(raw);
  if (!raw || !Number.isFinite(views) || views < 0) {
    return { error: "Enter the verified view count (a whole number ≥ 0)." };
  }

  const sub = await getSubmission(submissionId);
  if (!sub) return { error: "Clip not found." };
  if (sub.status === "settled" || sub.status === "rejected") {
    return { error: "This clip is already finalized." };
  }

  const outcome = await settleSubmissionManually(submissionId, Math.floor(views));
  if (!outcome) return { error: "Could not settle this clip." };

  revalidatePath("/admin/clips");
  revalidatePath("/admin");
  revalidatePath("/clips");
  revalidatePath("/home");
  return {
    ok: outcome.zero
      ? "Settled at ৳0 — below the campaign minimum."
      : `Settled · +${outcome.xp} XP awarded.`,
  };
}

/** Reject a clip (never settles, no earnings/XP). */
export async function rejectClip(formData: FormData): Promise<void> {
  await requireAdmin();
  const submissionId = String(formData.get("submissionId") ?? "");
  const sub = await getSubmission(submissionId);
  if (!sub || sub.status === "settled" || sub.status === "rejected") return;
  await updateSubmission(submissionId, {
    status: "rejected",
    rejectReason: "Rejected in review.",
  });
  revalidatePath("/admin/clips");
  revalidatePath("/admin");
  revalidatePath("/clips");
}
