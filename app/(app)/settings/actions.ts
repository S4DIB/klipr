"use server";

import { revalidatePath } from "next/cache";
import { requireActiveClipper } from "@/lib/auth/guards";
import { bkashSchema } from "@/lib/validation/apply";
import { updateProfile } from "@/lib/db";

export type SettingsState = { error?: string; ok?: boolean };

/** Personal info — name, username, location, languages. displayName is
 *  composed from first + last so the rest of the app stays consistent. */
export async function updateProfileInfo(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireActiveClipper();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (firstName.length < 1) return { error: "First name is required." };
  if ((firstName + lastName).length > 60) return { error: "Name is too long." };

  const usernameRaw = String(formData.get("username") ?? "")
    .trim()
    .replace(/^@+/, "");
  if (usernameRaw && !/^[a-zA-Z0-9_.]{2,30}$/.test(usernameRaw)) {
    return { error: "Username can use letters, numbers, dot and underscore (2-30 chars)." };
  }

  const location = String(formData.get("location") ?? "").trim().slice(0, 80) || undefined;
  const postLanguages = String(formData.get("postLanguages") ?? "").trim().slice(0, 80) || undefined;

  await updateProfile(user.id, {
    firstName,
    lastName: lastName || undefined,
    displayName: [firstName, lastName].filter(Boolean).join(" "),
    username: usernameRaw || undefined,
    location,
    postLanguages,
  });
  revalidatePath("/settings");
  revalidatePath("/leaderboard");
  return { ok: true };
}

/** Payout methods — the bKash number payouts land on. */
export async function updatePayoutMethod(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireActiveClipper();
  const bkashRaw = String(formData.get("bkashNumber") ?? "").trim();
  if (!bkashRaw) return { error: "Enter your bKash number." };
  const parsed = bkashSchema.safeParse(bkashRaw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid bKash number." };
  }
  await updateProfile(user.id, { bkashNumber: parsed.data });
  revalidatePath("/settings");
  return { ok: true };
}

/** Notifications & privacy — leaderboard visibility. */
export async function updateNotifications(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireActiveClipper();
  await updateProfile(user.id, {
    leaderboardOptOut: formData.get("leaderboardOptOut") === "on",
  });
  revalidatePath("/settings");
  revalidatePath("/leaderboard");
  return { ok: true };
}
