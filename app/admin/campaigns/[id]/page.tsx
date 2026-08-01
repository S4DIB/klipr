import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCampaign, getProfile } from "@/lib/db";
import { GlassPanel } from "@/components/app/glass-panel";
import { StatusChip } from "@/components/app/status-chip";
import { BudgetBar } from "@/components/ui/budget-bar";
import { IconChevronLeft } from "@/components/icons";
import { PLATFORMS } from "@/lib/platforms";
import { takaFromPoisha, dhakaDate, dhakaDateTime } from "@/lib/format";
import { approveCampaign, rejectCampaign, markCampaignFunded, cancelCampaign } from "../actions";

export const metadata: Metadata = { title: "Campaign · Admin" };

export default async function AdminCampaignDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await getCampaign(id);
  if (!c) notFound();

  const brand = await getProfile(c.brandProfileId);
  const brandName = brand?.orgName ?? brand?.displayName ?? c.brandProfileId;
  const funded = Boolean(c.fundedAt);
  const isPending = c.status === "pending_funding" || c.status === "draft";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/campaigns"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-text-mid transition-colors hover:text-text-hi"
      >
        <IconChevronLeft size={15} strokeWidth={1.6} /> Campaigns
      </Link>

      <header>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-text-hi">{c.name}</h1>
          <StatusChip status={c.status} />
        </div>
        <p className="mt-1 text-[13.5px] text-text-mid">
          {brandName}
          {brand?.email ? ` · ${brand.email}` : ""}
        </p>
      </header>

      {/* Funding — the SEPARATE money step */}
      <GlassPanel className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">Funding</p>
            <p className="mt-1 text-[14.5px] font-bold text-text-hi">
              {funded
                ? `Funded${c.fundedAt ? ` · ${dhakaDateTime(c.fundedAt)}` : ""}`
                : "Not funded yet"}
            </p>
            <p className="mt-0.5 max-w-md text-[12.5px] leading-relaxed text-text-mid">
              {funded
                ? "Escrow is set aside — clippers can be paid for this campaign."
                : "Approving only makes the campaign public. Confirm the money separately, whenever it arrives."}
            </p>
          </div>
          {!funded ? (
            <form action={markCampaignFunded}>
              <input type="hidden" name="campaignId" value={c.id} />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-volt-600 px-4.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-volt-500"
              >
                Mark funding received
              </button>
            </form>
          ) : null}
        </div>
        <BudgetBar spent={c.spentPoisha} total={c.budgetPoisha} className="mt-4 max-w-md" />
      </GlassPanel>

      {/* Details */}
      <GlassPanel className="space-y-3 p-5">
        <p className="eyebrow">Details</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13.5px]">
          <Row label="Budget" value={takaFromPoisha(c.budgetPoisha)} />
          <Row label="Niche" value={c.niche || "—"} />
          <Row
            label="Platforms"
            value={c.allowedPlatforms.map((p) => PLATFORMS[p].label).join(", ") || "—"}
          />
          <Row label="Clipper rate" value={`${takaFromPoisha(c.rateClipperPer1k)} / 1k views`} />
          <Row label="Starts" value={dhakaDate(c.startDate)} />
          <Row label="Ends" value={dhakaDate(c.endDate)} />
          <Row label="Tracking window" value={`${c.trackingWindowDays} days`} />
          <Row label="Min qualifying views" value={c.minQualifyViews.toLocaleString("en-US")} />
        </dl>
        {c.sourceUrl ? (
          <p className="text-[13px]">
            <span className="text-text-mid">Source clip: </span>
            <a
              href={c.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-volt-600 underline"
            >
              open ↗
            </a>
          </p>
        ) : null}
      </GlassPanel>

      {c.brief || c.guidelines ? (
        <GlassPanel className="space-y-4 p-5">
          {c.brief ? (
            <div>
              <p className="eyebrow mb-1.5">Brief</p>
              <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-text-hi">
                {c.brief}
              </p>
            </div>
          ) : null}
          {c.guidelines ? (
            <div>
              <p className="eyebrow mb-1.5">Guidelines</p>
              <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-text-hi">
                {c.guidelines}
              </p>
            </div>
          ) : null}
        </GlassPanel>
      ) : null}

      {/* Approval / lifecycle */}
      <div className="flex flex-wrap items-center gap-2.5">
        {isPending ? (
          <>
            <form action={approveCampaign}>
              <input type="hidden" name="campaignId" value={c.id} />
              <button
                type="submit"
                className="rounded-full bg-volt-600 px-5 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:bg-volt-500"
              >
                Approve — make public
              </button>
            </form>
            <form action={rejectCampaign}>
              <input type="hidden" name="campaignId" value={c.id} />
              <button
                type="submit"
                className="rounded-full border border-[rgba(255,123,192,0.6)] px-4 py-2.5 text-[13.5px] font-semibold text-danger-600 transition-colors hover:bg-danger-bg"
              >
                Reject
              </button>
            </form>
          </>
        ) : c.status === "active" ? (
          <form action={cancelCampaign}>
            <input type="hidden" name="campaignId" value={c.id} />
            <button
              type="submit"
              className="rounded-full border border-[rgba(255,123,192,0.6)] px-4 py-2.5 text-[13.5px] font-semibold text-danger-600 transition-colors hover:bg-danger-bg"
            >
              Stop submissions
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-text-mid">{label}</dt>
      <dd className="mt-0.5 font-semibold text-text-hi">{value}</dd>
    </div>
  );
}
