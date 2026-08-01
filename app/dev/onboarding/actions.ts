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
export async function startOnboardingPreview(formData?: FormData) {
  if (hasSupabase) notFound();

  // Clipper/agency share the 4-step flow; brand gets the 3-step business flow.
  const roleParam = formData?.get("role");
  const role =
    roleParam === "agency" ? "agency" : roleParam === "brand" ? "brand" : "clipper";
  const email = `${role}-${PREVIEW_EMAIL}`;
  const label =
    role === "brand" ? "Preview Brand" : role === "agency" ? "Preview Agency" : "Preview Clipper";
  const now = new Date().toISOString();
  let profile = await getProfileByEmail(email);

  if (!profile) {
    profile = await upsertProfile({
      id: newId("usr"),
      email,
      displayName: label,
      role,
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
    if (role !== "brand") {
      const appId = newId("app");
      await createApplication(
      {
        id: appId,
        profileId: profile.id,
        role,
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
    }
  } else {
    // Re-entry: rewind to step 0 AND wipe every onboarding field so each preview
    // starts blank (clipper + brand fields alike).
    await updateProfile(profile.id, {
      role,
      access: "active",
      profileCompleted: false,
      onboardingStep: 0,
      displayName: label,
      firstName: undefined,
      lastName: undefined,
      username: undefined,
      location: undefined,
      postLanguages: undefined,
      orgName: undefined,
      website: undefined,
      industry: undefined,
      monthlySpend: undefined,
      campaignExperience: undefined,
    });
  }

  await setSession(profile.id);
  redirect("/onboarding");
}
