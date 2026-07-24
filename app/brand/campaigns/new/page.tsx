import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { CampaignForm } from "./campaign-form";

export const metadata: Metadata = { title: "New campaign" };

export default async function NewCampaignPage() {
  const user = await requireRole("brand");

  return (
    <div className="mx-auto max-w-[760px] space-y-5">
      <header>
        <p className="eyebrow text-violet-600">New campaign</p>
        <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.02em] text-ink-900">
          Set up your campaign
        </h1>
      </header>
      <CampaignForm brandName={user.orgName || user.displayName} />
    </div>
  );
}
