"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guards";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/db";

function refresh() {
  // The bell lives in every shell; refresh each role's landing surface.
  revalidatePath("/brand");
  revalidatePath("/home");
  revalidatePath("/admin");
}

/** Dismiss a single notification the current user owns (marks it read). */
export async function dismissNotification(formData: FormData): Promise<void> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return;
  }
  const id = String(formData.get("notificationId") ?? "");
  if (!id) return;
  await markNotificationRead(id, user.id);
  refresh();
}

/** Mark every notification for the current user as read. */
export async function dismissAllNotifications(): Promise<void> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return;
  }
  await markAllNotificationsRead(user.id);
  refresh();
}
