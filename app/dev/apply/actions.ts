"use server";

import { redirect, notFound } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { getProfileByEmail, upsertProfile, updateProfile, newId } from "@/lib/db";
import { setSession } from "@/lib/auth/session";

const PREVIEW_EMAIL = "apply-preview@klipr.dev";

/**
 * DEV ONLY. Seeds a throwaway account with NO marketplace access and drops it on
 * /apply, where the Clipper / Agency / Brand application forms live (brand
 * signup is the self-serve one; clipper/agency are invite-only stubs). Resets on
 * re-entry. 404s whenever Supabase is configured, so it never runs in prod.
 */
export async function startApplyPreview() {
  if (hasSupabase) notFound();

  const now = new Date().toISOString();
  let profile = await getProfileByEmail(PREVIEW_EMAIL);

  if (!profile) {
    profile = await upsertProfile({
      id: newId("usr"),
      email: PREVIEW_EMAIL,
      displayName: "Apply Preview",
      role: "clipper",
      access: "none",
      tier: "beginner",
      xpTotal: 0,
      streakWeeks: 0,
      nidStatus: "none",
      leaderboardOptOut: false,
      accountStatus: "active",
      profileCompleted: false,
      onboardingStep: 0,
      createdAt: now,
    });
  } else {
    // Rewind: a brand submit would have flipped role/access/completed.
    await updateProfile(profile.id, {
      role: "clipper",
      access: "none",
      profileCompleted: false,
      orgName: undefined,
      displayName: "Apply Preview",
    });
  }

  await setSession(profile.id);
  redirect("/apply");
}
