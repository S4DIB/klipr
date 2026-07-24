"use server";

import { revalidatePath } from "next/cache";
import { requireActiveClipper } from "@/lib/auth/guards";
import { clipperAccount } from "@/lib/ledger";
import { encryptSecret } from "@/lib/crypto";
import {
  createPayoutBatch,
  ledgerBalance,
  listPayoutBatches,
  newId,
  updateProfile,
} from "@/lib/db";

export type WalletState = { error?: string; ok?: string };

/**
 * Queue a payout of the full available balance. NID gates RELEASE, not the
 * request: without a verified NID the batch is created as `blocked_nid` and
 * the admin queue shows exactly why it can't be sent yet.
 */
export async function requestPayout(_prev: WalletState, _fd: FormData): Promise<WalletState> {
  const user = await requireActiveClipper();
  if (!user.bkashNumber) {
    return { error: "Add your bKash number in Settings first." };
  }

  const [balance, batches] = await Promise.all([
    ledgerBalance(clipperAccount(user.id)),
    listPayoutBatches({ profileId: user.id }),
  ]);
  const held = batches
    .filter((b) => b.status === "queued" || b.status === "blocked_nid" || b.status === "processing")
    .reduce((a, b) => a + b.amountPoisha, 0);
  const available = balance - held;
  if (available <= 0) {
    return { error: "Nothing available to pay out yet." };
  }

  await createPayoutBatch({
    id: newId("pob"),
    profileId: user.id,
    amountPoisha: available,
    bkashNumber: user.bkashNumber,
    status: user.nidStatus === "verified" ? "queued" : "blocked_nid",
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/wallet");
  revalidatePath("/admin/payouts");
  return {
    ok:
      user.nidStatus === "verified"
        ? "Payout queued. It's sent to your payout method in the next payout run."
        : "Payout queued. Verify your NID below so it can be released.",
  };
}

/** NID number is stored encrypted, status → submitted; an admin verifies it. */
export async function submitNid(_prev: WalletState, formData: FormData): Promise<WalletState> {
  const user = await requireActiveClipper();
  const nid = String(formData.get("nid") ?? "").replace(/\s/g, "");
  if (!/^\d{10}$|^\d{13}$|^\d{17}$/.test(nid)) {
    return { error: "Enter a valid NID number (10, 13 or 17 digits)." };
  }
  await updateProfile(user.id, {
    nidStatus: "submitted",
    nidNumberEnc: encryptSecret(nid),
  });
  revalidatePath("/wallet");
  revalidatePath("/settings");
  return { ok: "NID submitted. A reviewer verifies it before your first payout releases." };
}
