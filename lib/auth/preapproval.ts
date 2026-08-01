import { createApplication, newId, updateProfile } from "@/lib/db";
import { getLeadByEmail } from "@/lib/leads";
import { platformFromUrl, handleFromUrl } from "@/lib/platforms";
import type { Application, ApplicationPage, Profile } from "@/lib/db/types";

/**
 * SaaS admin allowlist. Only these emails may hold the admin role, and they are
 * provisioned automatically on sign-in — no manual SQL, and they pass the
 * invite-only gate. Add more admins via the ADMIN_EMAILS env var
 * (comma-separated); KLIPR_DEV_ADMIN_EMAIL is the stub-mode dev admin.
 */
const DEFAULT_ADMIN_EMAILS = ["shahsadib25@gmail.com", "mehrabkhan059@gmail.com"];

function adminEmailSet(): Set<string> {
  const raw = [
    ...DEFAULT_ADMIN_EMAILS,
    ...(process.env.ADMIN_EMAILS ?? "").split(","),
    process.env.KLIPR_DEV_ADMIN_EMAIL ?? "",
  ];
  return new Set(raw.map((e) => e.trim().toLowerCase()).filter(Boolean));
}

export function isAdminEmail(email: string): boolean {
  return adminEmailSet().has(email.trim().toLowerCase());
}

/**
 * Auto-provision the SaaS admin. A listed email always signs in as an active
 * admin (created as a plain clipper by the auth trigger, upgraded here).
 * Everyone else is returned untouched.
 */
export async function promoteIfAdmin(profile: Profile): Promise<Profile> {
  if (!isAdminEmail(profile.email)) return profile;
  if (profile.role === "admin" && profile.access === "active" && profile.profileCompleted) {
    return profile;
  }
  return (
    (await updateProfile(profile.id, {
      role: "admin",
      access: "active",
      profileCompleted: true,
    })) ?? { ...profile, role: "admin", access: "active", profileCompleted: true }
  );
}

/**
 * Waitlist pre-approval → account access. Admins vet landing-waitlist leads
 * in /admin/applications before the person has an account. When an approved
 * lead's email signs in with access "none", the lead converts into an
 * APPROVED Application with vetted pages (so onboarding can offer them for
 * connection) and the profile goes straight to ACTIVE — no second apply.
 * Declined or pending leads change nothing: the normal /apply flow runs.
 */
export async function promoteIfPreapproved(profile: Profile): Promise<Profile> {
  if (profile.access !== "none") return profile;

  const lead = await getLeadByEmail(profile.email);
  if (!lead || lead.status !== "approved") return profile;

  // Approved BRAND → active brand; the 3-step brand onboarding runs next. A
  // fresh Google sign-in is a "clipper" by default, so this also flips the role.
  if (lead.role === "brand") {
    return (
      (await updateProfile(profile.id, {
        role: "brand",
        access: "active",
        orgName: lead.company ?? profile.orgName,
        profileCompleted: false,
        onboardingStep: 0,
      })) ?? { ...profile, role: "brand", access: "active", profileCompleted: false }
    );
  }

  // Approved CLIPPER → active clipper with vetted pages (below).
  if (profile.role !== "clipper") return profile;

  const application: Application = {
    id: newId("app"),
    profileId: profile.id,
    role: "clipper",
    note: [
      "Pre-approved from the landing waitlist.",
      lead.postFrequency ? `Posts ${lead.postFrequency}.` : null,
      lead.phone ? `Phone: ${lead.phone}.` : null,
    ]
      .filter(Boolean)
      .join(" "),
    status: "approved",
    // reviewed_by is a uuid FK to profiles — there is no human reviewer for a
    // waitlist auto-promotion, so leave it null. The "pre-approved from the
    // waitlist" provenance is recorded in `note` above (and reviewedAt below).
    reviewedAt: lead.reviewedAt ?? new Date().toISOString(),
    createdAt: lead.at,
  };
  // pages with a missing or unrecognizable link are skipped — only real,
  // reviewable platform pages become connectable (old lead rows may carry a
  // legacy shape without a link)
  const pages: ApplicationPage[] = (lead.pages ?? []).flatMap((p) => {
    if (typeof p.link !== "string") return [];
    const platform = platformFromUrl(p.link);
    if (!platform) return [];
    return [
      {
        id: newId("apg"),
        applicationId: application.id,
        platform,
        handle: handleFromUrl(p.link),
        url: p.link,
        selfReportedFollowers: 0,
        niche: typeof p.niche === "string" ? p.niche : "Other",
        vetStatus: "approved" as const,
      },
    ];
  });

  await createApplication(application, pages);
  return (await updateProfile(profile.id, { access: "active" })) ?? {
    ...profile,
    access: "active",
  };
}
