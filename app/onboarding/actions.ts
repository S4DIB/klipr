"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireActiveClipper, requireRole, requireUser } from "@/lib/auth/guards";
import { bkashSchema } from "@/lib/validation/apply";
import {
  createApplication,
  listConnectedAccounts,
  listProfiles,
  listVettedPagesForProfile,
  newId,
  updateProfile,
  upsertConnectedAccount,
} from "@/lib/db";
import { platformFromUrl, handleFromUrl } from "@/lib/platforms";
import { uploadBrandLogo } from "@/lib/storage/brand-logo";

/* ── Steps: 0 profile · 1 about · 2 connect (skippable) · 3 payout ── */

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export type ProfileState = { error?: string; field?: "firstName" | "username" };

/** Step 0 → 1. Name + username. Mobile & email are read-only (waitlist-drawn). */
export async function saveProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireActiveClipper();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  if (!firstName) return { error: "Enter your first name.", field: "firstName" };

  // Username is PERMANENT: claimed once, never changed. Only validate/claim on
  // the first pass (when the profile has none). After that the submitted value
  // is ignored — the stored username always wins, even against tampering.
  let username = user.username ?? "";
  if (!username) {
    username = String(formData.get("username") ?? "")
      .trim()
      .toLowerCase()
      .replace(/^@/, "");
    if (!USERNAME_RE.test(username)) {
      return { error: "3–20 letters, numbers or underscores.", field: "username" };
    }
    const taken = (await listProfiles()).some(
      (p) => p.id !== user.id && p.username?.toLowerCase() === username,
    );
    if (taken) return { error: "That username is taken.", field: "username" };
  }

  await updateProfile(user.id, {
    firstName,
    lastName: lastName || undefined,
    username,
    displayName: lastName ? `${firstName} ${lastName}` : firstName,
    onboardingStep: Math.max(user.onboardingStep, 1),
  });
  revalidatePath("/onboarding");
  return {};
}

export type AboutState = { error?: string };

/** Step 1 → 2. Location + the languages they post in. */
export async function saveAbout(
  _prev: AboutState,
  formData: FormData,
): Promise<AboutState> {
  const user = await requireActiveClipper();
  const location = String(formData.get("location") ?? "").trim();
  const languages = formData.getAll("languages").map(String).filter(Boolean);

  if (!location) return { error: "Pick your location." };
  if (languages.length === 0) return { error: "Pick at least one language." };

  await updateProfile(user.id, {
    location,
    postLanguages: languages.join(", "),
    onboardingStep: Math.max(user.onboardingStep, 2),
  });
  revalidatePath("/onboarding");
  return {};
}

/**
 * Connect a waitlist-vetted page. With no platform API, ownership is verified
 * MANUALLY: the account is created "pending" and an admin approves it before it
 * can submit (mirrors /admin/accounts). OAuth platforms land "active"/"oauth".
 */
