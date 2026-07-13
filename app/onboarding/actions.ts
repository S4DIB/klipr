"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { upsertProfile } from "@/lib/db";
import { onboardingSchema } from "@/lib/validation/onboarding";
import type { Platform, Role } from "@/lib/db/types";

export type OnboardingState = { error?: string };

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await currentUser();
  if (!user) redirect("/login");

  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const d = parsed.data;
  await upsertProfile({
    ...user,
    role: d.role as Role,
    displayName: d.displayName,
    payoutNumber: d.payoutNumber,
    pageUrl: d.pageUrl,
    handle: d.handle,
    platform: d.platform as Platform,
    followerCount: d.followerCount,
    profileCompleted: true,
  });

  redirect("/marketplace");
}
