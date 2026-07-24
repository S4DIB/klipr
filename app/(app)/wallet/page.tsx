import type { Metadata } from "next";
import { requireActiveClipper } from "@/lib/auth/guards";
import { getCampaign, ledgerBalance, listLedger, listPayoutBatches } from "@/lib/db";
import { clipperAccount } from "@/lib/ledger";
import { maskTail } from "@/lib/crypto";
import { GlassPanel } from "@/components/app/glass-panel";
import { StatusChip } from "@/components/app/status-chip";
import { EmptyState } from "@/components/app/empty-state";
import { IconShield } from "@/components/icons";
import { takaFromPoisha, dhakaDate } from "@/lib/format";
import { RequestPayoutForm, NidForm } from "./wallet-forms";

export const metadata: Metadata = { title: "Wallet" };

/** Big ink-hero money: integer part large, decimals faded. */
function BalancePoisha({ poisha }: { poisha: number }) {
  const whole = Math.floor(Math.abs(poisha) / 100);
  const rem = Math.abs(poisha) % 100;
  return (
    <span className="font-mono text-[40px] font-semibold tracking-[-0.02em] [font-variant-numeric:tabular-nums]">
      {poisha < 0 ? "−" : ""}৳{whole.toLocaleString("en-US")}
      <span className="text-[16px] text-[rgba(255,255,244,0.5)]">
        .{String(rem).padStart(2, "0")}
      </span>
    </span>
  );
}

