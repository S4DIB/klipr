import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { listCampaignsByBrand, listLedger } from "@/lib/db";
import { escrowAccount } from "@/lib/ledger";
import { GlassPanel } from "@/components/app/glass-panel";
import { DataRow } from "@/components/app/data-row";
import { EmptyState } from "@/components/app/empty-state";
import { IconBkash, IconCheck, IconWallet } from "@/components/icons";
import { takaFromPoisha, dhakaDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Billing" };

const LABELS: Record<string, string> = {
  escrow_funding: "Escrow funded",
  settlement: "Verified views charged",
  escrow_refund: "Unspent budget refunded",
};

/** The escrow ledger, campaign by campaign. Every taka accounted for. */
export default async function BrandBillingPage() {
  const user = await requireRole("brand");
  const campaigns = await listCampaignsByBrand(user.id);

  const sections = await Promise.all(
    campaigns.map(async (c) => ({
      campaign: c,
      entries: await listLedger({ account: escrowAccount(c.id) }),
    })),
  );

  return (
    <div className="space-y-6">
      {sections.length === 0 ? (
        <GlassPanel>
          <EmptyState title="No campaigns yet" line="Billing history appears once a campaign is funded." />
        </GlassPanel>
      ) : (
        sections.map(({ campaign, entries }) => (
          <GlassPanel key={campaign.id} className="p-3">
            <div className="flex items-baseline justify-between px-2 pb-2 pt-1.5">
              <p className="eyebrow">{campaign.name}</p>
              <p className="data-sm text-text-mid">
                balance {takaFromPoisha(entries.reduce((a, e) => a + e.amountPoisha, 0))}
              </p>
            </div>
            {entries.length === 0 ? (
              <p className="px-4 pb-4 text-[13px] text-text-mid">Awaiting funding.</p>
            ) : (
              <div className="divide-y divide-[rgba(53,5,90,0.06)]">
                {entries.map((e) => (
                  <DataRow
                    key={e.id}
                    leading={
                      e.eventType === "escrow_funding" ? (
                        <IconBkash size={16} />
                      ) : e.eventType === "settlement" ? (
                        <IconCheck size={16} />
                      ) : (
                        <IconWallet size={16} />
                      )
                    }
                    primary={LABELS[e.eventType] ?? e.eventType}
                    secondary={dhakaDateTime(e.createdAt)}
                    trailing={
                      <span className="data-sm text-text-hi">
                        {e.amountPoisha > 0 ? "+" : ""}
                        {takaFromPoisha(e.amountPoisha)}
                      </span>
                    }
                  />
                ))}
              </div>
            )}
          </GlassPanel>
        ))
      )}
    </div>
  );
}
