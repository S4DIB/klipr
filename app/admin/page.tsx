import Link from "next/link";
import type { Metadata } from "next";
import {
  listApplications,
  listCampaigns,
  listConnectedAccounts,
  listFraudFlags,
  listPayoutBatches,
  listSubmissions,
} from "@/lib/db";
import { getAdapter } from "@/lib/verify";
import { listLeads } from "@/lib/leads";
import { GlassPanel } from "@/components/app/glass-panel";
import { SweepButton } from "./sweep-button";

export const metadata: Metadata = { title: "Ops" };

/** Ops home. The queues that need a human, plus the sweep trigger. */
export default async function AdminOpsPage() {
  const [
    applications,
    leads,
    accounts,
    trackingSubs,
    pendingFunding,
    holds,
    payoutsQueued,
    payoutsBlocked,
  ] = await Promise.all([
    listApplications("submitted"),
    listLeads(),
    listConnectedAccounts(),
    listSubmissions({ status: "tracking" }),
    listCampaigns("pending_funding"),
    listFraudFlags({ status: "open" }),
    listPayoutBatches({ status: "queued" }),
    listPayoutBatches({ status: "blocked_nid" }),
  ]);
  // waitlist clippers awaiting review count as applications — same human queue
  const pendingLeads = leads.filter(
    (l) => l.role === "clipper" && (l.status ?? "pending") === "pending",
  ).length;
  const toVet = applications.length + pendingLeads;
  const accountsPending = accounts.filter((a) => a.status === "pending").length;
  const clipsToVerify = trackingSubs.filter(
    (s) => getAdapter(s.platform).mode() === "manual",
  ).length;

  const tiles = [
    {
      href: "/admin/applications",
      label: "Applications to vet",
      count: toVet,
      hot: toVet > 0,
    },
    {
      href: "/admin/accounts",
      label: "Accounts to verify",
      count: accountsPending,
      hot: accountsPending > 0,
    },
    {
      href: "/admin/clips",
      label: "Clips to verify",
      count: clipsToVerify,
      hot: clipsToVerify > 0,
    },
    {
      href: "/admin/campaigns",
      label: "Campaigns awaiting funding",
      count: pendingFunding.length,
      hot: pendingFunding.length > 0,
    },
    {
      href: "/admin/fraud",
      label: "Fraud holds to review",
      count: holds.length,
      hot: holds.length > 0,
    },
    {
      href: "/admin/payouts",
      label: "Payouts to send",
      count: payoutsQueued.length + payoutsBlocked.length,
      hot: payoutsQueued.length > 0,
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">00 / Ops</p>
        <h1 className="display-1 mt-1 text-[32px] text-text-hi">
          Where a human decides.
        </h1>
        <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-text-mid">
          Vetting · account verification · clip verification · funding · NID ·
          fraud · bKash execution. Enter a clip&rsquo;s verified views and
          settlement, XP, and tiers run themselves from there.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="block">
            <GlassPanel interactive className="p-5">
              <p className="data-xl text-text-hi">{t.count}</p>
              <p className="mt-1.5 flex items-center gap-2 text-[13px] text-text-mid">
                {t.hot && (
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow ring-2 ring-[rgba(53,5,90,0.3)]" aria-hidden="true" />
                )}
                {t.label}
              </p>
            </GlassPanel>
          </Link>
        ))}
      </div>

      <GlassPanel className="p-5">
        <p className="eyebrow mb-3">Verification sweep</p>
        <SweepButton />
        <p className="mt-3 text-[12px] leading-relaxed text-text-low">
          The cron hits /api/cron/sweep every 15 minutes in production. This
          button runs the same engine. Idempotent, so running it twice never
          double-pays.
        </p>
      </GlassPanel>
    </div>
  );
}
