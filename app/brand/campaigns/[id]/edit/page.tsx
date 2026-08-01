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
    <div className="mx-auto max-w-[760px] space-y-5">
      <header>
        <p className="eyebrow text-violet-600">Edit campaign</p>
        <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.02em] text-ink-900">
          {campaign.name}
        </h1>
      </header>
      <CampaignForm brandName={campaign.brandName} campaign={campaign} />
    </div>
  );
}
