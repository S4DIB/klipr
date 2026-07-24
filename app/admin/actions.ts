"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { runSweep, type SweepReport } from "@/lib/verify/sweep";

export type SweepActionState = { report?: SweepReport; error?: string };

/** Manual sweep trigger. Same engine the cron hits. */
export async function runSweepNow(
  _prev: SweepActionState,
  _fd: FormData,
): Promise<SweepActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Admin only." };
  }
  const report = await runSweep();
  revalidatePath("/admin");
  revalidatePath("/admin/payouts");
  revalidatePath("/admin/fraud");
  return { report };
}
