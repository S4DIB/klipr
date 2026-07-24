"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { appendLedgerEvent, listPayoutBatches, updatePayoutBatch } from "@/lib/db";
import { buildPayoutEvent } from "@/lib/ledger";

export type PayoutActionState = { error?: string };

/**
 * Record an executed bKash transfer. The ledger event is keyed to the batch
 * id, so double-submits can never double-book. One of the five human
 * touchpoints. Until the bKash Payout API replaces the manual send.
 */
export async function markPaid(
  _prev: PayoutActionState,
  formData: FormData,
): Promise<PayoutActionState> {
  const admin = await requireAdmin();
  const batchId = String(formData.get("batchId") ?? "");
  const txnRef = String(formData.get("txnRef") ?? "").trim();
  if (txnRef.length < 4) {
    return { error: "Enter the bKash transaction reference. It's the audit trail." };
  }

  const batch = (await listPayoutBatches()).find((b) => b.id === batchId);
  if (!batch) return { error: "Batch not found." };
  if (batch.status !== "queued" && batch.status !== "processing") {
    return { error: `Batch is ${batch.status}. Only queued/processing can be paid.` };
  }

  const { inserted } = await appendLedgerEvent(
    buildPayoutEvent({
      payoutBatchId: batch.id,
      profileId: batch.profileId,
      amountPoisha: batch.amountPoisha,
      memo: `bKash ${txnRef}`,
    }),
  );
  if (!inserted) return { error: "This batch was already paid (ledger says no twice)." };

  await updatePayoutBatch(batch.id, {
    status: "paid",
    txnRef,
    paidBy: admin.id,
    paidAt: new Date().toISOString(),
  });

  revalidatePath("/admin/payouts");
  revalidatePath("/wallet");
  revalidatePath("/home");
  return {};
}
