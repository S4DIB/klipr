"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import {
  getApplication,
  getProfileByEmail,
  listApplicationPages,
  updateApplication,
  updateApplicationPage,
  updateProfile,
} from "@/lib/db";
import { updateLeadReview } from "@/lib/leads";
import { promoteIfPreapproved } from "@/lib/auth/preapproval";

/**
 * Per-page vetting decision against the Clipper Standard:
 * active in the last 3 weeks · posting 3-5×/week · real engagement.
 */
export async function vetPage(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const pageId = String(formData.get("pageId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!pageId || (decision !== "approved" && decision !== "declined")) return;

  await updateApplicationPage(pageId, {
    vetStatus: decision,
    vetChecklist: {
      activeRecently: formData.get("activeRecently") === "on",
      postingCadence: formData.get("postingCadence") === "on",
      realEngagement: formData.get("realEngagement") === "on",
    },
    vetNote: String(formData.get("vetNote") ?? "").trim() || undefined,
  });

  void admin; // authz side-effect only
  revalidatePath("/admin/applications");
}

/**
 * Overall decision. Approve requires ≥1 approved page. Decline requires a
 * reason. It is shown verbatim to the applicant.
 */
export type DecideState = { error?: string };

export async function decideApplication(
  _prev: DecideState,
  formData: FormData,
): Promise<DecideState> {
  const admin = await requireAdmin();
  const applicationId = String(formData.get("applicationId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  const application = await getApplication(applicationId);
  if (!application) return { error: "Application not found." };
  if (application.status !== "submitted") return { error: "Already decided." };

  const pages = await listApplicationPages(applicationId);

  if (decision === "approved") {
    const approved = pages.filter((p) => p.vetStatus === "approved");
    if (approved.length === 0) {
      return { error: "Approve at least one page first. Access without a vetted page is meaningless." };
    }
    // Any still-pending pages are declined implicitly? No. Leave them pending
    // is dishonest. Mark them declined with a standard note.
    for (const p of pages) {
      if (p.vetStatus === "pending") {
        await updateApplicationPage(p.id, {
          vetStatus: "declined",
          vetNote: "Not reviewed as approvable in this round.",
        });
      }
    }
    await updateApplication(applicationId, {
      status: "approved",
      reviewedBy: admin.id,
      reviewedAt: new Date().toISOString(),
    });
    await updateProfile(application.profileId, { access: "active" });
  } else if (decision === "declined") {
    if (reason.length < 5) {
      return { error: "Give the applicant a real reason. It's shown to them verbatim." };
    }
    for (const p of pages) {
      if (p.vetStatus === "pending") {
        await updateApplicationPage(p.id, { vetStatus: "declined" });
      }
    }
    await updateApplication(applicationId, {
      status: "declined",
      declineReason: reason,
      reviewedBy: admin.id,
      reviewedAt: new Date().toISOString(),
    });
    await updateProfile(application.profileId, { access: "declined" });
  } else {
    return { error: "Unknown decision." };
  }

  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath("/apply/status");
  return {};
}

/**
 * Vetting decision on a landing-waitlist lead — someone who joined before
 * having an account. Approve → their email is pre-cleared and their first
 * sign-in lands ACTIVE with vetted pages (lib/auth/preapproval.ts). If they
 * already created an account meanwhile, promote it immediately. Decline →
 * recorded with the reason; signing up routes them through /apply as normal.
 */
export async function reviewWaitlistLead(formData: FormData): Promise<void> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!email || (decision !== "approved" && decision !== "declined")) return;
  if (decision === "declined" && reason.length < 5) return;

  const ok = await updateLeadReview(email, {
    status: decision,
    declineReason: decision === "declined" ? reason : undefined,
  });
  if (!ok) return;

  if (decision === "approved") {
    const existing = await getProfileByEmail(email);
    if (existing) await promoteIfPreapproved(existing);
  }

  revalidatePath("/admin/applications");
  revalidatePath("/admin/leads");
}
