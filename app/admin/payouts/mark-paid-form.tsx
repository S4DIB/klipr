"use client";

import { useActionState } from "react";
import { markPaid, type PayoutActionState } from "./actions";

export function MarkPaidForm({ batchId }: { batchId: string }) {
  const [state, action, pending] = useActionState<PayoutActionState, FormData>(markPaid, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="batchId" value={batchId} />
      <input
        name="txnRef"
        placeholder="bKash txn ref"
        className="focus-quiet glass-well w-36 px-3 py-2 font-mono text-[12px] text-text-hi placeholder:text-text-low"
        required
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-volt-500 px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-volt-400 disabled:opacity-60"
      >
        {pending ? "Recording…" : "Mark paid"}
      </button>
      {state.error ? (
        <span className="text-[12px] font-medium text-[#c81e6f]">{state.error}</span>
      ) : null}
    </form>
  );
}
