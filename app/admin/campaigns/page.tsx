import Link from "next/link";
import type { Metadata } from "next";
import { getProfile, listCampaigns } from "@/lib/db";
import type { Campaign } from "@/lib/db/types";
import { GlassPanel } from "@/components/app/glass-panel";
import { StatusChip } from "@/components/app/status-chip";
import { EmptyState } from "@/components/app/empty-state";
import { DeleteCampaignButton } from "@/components/app/delete-campaign-button";
import { BudgetBar } from "@/components/ui/budget-bar";
import { FilterTabs, normalizeFilter, type FilterKey } from "@/components/app/filter-tabs";
import { takaFromPoisha, dhakaDate, dhakaDateTime } from "@/lib/format";
import { approveCampaign, rejectCampaign } from "./actions";
import { clearDeletionRequest } from "@/app/brand/campaigns/new/actions";

export const metadata: Metadata = { title: "Campaigns · Admin" };

/**
 * Campaign approvals — the same Pending / Approved / Rejected model as the
 * waitlist. Brands post a campaign (→ pending); Approve makes it public to
 * clippers. Money is a SEPARATE step on each campaign's detail page.
 */
export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = normalizeFilter(status);

  const all = await listCampaigns();
  const pending = all.filter((c) => c.status === "pending_funding" || c.status === "draft");
  const approved = all.filter(
    (c) => c.status === "active" || c.status === "settling" || c.status === "completed",
  );
  const rejected = all.filter((c) => c.status === "cancelled");
  const counts = { pending: pending.length, approved: approved.length, rejected: rejected.length };
  const list = filter === "approved" ? approved : filter === "rejected" ? rejected : pending;
  const deletionRequests = all.filter((c) => c.deletionRequestedAt);

  const brandNames = new Map<string, string>();
  for (const c of [...deletionRequests, ...list]) {
    if (!brandNames.has(c.brandProfileId)) {
      const p = await getProfile(c.brandProfileId);
      brandNames.set(c.brandProfileId, p?.orgName ?? p?.displayName ?? c.brandProfileId);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">02 / Campaigns</p>
        <h1 className="display-1 mt-1 text-[32px] text-text-hi">Campaign approvals.</h1>
        <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-text-mid">
          Brands post campaigns here. Approve to make one public to clippers — funding is a
          separate step you confirm on each campaign.
        </p>
      </header>

      {deletionRequests.length > 0 ? (
        <GlassPanel className="border border-[rgba(255,123,192,0.35)] p-5">
          <p className="eyebrow text-danger-600">Deletion requests · {deletionRequests.length}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-text-mid">
            Brands asked to delete these. Approve to remove a campaign and its records, or dismiss to
            keep it.
          </p>
          <div className="mt-4 space-y-2.5">
            {deletionRequests.map((c) => (
              <div
                key={c.id}
                className="glass-well flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/campaigns/${c.id}`}
                    className="text-[14px] font-semibold text-text-hi transition-colors hover:text-volt-600"
                  >
                    {c.name}
                  </Link>
                  <p className="mt-0.5 text-[12px] text-text-mid">
                    {brandNames.get(c.brandProfileId) ?? ""}
                    {c.deletionRequestedAt ? ` · ${dhakaDateTime(c.deletionRequestedAt)}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <DeleteCampaignButton campaignId={c.id} label="Approve deletion" />
                  <form action={clearDeletionRequest}>
                    <input type="hidden" name="campaignId" value={c.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-text-hi transition-colors hover:border-volt-400 hover:text-volt-600"
                    >
                      Dismiss
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      ) : null}

      <FilterTabs basePath="/admin/campaigns" current={filter} counts={counts} />

      {list.length === 0 ? (
        <GlassPanel>
          <EmptyState
            title={`No ${filter} campaigns`}
            line={
              filter === "pending"
                ? "Campaigns brands post appear here for approval."
                : `Campaigns you’ve ${filter === "approved" ? "approved" : "rejected"} show up here.`
            }
          />
        </GlassPanel>
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <CampaignRow
              key={c.id}
              campaign={c}
              brandName={brandNames.get(c.brandProfileId) ?? ""}
              filter={filter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FundedBadge({ fundedAt }: { fundedAt?: string }) {
  return fundedAt ? (
    <span className="shrink-0 rounded-full bg-[rgba(10,143,79,0.12)] px-2.5 py-0.5 text-[11px] font-bold text-ok">
      Funded
    </span>
  ) : (
    <span className="shrink-0 rounded-full bg-[rgba(53,5,90,0.06)] px-2.5 py-0.5 text-[11px] font-bold text-ink-500">
      Not funded
    </span>
  );
}

function CampaignRow({
  campaign: c,
  brandName,
  filter,
}: {
  campaign: Campaign;
  brandName: string;
  filter: FilterKey;
}) {
  return (
    <GlassPanel className="flex flex-wrap items-center justify-between gap-4 p-5">
      <Link href={`/admin/campaigns/${c.id}`} className="group min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="text-[15px] font-semibold text-text-hi transition-colors group-hover:text-volt-600">
            {c.name}
          </p>
          {filter !== "pending" ? <StatusChip status={c.status} /> : null}
          <FundedBadge fundedAt={c.fundedAt} />
          {c.deletionRequestedAt ? (
            <span className="shrink-0 rounded-full bg-danger-bg px-2.5 py-0.5 text-[11px] font-bold text-danger-600">
              Deletion requested
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[12.5px] text-text-mid">
          {brandName} · {takaFromPoisha(c.budgetPoisha)} · ends {dhakaDate(c.endDate)}
        </p>
        {filter === "approved" ? (
          <BudgetBar spent={c.spentPoisha} total={c.budgetPoisha} className="mt-3 max-w-md" />
        ) : null}
      </Link>

      {filter === "pending" ? (
        <div className="flex items-center gap-2.5">
          <form action={approveCampaign}>
            <input type="hidden" name="campaignId" value={c.id} />
            <button
              type="submit"
              className="rounded-full bg-volt-600 px-4.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-volt-500"
            >
              Approve
            </button>
          </form>
          <form action={rejectCampaign}>
            <input type="hidden" name="campaignId" value={c.id} />
            <button
              type="submit"
              className="rounded-full border border-[rgba(255,123,192,0.6)] px-4 py-2 text-[13px] font-semibold text-danger-600 transition-colors hover:bg-danger-bg"
            >
              Reject
            </button>
          </form>
        </div>
      ) : (
        <Link
          href={`/admin/campaigns/${c.id}`}
          className="rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-text-hi transition-colors hover:border-volt-400 hover:text-volt-600"
        >
          View
        </Link>
      )}
    </GlassPanel>
  );
}
