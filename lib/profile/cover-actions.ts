"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guards";
import { updateProfile } from "@/lib/db";
import { uploadProfileCover } from "@/lib/storage/profile-cover";

/** Swap a profile header cover for an uploaded photo. Shared by the clipper
 *  profile and the brand profile — both are rows in `profiles`. A failed or stub upload
 *  returns null and keeps the previous cover instead of nulling it out. */
export async function updateCover(formData: FormData): Promise<void> {
  const user = await requireUser();

  const cover = formData.get("cover");
  const coverUrl =
    cover instanceof File && cover.size > 0 ? await uploadProfileCover(cover, user.id) : null;
  if (coverUrl) await updateProfile(user.id, { coverUrl });

  revalidateProfilePaths();
}

/** Drop the custom cover; the header falls back to the default gradient. */
export async function removeCover(): Promise<void> {
  const user = await requireUser();
  await updateProfile(user.id, { coverUrl: undefined });
  revalidateProfilePaths();
}

/** Both profile surfaces read the same profiles row. */
function revalidateProfilePaths() {
  revalidatePath("/profile");
  revalidatePath("/brand/profile");
}
