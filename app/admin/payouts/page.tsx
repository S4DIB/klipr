import Link from "next/link";
import type { Metadata } from "next";
import { getProfilesByIds, listPayoutBatches } from "@/lib/db";
import { maskTail } from "@/lib/crypto";
import { GlassPanel } from "@/components/app/glass-panel";
import { StatusChip } from "@/components/app/status-chip";
import { EmptyState } from "@/components/app/empty-state";
import { takaFromPoisha, dhakaDateTime } from "@/lib/format";
import { MarkPaidForm } from "./mark-paid-form";

export const metadata: Metadata = { title: "Payouts · Admin" };

export default async function AdminPayoutsPage() {
  const all = await listPayoutBatches();
  const sendable = all.filter((b) => b.status === "queued" || b.status === "processing");
  const blocked = all.filter((b) => b.status === "blocked_nid");
  const paid = all.filter((b) => b.status === "paid").slice(0, 10);

  // One query for every payee, instead of a serial getProfile per batch.
  const payeeProfiles = await getProfilesByIds([...new Set(all.map((b) => b.profileId))]);
  const names = new Map(payeeProfiles.map((p) => [p.id, p.displayName] as const));

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">03 / Payouts</p>
        <h1 className="display-1 mt-1 text-[32px] text-text-hi">The bKash run.</h1>
        <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-text-mid">
          Send each queued amount from the Klipr bKash account, then record the
          transaction reference. The ledger blocks double-payment by design.
        </p>
      </header>

      <section className="space-y-3">
        <p className="eyebrow">Ready to send</p>
        {sendable.length === 0 ? (
          <GlassPanel>
            <EmptyState title="Nothing to send" line="Queued payouts with a verified NID appear here." />
          </GlassPanel>
        ) : (
          sendable.map((b) => (
            <GlassPanel key={b.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="data-xl text-[22px] text-text-hi">{takaFromPoisha(b.amountPoisha)}</p>
                <p className="mt-1 text-[12.5px] text-text-mid">
                  {names.get(b.profileId)} · bKash {maskTail(b.bkashNumber)} ·
                  requested {dhakaDateTime(b.createdAt)}
                </p>
              </div>
              <MarkPaidForm batchId={b.id} />
            </GlassPanel>
          ))
        )}
      </section>

      {blocked.length > 0 && (
        <section className="space-y-3">
          <p className="eyebrow">Blocked on NID</p>
          {blocked.map((b) => (
            <GlassPanel key={b.id} variant="well" className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="text-[15px] font-semibold text-text-hi">{takaFromPoisha(b.amountPoisha)}</p>
                <p className="mt-0.5 text-[12.5px] text-text-mid">
                  {names.get(b.profileId)} · releases automatically once the NID is verified
                </p>
              </div>
              <Link
                href="/admin/clippers"
                className="rounded-full bg-[rgba(250,255,71,0.5)] px-4 py-2 text-[12.5px] font-semibold text-text-hi transition-colors hover:bg-[rgba(250,255,71,0.75)]"
              >
                Review NID →
              </Link>
            </GlassPanel>
          ))}
        </section>
      )}

      {paid.length > 0 && (
        <section className="space-y-3">
          <p className="eyebrow">Recently paid</p>
          <GlassPanel className="divide-y divide-[rgba(53,5,90,0.06)] p-3">
            {paid.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-4 px-3 py-3">
                <p className="text-[13.5px] text-text-hi">
                  {names.get(b.profileId)}
                  <span className="ml-2 font-mono text-[11px] text-text-low">{b.txnRef}</span>
                </p>
                <div className="flex items-center gap-3">
                  <span className="data-sm text-text-hi">{takaFromPoisha(b.amountPoisha)}</span>
                  <StatusChip status="paid" />
                </div>
              </div>
            ))}
          </GlassPanel>
        </section>
      )}
    </div>
  );
}
