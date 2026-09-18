import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { AgencySettingsTabs } from "./settings-form";

export const metadata: Metadata = { title: "Agency settings" };

export default async function AgencySettingsPage() {
  const user = await requireRole("agency");
  return (
    <AgencySettingsTabs
      agency={{
        orgName: user.orgName ?? "",
        website: user.website,
        industry: user.industry,
        location: user.location,
        monthlySpend: user.monthlySpend,
        logoUrl: user.logoUrl,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }}
    />
  );
}
