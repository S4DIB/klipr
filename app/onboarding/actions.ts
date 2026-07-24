"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireActiveClipper } from "@/lib/auth/guards";
import { bkashSchema } from "@/lib/validation/apply";
import {
  listConnectedAccounts,
  listVettedPagesForProfile,
  newId,
  updateProfile,
  upsertConnectedAccount,
} from "@/lib/db";

/**
 * Stub/simulated connect for a VETTED page. Live platforms replace this with
 * OAuth (Phase 5's /api/connect/youtube); the account row shape is identical,
 * so flipping a platform live never touches this flow's callers.
 */
export async function connectVettedPage(formData: FormData): Promise<void> {
  const user = await requireActiveClipper();
  const pageId = String(formData.get("pageId") ?? "");

  const vetted = await listVettedPagesForProfile(user.id);
  const page = vetted.find((p) => p.id === pageId);
  if (!page) return; // not theirs or not vetted. Silently no-op

  const existing = await listConnectedAccounts(user.id);
  if (existing.some((a) => a.applicationPageId === pageId && a.status === "active")) return;

  await upsertConnectedAccount({
    id: newId("acc"),
    profileId: user.id,
    platform: page.platform,
    applicationPageId: page.id,
    externalId: `sim_${page.id}`,
    handle: page.handle,
    followerCount: page.selfReportedFollowers,
    proof: "simulated",
    status: "active",
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/onboarding");
  revalidatePath("/connections");
}

/** Step 0 → 1. Connecting is skippable, but submissions require a linked page. */
export async function continueToPayout(): Promise<void> {
  const user = await requireActiveClipper();
  await updateProfile(user.id, { onboardingStep: Math.max(user.onboardingStep, 1) });
  revalidatePath("/onboarding");
}

export type BkashState = { error?: string };

/** Step 1 → 2. */
export async function saveBkash(_prev: BkashState, formData: FormData): Promise<BkashState> {
  const user = await requireActiveClipper();
  const parsed = bkashSchema.safeParse(formData.get("bkashNumber"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid bKash number." };
  }
  await updateProfile(user.id, { bkashNumber: parsed.data, onboardingStep: 2 });
  revalidatePath("/onboarding");
  return {};
}

/** Step 2 → the app. */
export async function completeOnboarding(): Promise<void> {
  const user = await requireActiveClipper();
  await updateProfile(user.id, { profileCompleted: true, onboardingStep: 99 });
  redirect("/home");
}
