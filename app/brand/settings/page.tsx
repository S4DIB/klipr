import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { BrandSettingsTabs } from "./settings-form";

export const metadata: Metadata = { title: "Brand settings" };

export default async function BrandSettingsPage() {
  const user = await requireRole("brand");
  return (
    <BrandSettingsTabs
      brand={{
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
