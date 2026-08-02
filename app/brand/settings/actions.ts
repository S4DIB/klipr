"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { updateProfile } from "@/lib/db";
import { uploadBrandLogo } from "@/lib/storage/brand-logo";
import { normalizeUrl } from "@/lib/url";

export type SettingsState = { error?: string; ok?: boolean };

/**
 * Company details — brands can edit their own. Existing campaigns keep the
 * name they were created with (it's snapshotted), so this only affects new
 * ones. Logo uploads to Supabase Storage; stub/dev keeps the current logo.
 */
export async function updateBrandCompany(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireRole("brand");

  const orgName = String(formData.get("orgName") ?? "").trim();
  if (!orgName) return { error: "Company name is required." };
  if (orgName.length > 80) return { error: "Company name is too long." };

  const websiteRaw = String(formData.get("website") ?? "").trim();
  const website = websiteRaw ? normalizeUrl(websiteRaw) : "";
  if (website) {
    try {
      new URL(website);
    } catch {
      return { error: "Enter a valid company website." };
    }
  }

  const industry = String(formData.get("industry") ?? "").trim().slice(0, 60) || undefined;
  const location = String(formData.get("location") ?? "").trim().slice(0, 80) || undefined;
  const monthlySpend = String(formData.get("monthlySpend") ?? "").trim().slice(0, 60) || undefined;

  const logo = formData.get("logo");
  const logoUrl =
    logo instanceof File && logo.size > 0 ? await uploadBrandLogo(logo, user.id) : null;

  await updateProfile(user.id, {
    orgName,
    website: website || undefined,
    industry,
    location,
    monthlySpend,
    ...(logoUrl ? { logoUrl } : {}),
  });

  revalidatePath("/brand/settings");
  revalidatePath("/brand");
  return { ok: true };
}

/** Contact person — the human the Klipr team reaches. Email is the login, fixed. */
export async function updateBrandContact(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireRole("brand");

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (firstName.length < 1) return { error: "First name is required." };
  if ((firstName + lastName).length > 60) return { error: "Name is too long." };

  await updateProfile(user.id, {
    firstName,
    lastName: lastName || undefined,
    displayName: [firstName, lastName].filter(Boolean).join(" "),
  });

  revalidatePath("/brand/settings");
  revalidatePath("/brand");
  return { ok: true };
}
