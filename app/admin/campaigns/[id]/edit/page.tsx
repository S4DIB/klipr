import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { getCampaign, getProfile } from "@/lib/db";
import { CampaignForm } from "@/app/brand/campaigns/new/campaign-form";

export const metadata: Metadata = { title: "Edit campaign · Admin" };

export default async function EditAdminCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();
  // Only pre-live campaigns can be edited; once public it's locked.
  if (campaign.status !== "pending_funding" && campaign.status !== "draft") {
    redirect(`/admin/campaigns/${id}`);
  }

  const brand = await getProfile(campaign.brandProfileId);
  const brandName = brand?.orgName ?? brand?.displayName ?? campaign.brandName;

  return (
    <div className="py-2">
      <CampaignForm brandName={brandName} campaign={campaign} />
    </div>
  );
}
