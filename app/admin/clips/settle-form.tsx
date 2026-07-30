"use client";

import { useActionState } from "react";
import { settleClip, type ClipActionState } from "./actions";

/** Enter the verified view count → settle the clip. Mirrors MarkPaidForm. */
export function SettleClipForm({ submissionId }: { submissionId: string }) {
  const [state, action, pending] = useActionState<ClipActionState, FormData>(settleClip, {});
  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-2">
      <input type="hidden" name="submissionId" value={submissionId} />
      <input
        name="views"
        inputMode="numeric"
        placeholder="verified views"
        className="focus-quiet glass-well w-32 px-3 py-2 font-mono text-[12px] text-text-hi placeholder:text-text-low"
        required
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-volt-500 px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-volt-400 disabled:opacity-60"
      >
        {pending ? "Settling…" : "Approve · settle"}
      </button>
      {state.error ? (
        <span className="w-full text-right text-[12px] font-medium text-[#c81e6f]">
          {state.error}
        </span>
      ) : null}
      {state.ok ? (
        <span className="w-full text-right text-[12px] font-medium text-ok">{state.ok}</span>
      ) : null}
    </form>
  );
}
