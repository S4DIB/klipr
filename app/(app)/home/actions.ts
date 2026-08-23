"use server";

import { revalidatePath } from "next/cache";
import { requireActiveClipper } from "@/lib/auth/guards";
import { updateProfile } from "@/lib/db";
import { uploadProfileCover } from "@/lib/storage/profile-cover";

/** Swap the /home header cover for an uploaded photo. A failed or stub upload
 *  returns null and keeps the previous cover instead of nulling it out. */
export async function updateCover(formData: FormData): Promise<void> {
  const user = await requireActiveClipper();

  const cover = formData.get("cover");
  const coverUrl =
    cover instanceof File && cover.size > 0 ? await uploadProfileCover(cover, user.id) : null;
  if (coverUrl) await updateProfile(user.id, { coverUrl });

  revalidatePath("/home");
}

/** Drop the custom cover; the header falls back to the default gradient. */
export async function removeCover(): Promise<void> {
  const user = await requireActiveClipper();
  await updateProfile(user.id, { coverUrl: undefined });
  revalidatePath("/home");
}
