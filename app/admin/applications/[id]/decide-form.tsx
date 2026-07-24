"use client";

import { useActionState } from "react";
import { decideApplication, type DecideState } from "../actions";

/**
 * The sticky decision bar. The one glass-ink surface on this screen.
 * Approve needs ≥1 approved page; decline needs a reason (shown verbatim
 * to the applicant).
 */
export function DecideForm({
  applicationId,
  approvedCount,
}: {
  applicationId: string;
  approvedCount: number;
}) {
  const [state, action, pending] = useActionState<DecideState, FormData>(
    decideApplication,
    {},
  );
  const canGrant = approvedCount > 0;

  return (
    <div className="glass-ink sticky bottom-4 p-[18px]">
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="applicationId" value={applicationId} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-[420px] text-[12.5px] leading-[1.5] text-[rgba(255,255,244,0.7)]">
            Approving grants marketplace access (≥1 approved page). Declining all requires a
            reason shown verbatim to the applicant.
          </p>
          <div className="flex shrink-0 gap-2.5">
            <button
              type="submit"
              name="decision"
              value="approved"
              disabled={pending || !canGrant}
              className="rounded-full bg-ivory px-5 py-2.5 text-[13.5px] font-bold text-violet-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Grant access
            </button>
            <button
              type="submit"
              name="decision"
              value="declined"
              disabled={pending}
              className="rounded-full border border-[rgba(255,255,244,0.35)] px-5 py-2.5 text-[13.5px] font-bold text-ivory transition-colors hover:bg-[rgba(255,255,244,0.1)] disabled:opacity-60"
            >
              Decline all
            </button>
          </div>
        </div>
        <input
          name="reason"
          placeholder='Decline reason, shown to the applicant verbatim (e.g. "Page inactive since May. Reapply once you post regularly again.")'
          className="focus-quiet w-full rounded-[12px] border border-[rgba(255,255,244,0.18)] bg-[rgba(255,255,244,0.08)] px-3.5 py-2.5 text-[13px] text-ivory placeholder:text-[rgba(255,255,244,0.45)]"
        />
        {state.error ? (
          <p className="text-[13px] font-medium text-[#ffd7ea]" role="alert">
            {state.error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
