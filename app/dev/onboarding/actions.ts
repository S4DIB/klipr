"use server";

import { redirect, notFound } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import {
  getProfileByEmail,
  upsertProfile,
  updateProfile,
  createApplication,
  newId,
} from "@/lib/db";
import { setSession } from "@/lib/auth/session";

const PREVIEW_EMAIL = "onboarding-preview@klipr.dev";

/**
 * DEV ONLY. Seeds (or resets) a throwaway APPROVED clipper parked at the first
 * onboarding step with two vetted pages, signs in as them, and drops into the
 * real /onboarding flow so the design can be reviewed end-to-end. Guarded off
 * whenever Supabase is configured — i.e. it never runs in production.
 */
export async function startOnboardingPreview() {
  if (hasSupabase) notFound();

  const now = new Date().toISOString();
  let profile = await getProfileByEmail(PREVIEW_EMAIL);

  if (!profile) {
    profile = await upsertProfile({
      id: newId("usr"),
      email: PREVIEW_EMAIL,
      displayName: "Preview Clipper",
      role: "clipper",
      access: "active",
      tier: "beginner",
      xpTotal: 120,
      streakWeeks: 0,
      nidStatus: "none",
      leaderboardOptOut: false,
      accountStatus: "active",
      profileCompleted: false,
      onboardingStep: 0,
      createdAt: now,
    });
    const appId = newId("app");
    await createApplication(
      {
        id: appId,
        profileId: profile.id,
        role: "clipper",
        note: "Onboarding design preview.",
        status: "approved",
        reviewedAt: now,
        createdAt: now,
      },
      [
        {
          id: newId("apg"),
          applicationId: appId,
          platform: "tiktok",
          handle: "@previewclips",
          url: "https://www.tiktok.com/@previewclips",
          selfReportedFollowers: 12400,
          niche: "Comedy",
          vetStatus: "approved",
        },
        {
          id: newId("apg"),
          applicationId: appId,
          platform: "youtube",
          handle: "@previewclips",
          url: "https://www.youtube.com/@previewclips",
          selfReportedFollowers: 8300,
          niche: "Gaming",
          vetStatus: "approved",
        },
      ],
    );
  } else {
    // Re-entry: rewind to step 0 AND wipe the profile fields so every preview
    // starts blank (editable username, empty name/location/languages).
    await updateProfile(profile.id, {
      access: "active",
      profileCompleted: false,
      onboardingStep: 0,
      displayName: "Preview Clipper",
      firstName: undefined,
      lastName: undefined,
      username: undefined,
      location: undefined,
      postLanguages: undefined,
    });
  }

  await setSession(profile.id);
  redirect("/onboarding");
}
