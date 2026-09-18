import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { CampaignForm } from "./campaign-form";

export const metadata: Metadata = { title: "New campaign" };

export default async function NewCampaignPage() {
  const user = await requireRole("agency");

  return <CampaignForm agencyName={user.orgName || user.displayName} />;
}
