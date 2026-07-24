"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guards";
import { applicationSchema, brandSignupSchema } from "@/lib/validation/apply";
import {
  createApplication,
  latestApplicationForProfile,
  newId,
  updateProfile,
} from "@/lib/db";
import type { Application, ApplicationPage } from "@/lib/db/types";

export type ApplyState = { error?: string };

/**
 * Clipper/agency application. Creates the Application + declared pages and
 * moves the profile to WAITLISTED. No follower minimum is enforced here:
 * the form collects information for the human reviewer, not a threshold.
 */
export async function submitApplication(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }
  if (user.role === "admin" || user.role === "brand") {
    return { error: "This account type doesn't apply as a clipper." };
  }
  if (user.access === "active") redirect("/home");
  if (user.access === "waitlisted") redirect("/apply/status");

  let pages: unknown;
  try {
    pages = JSON.parse(String(formData.get("pages") ?? "[]"));
  } catch {
    return { error: "Your page list didn't submit correctly. Try again." };
  }

  const parsed = applicationSchema.safeParse({
    role: formData.get("role"),
    orgName: formData.get("orgName") || undefined,
    note: formData.get("note"),
    pages,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  if (parsed.data.role === "agency" && !parsed.data.orgName) {
    return { error: "Add your agency / network name." };
  }

  const application: Application = {
    id: newId("app"),
    profileId: user.id,
    role: parsed.data.role,
    note: parsed.data.note,
    status: "submitted",
    createdAt: new Date().toISOString(),
  };
  const pageRows: ApplicationPage[] = parsed.data.pages.map((p) => ({
    id: newId("apg"),
    applicationId: application.id,
    platform: p.platform,
    handle: p.handle,
    url: p.url,
    selfReportedFollowers: p.selfReportedFollowers,
    niche: p.niche,
    vetStatus: "pending",
  }));

  await createApplication(application, pageRows);
  await updateProfile(user.id, {
    role: parsed.data.role,
    access: "waitlisted",
    orgName: parsed.data.role === "agency" ? parsed.data.orgName : user.orgName,
  });

  revalidatePath("/apply/status");
  revalidatePath("/admin/applications");
  redirect("/apply/status");
}

/**
 * Brand signup. No vetting queue (brands are qualified by funding, not by
 * audience). Straight into the brand console.
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

/** Reapply after a decline. Only allowed from the DECLINED state. */
export async function startReapplication(): Promise<void> {
  const user = await requireUser();
  if (user.access !== "declined") redirect("/apply/status");
  const latest = await latestApplicationForProfile(user.id);
  if (latest && latest.status === "submitted") redirect("/apply/status");
  await updateProfile(user.id, { access: "none" });
  redirect("/apply");
}