export default async function WalletPage() {
  const user = await requireActiveClipper();
  const account = clipperAccount(user.id);

  const [balance, batches, entries] = await Promise.all([
    ledgerBalance(account),
    listPayoutBatches({ profileId: user.id }),
    listLedger({ account }),
  ]);
  const held = batches
    .filter((b) => b.status === "queued" || b.status === "blocked_nid" || b.status === "processing")
    .reduce((a, b) => a + b.amountPoisha, 0);
  const available = balance - held;
  const paidOut = batches
    .filter((b) => b.status === "paid")
    .reduce((a, b) => a + b.amountPoisha, 0);
  const lifetime = balance + paidOut;

  const ledgerRows = entries.slice(0, 6);
  const campaignNames = new Map<string, string>();
  await Promise.all(
    [...new Set(ledgerRows.map((e) => e.campaignId).filter(Boolean))].map(async (cid) => {
      const c = await getCampaign(cid!);
      if (c) campaignNames.set(cid!, c.brandName);
    }),
  );

  return (
    <div className="mx-auto w-full max-w-[480px] lg:max-w-none">
      <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink-900">Wallet</h1>

      <div className="mt-[14px] flex flex-col gap-[14px] lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
        <div className="flex flex-col gap-[14px]">
      {/* the ink hero */}
      <GlassPanel variant="ink" className="p-[18px]">
        <span className="eyebrow text-[rgba(255,255,244,0.6)]">Available balance</span>
        <div className="mt-2">
          <BalancePoisha poisha={available} />
        </div>
        <div className="mt-3 flex gap-5">
          <div>
            <p className="font-mono text-[15px] [font-variant-numeric:tabular-nums]">
              {takaFromPoisha(lifetime)}
            </p>
            <p className="text-[11px] text-[rgba(255,255,244,0.55)]">Lifetime earned</p>
          </div>
          <div>
            <p className="font-mono text-[15px] [font-variant-numeric:tabular-nums]">
              {takaFromPoisha(paidOut)}
            </p>
            <p className="text-[11px] text-[rgba(255,255,244,0.55)]">Paid out</p>
          </div>
          {held > 0 ? (
            <div>
              <p className="font-mono text-[15px] [font-variant-numeric:tabular-nums]">
                {takaFromPoisha(held)}
              </p>
              <p className="text-[11px] text-[rgba(255,255,244,0.55)]">Queued</p>
            </div>
          ) : null}
        </div>
      </GlassPanel>

      {/* NID gate. Appears only while it's actually the blocker */}
      {user.nidStatus !== "verified" && (
        <div className="glass-well flex items-start gap-3 border-[rgba(224,164,0,0.28)] bg-[rgba(224,164,0,0.08)] p-3.5">
          <span className="mt-px text-warning-600">
            <IconShield size={20} strokeWidth={1.4} />
          </span>
          <div className="flex-1">
            <p className="text-[13.5px] font-bold text-ink-900">
              {user.nidStatus === "submitted"
                ? "NID under review"
                : "Verify your NID before your first payout"}
            </p>
            <p className="mt-[3px] text-[12px] leading-[1.5] text-ink-600">
              It only gates payouts. Never browsing or posting. Stored encrypted, masked to last 4.
            </p>
            {user.nidStatus === "submitted" ? (
              <StatusChip status="submitted" label="Under review" className="mt-2.5" />
            ) : (
              <div className="mt-2.5">
                <NidForm />
              </div>
            )}
          </div>
        </div>
      )}
        </div>

        <div className="flex flex-col gap-[14px]">
      {/* ledger */}
      <GlassPanel className="p-4">
        <div className="flex items-center justify-between">
          <span className="eyebrow">Ledger</span>
          <span className="text-[12px] text-ink-500">
            {user.bkashNumber
              ? `bKash · ${maskTail(user.bkashNumber)}`
              : "add a payout method in Settings"}
          </span>
        </div>
        {ledgerRows.length === 0 ? (
          <EmptyState
            title="You haven't earned yet"
            line="Post a clip from a live campaign. Views verify automatically."
          />
        ) : (
          <div className="mt-1 flex flex-col">
            {ledgerRows.map((e, i) => (
              <div
                key={e.id}
                className={
                  i < ledgerRows.length - 1
                    ? "flex items-center justify-between border-b border-[rgba(53,5,90,0.07)] py-[11px]"
                    : "flex items-center justify-between py-[11px]"
                }
              >
                <div>
                  <p className="text-[13.5px] font-semibold text-ink-900">
                    {e.eventType === "settlement" ? "Settlement" : "Payout"}
                    {e.campaignId && campaignNames.get(e.campaignId)
                      ? ` · ${campaignNames.get(e.campaignId)}`
                      : ""}
                  </p>
                  <p className="text-[11px] text-ink-500">{dhakaDate(e.createdAt)}</p>
                </div>
                <span
                  className={
                    e.amountPoisha > 0
                      ? "font-mono font-semibold text-success-600 [font-variant-numeric:tabular-nums]"
                      : "font-mono font-semibold text-ink-700 [font-variant-numeric:tabular-nums]"
                  }
                >
                  {e.amountPoisha > 0 ? "+" : ""}
                  {takaFromPoisha(e.amountPoisha)}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {/* payout history. Real batches with status */}
      <GlassPanel className="p-4">
        <span className="eyebrow">Payout history</span>
        {batches.length === 0 ? (
          <p className="mt-2 py-6 text-center text-[13px] text-ink-500">
            No payouts yet. Request one once your available balance clears identity verification.
          </p>
        ) : (
          <div className="mt-1 flex flex-col">
            {batches.map((b, i) => (
              <div
                key={b.id}
                className={
                  i < batches.length - 1
                    ? "flex items-center justify-between border-b border-[rgba(53,5,90,0.07)] py-[11px]"
                    : "flex items-center justify-between py-[11px]"
                }
              >
                <div>
                  <p className="font-mono text-[13.5px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
                    {takaFromPoisha(b.amountPoisha)}
                  </p>
                  <p className="text-[11px] text-ink-500">
                    {dhakaDate(b.createdAt)} · bKash {maskTail(b.bkashNumber)}
                    {b.txnRef ? ` · ${b.txnRef}` : ""}
                  </p>
                </div>
                <StatusChip status={b.status} />
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

        </div>

        <div className="flex flex-col gap-[14px] lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-[480px]">
          <RequestPayoutForm disabled={available <= 0} />
          <p className="text-center text-[11.5px] leading-[1.5] text-ink-400">
            Payouts release after identity verification. An admin sends the transfer to your
            payout method and records the reference.
          </p>
        </div>
      </div>
    </div>
  );
}
