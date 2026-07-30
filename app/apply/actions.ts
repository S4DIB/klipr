"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { brandSignupSchema } from "@/lib/validation/apply";
import { updateProfile } from "@/lib/db";

export type ApplyState = { error?: string };

const INVITE_ONLY =
  "Klipr is invite-only right now. Join the waitlist and we'll email you once you're approved.";

/**
 * Clipper/agency self-application is DISABLED — access is invite-only: join the
 * landing waitlist, then an admin approves you (promoteIfPreapproved unlocks the
 * app on sign-in). Kept as a guarded no-op so any stale form just shows the note.
 */
export async function submitApplication(): Promise<ApplyState> {
  return { error: INVITE_ONLY };
}

/** Reapply is disabled under the invite-only model. */
export async function startReapplication(): Promise<void> {
  redirect("/login?error=not_approved");
}

/**
 * Brand signup. Brands are provisioned by the admin (a fresh Google sign-in
 * can't self-serve past the invite gate); this just completes their profile and
 * drops them into the brand console. Qualified by funding, not by audience.
 */
export async function submitBrandSignup(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }
  if (user.role === "admin") return { error: "Admins don't need a brand signup." };

  const parsed = brandSignupSchema.safeParse({
    orgName: formData.get("orgName"),
    contactNumber: formData.get("contactNumber"),
    designation: formData.get("designation"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  await updateProfile(user.id, {
    role: "brand",
    access: "active",
    orgName: parsed.data.orgName,
    profileCompleted: true,
    onboardingStep: 99,
  });

  redirect("/brand");
}
