"use client";

import { useState } from "react";
import { adminDeleteCampaign, requestCampaignDeletion } from "@/app/brand/campaigns/new/actions";
import { cn } from "@/lib/cn";

const dangerOutline =
  "rounded-full border border-[rgba(255,123,192,0.6)] px-4 py-2 text-[13px] font-semibold text-danger-600 transition-colors hover:bg-danger-bg disabled:opacity-60";

/**
 * Admin-only hard delete, after a confirm. The server action enforces admin
 * rights and cascades the campaign's clips/records. Reused for "Approve
 * deletion" on a brand's pending request — same effect.
 */
export function DeleteCampaignButton({
  campaignId,
  label = "Delete campaign",
  className,
}: {
  campaignId: string;
  label?: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);

  return (
    <form
      action={adminDeleteCampaign}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Delete this campaign for good? This also removes its clips and records, and can’t be undone.",
          )
        ) {
          e.preventDefault();
          return;
        }
        setPending(true);
      }}
    >
      <input type="hidden" name="campaignId" value={campaignId} />
      <button type="submit" disabled={pending} className={cn(dangerOutline, className)}>
        {pending ? "Deleting…" : label}
      </button>
    </form>
  );
}

/**
 * Brand-side "delete": raises a deletion request for an admin to approve. The
 * campaign isn't removed here — it's flagged and surfaced in the admin portal.
 */
export function RequestDeletionButton({
  campaignId,
  label = "Request deletion",
  className,
}: {
  campaignId: string;
  label?: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);

  return (
    <form
      action={requestCampaignDeletion}
      onSubmit={(e) => {
        if (
          !window.confirm("Request deletion? An admin reviews it before the campaign is removed.")
        ) {
          e.preventDefault();
          return;
        }
        setPending(true);
      }}
    >
      <input type="hidden" name="campaignId" value={campaignId} />
      <button type="submit" disabled={pending} className={cn(dangerOutline, className)}>
        {pending ? "Requesting…" : label}
      </button>
    </form>
  );
}
