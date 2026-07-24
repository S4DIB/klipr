"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { runSweepNow, type SweepActionState } from "./actions";

export function SweepButton() {
  const [state, action, pending] = useActionState<SweepActionState, FormData>(runSweepNow, {});
  const r = state.report;
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <Button type="submit" disabled={pending} className="h-10 px-5 text-[13.5px]">
        {pending ? "Sweeping…" : "Run sweep now"}
      </Button>
      {state.error ? <span className="text-[12.5px] text-[#c81e6f]">{state.error}</span> : null}
      {r ? (
        <span className="font-mono text-[11.5px] text-text-mid">
          {r.skipped
            ? "skipped (another run in this window)"
            : `polled ${r.polled} · held ${r.held} · settled ${r.settled} (${r.settledZero} at ৳0) · +${r.xpAwarded} XP · ${r.campaignsCompleted} completed`}
        </span>
      ) : null}
    </form>
  );
}