export async function connectVettedPage(formData: FormData): Promise<void> {
  const user = await requireActiveClipper();
  const pageId = String(formData.get("pageId") ?? "");

  const vetted = await listVettedPagesForProfile(user.id);
  const page = vetted.find((p) => p.id === pageId);
  if (!page) return;

  const existing = await listConnectedAccounts(user.id);
  if (existing.some((a) => a.applicationPageId === pageId && a.status !== "revoked")) return;

  await upsertConnectedAccount({
    id: newId("acc"),
    profileId: user.id,
    platform: page.platform,
    applicationPageId: page.id,
    externalId: `manual_${page.id}`,
    handle: page.handle,
    followerCount: page.selfReportedFollowers,
    proof: "manual",
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/onboarding");
  revalidatePath("/connections");
}

export type LinkState = { error?: string };

/**
 * Add a page by pasting its link — the no-API stand-in for OAuth "connect".
 * Records the page and opens a "pending" connected account for manual admin
 * ownership review, exactly like a vetted page.
 */
export async function addPageLink(
  _prev: LinkState,
  formData: FormData,
): Promise<LinkState> {
  const user = await requireActiveClipper();
  const raw = String(formData.get("link") ?? "").trim();
  const link = raw.startsWith("http") ? raw : raw ? `https://${raw}` : "";
  const platform = platformFromUrl(link);
  if (!platform) {
    return { error: "Paste a TikTok, Instagram, YouTube or Facebook link." };
  }
  const handle = handleFromUrl(link);

  const existing = await listConnectedAccounts(user.id);
  if (
    existing.some(
      (a) => a.platform === platform && a.handle === handle && a.status !== "revoked",
    )
  ) {
    return { error: "That page is already linked." };
  }

  const now = new Date().toISOString();
  const appId = newId("app");
  const pageId = newId("apg");
  await createApplication(
    {
      id: appId,
      profileId: user.id,
      role: "clipper",
      note: "Page added during onboarding.",
      status: "approved",
      reviewedAt: now,
      createdAt: now,
    },
    [
      {
        id: pageId,
        applicationId: appId,
        platform,
        handle,
        url: link,
        selfReportedFollowers: 0,
        niche: "Other",
        vetStatus: "approved",
      },
    ],
  );
  await upsertConnectedAccount({
    id: newId("acc"),
    profileId: user.id,
    platform,
    applicationPageId: pageId,
    externalId: `manual_${pageId}`,
    handle,
    proof: "manual",
    status: "pending",
    createdAt: now,
  });
  revalidatePath("/onboarding");
  revalidatePath("/connections");
  return {};
}

/** Step 2 → 3. Connecting is skippable; submissions still need a linked page. */
export async function continueToPayout(): Promise<void> {
  const user = await requireActiveClipper();
  await updateProfile(user.id, { onboardingStep: Math.max(user.onboardingStep, 3) });
  revalidatePath("/onboarding");
}

/** Back one step (shared by clipper + brand). Forward save actions re-advance
 *  via Math.max, so re-walking is safe. */
export async function backTo(formData: FormData): Promise<void> {
  const user = await requireUser();
  const step = Number(formData.get("step") ?? 0);
  await updateProfile(user.id, { onboardingStep: Math.max(0, Math.min(step, 3)) });
  revalidatePath("/onboarding");
}

export type BkashState = { error?: string };

/** Step 3 → done. Saves the payout number and finishes onboarding. */
export async function saveBkash(
  _prev: BkashState,
  formData: FormData,
): Promise<BkashState> {
  const user = await requireActiveClipper();
  const parsed = bkashSchema.safeParse(formData.get("bkashNumber"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid bKash number." };
  }
  await updateProfile(user.id, {
    bkashNumber: parsed.data,
    profileCompleted: true,
    onboardingStep: 99,
  });
  redirect("/home");
}

/* ── Brand onboarding: 0 business · 1 details · 2 finish ── */

const WEBSITE_RE = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i;

export type BrandProfileState = { error?: string; field?: "orgName" | "website" };

/** Brand step 0 → 1. Business name + validated website. */
export async function saveBusinessProfile(
  _prev: BrandProfileState,
  formData: FormData,
): Promise<BrandProfileState> {
  const user = await requireRole("brand");
  const orgName = String(formData.get("orgName") ?? "").trim();
  const raw = String(formData.get("website") ?? "").trim();

  if (!orgName) return { error: "Enter your business name.", field: "orgName" };
  if (!WEBSITE_RE.test(raw)) {
    return { error: "Please enter a valid company website.", field: "website" };
  }
  const website = raw.startsWith("http") ? raw : `https://${raw}`;

  // Optional logo → Supabase Storage. Failures/stub-mode keep the existing logo.
  const logo = formData.get("logo");
  const logoUrl =
    logo instanceof File && logo.size > 0 ? await uploadBrandLogo(logo, user.id) : null;

  await updateProfile(user.id, {
    orgName,
    website,
    ...(logoUrl ? { logoUrl } : {}),
    onboardingStep: Math.max(user.onboardingStep, 1),
  });
  revalidatePath("/onboarding");
  return {};
}

export type BrandDetailsState = { error?: string };

/** Brand step 1 → 2. Industry, country, estimated monthly spend. */
export async function saveCompanyDetails(
  _prev: BrandDetailsState,
  formData: FormData,
): Promise<BrandDetailsState> {
  const user = await requireRole("brand");
  const industry = String(formData.get("industry") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const monthlySpend = String(formData.get("monthlySpend") ?? "").trim();

  if (!industry) return { error: "Select your industry." };
  if (!location) return { error: "Select your location." };
  if (!monthlySpend) return { error: "Select your estimated monthly spend." };

  await updateProfile(user.id, {
    industry,
    location,
    monthlySpend,
    onboardingStep: Math.max(user.onboardingStep, 2),
  });
  revalidatePath("/onboarding");
  return {};
}

export type BrandFinishState = { error?: string };

/** Brand step 2 → done. Contact name + campaign history; finishes onboarding. */
export async function finishBrandSetup(
  _prev: BrandFinishState,
  formData: FormData,
): Promise<BrandFinishState> {
  const user = await requireRole("brand");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const campaignExperience = String(formData.get("campaignExperience") ?? "").trim();

  if (!firstName) return { error: "Enter your name." };

  await updateProfile(user.id, {
    firstName,
    lastName: lastName || undefined,
    displayName: lastName ? `${firstName} ${lastName}` : firstName,
    campaignExperience: campaignExperience || undefined,
    profileCompleted: true,
    onboardingStep: 99,
  });
  redirect("/brand");
}
