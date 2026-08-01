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
    <div className="mx-auto max-w-[760px] space-y-5">
      <header>
        <p className="eyebrow text-volt-600">Edit campaign</p>
        <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.02em] text-text-hi">
          {campaign.name}
        </h1>
      </header>
      <CampaignForm brandName={brandName} campaign={campaign} />
    </div>
  );
}
