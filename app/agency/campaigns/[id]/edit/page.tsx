import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { getCampaign } from "@/lib/db";
import { CampaignForm } from "../../new/campaign-form";

export const metadata: Metadata = { title: "Edit campaign" };

export default async function EditAgencyCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("agency");
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign || campaign.agencyProfileId !== user.id) notFound();
  // Only pre-live campaigns can be edited; once public it's locked.
  if (campaign.status !== "pending_funding" && campaign.status !== "draft") {
    redirect(`/agency/campaigns/${id}`);
  }

  return <CampaignForm agencyName={campaign.agencyName} campaign={campaign} />;
}
