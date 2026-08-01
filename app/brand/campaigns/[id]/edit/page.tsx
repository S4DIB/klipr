import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { getCampaign } from "@/lib/db";
import { CampaignForm } from "../../new/campaign-form";

export const metadata: Metadata = { title: "Edit campaign" };

export default async function EditBrandCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("brand");
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign || campaign.brandProfileId !== user.id) notFound();
  // Only pre-live campaigns can be edited; once public it's locked.
  if (campaign.status !== "pending_funding" && campaign.status !== "draft") {
    redirect(`/brand/campaigns/${id}`);
  }

  return (
    <div className="py-2">
      <CampaignForm brandName={campaign.brandName} campaign={campaign} />
    </div>
  );
}
