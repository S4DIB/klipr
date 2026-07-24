import { createApplication, newId, updateProfile } from "@/lib/db";
import { getLeadByEmail } from "@/lib/leads";
import { platformFromUrl, handleFromUrl } from "@/lib/platforms";
import type { Application, ApplicationPage, Profile } from "@/lib/db/types";

/**
 * Waitlist pre-approval → account access. Admins vet landing-waitlist leads
 * in /admin/applications before the person has an account. When an approved
 * lead's email signs in with access "none", the lead converts into an
 * APPROVED Application with vetted pages (so onboarding can offer them for
 * connection) and the profile goes straight to ACTIVE — no second apply.
 * Declined or pending leads change nothing: the normal /apply flow runs.
 */
export async function promoteIfPreapproved(profile: Profile): Promise<Profile> {
  if (profile.role !== "clipper" || profile.access !== "none") return profile;

  const lead = await getLeadByEmail(profile.email);
  if (!lead || lead.role !== "clipper" || lead.status !== "approved") return profile;

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
    reviewedBy: "waitlist-review",
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
