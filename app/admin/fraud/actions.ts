"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import {
  getSubmission,
  listFraudFlags,
  updateFraudFlag,
  updateProfile,
  updateSubmission,
  getProfile,
} from "@/lib/db";
import { tierFor } from "@/lib/xp";

/** Release a hold: the clip resumes tracking with its snapshots intact. */
export async function releaseHold(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const flagId = String(formData.get("flagId") ?? "");
  const flag = (await listFraudFlags()).find((f) => f.id === flagId);
  if (!flag || flag.status !== "open") return;

  await updateFraudFlag(flagId, {
    status: "released",
    resolvedBy: admin.id,
    resolvedAt: new Date().toISOString(),
  });
  const sub = await getSubmission(flag.submissionId);
  if (sub && sub.status === "held") {
    await updateSubmission(sub.id, { status: "tracking", holdReason: undefined });
  }
  revalidatePath("/admin/fraud");
  revalidatePath("/clips");
}

/**
 * Uphold: the clip is rejected (zero XP, never settles), the streak resets,
 * and the tainted record demotes Pro/Elite (clean-record requirement).
 */
export async function upholdHold(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const flagId = String(formData.get("flagId") ?? "");
  const flag = (await listFraudFlags()).find((f) => f.id === flagId);
  if (!flag || flag.status !== "open") return;

  const now = new Date().toISOString();
  await updateFraudFlag(flagId, { status: "upheld", resolvedBy: admin.id, resolvedAt: now });

  const sub = await getSubmission(flag.submissionId);
  if (sub && sub.status !== "settled") {
    await updateSubmission(sub.id, {
      status: "rejected",
      rejectReason: "Fraudulent views confirmed by review.",
    });
    const profile = await getProfile(sub.profileId);
    if (profile) {
      await updateProfile(profile.id, {
        streakWeeks: 0,
        tier: tierFor(profile.xpTotal, { cleanRecord: false, streakWeeks: 0 }),
      });
    }
  }
  revalidatePath("/admin/fraud");
  revalidatePath("/admin/clippers");
  revalidatePath("/clips");
}
