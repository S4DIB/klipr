"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/app/field";
import { requestPayout, submitNid, type WalletState } from "./actions";

export function RequestPayoutForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState<WalletState, FormData>(requestPayout, {});
  return (
    <form action={action}>
      <Button
        type="submit"
        disabled={disabled || pending}
        className="h-[52px] w-full text-[15px] disabled:opacity-50"
      >
        {pending ? "Queuing…" : "Request payout"}
      </Button>
      {state.error ? (
        <p className="mt-2 text-center text-[12.5px] font-medium text-danger-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="mt-2 text-center text-[12.5px] text-success-600">{state.ok}</p>
      ) : null}
    </form>
  );
}

export function NidForm() {
  const [state, action, pending] = useActionState<WalletState, FormData>(submitNid, {});
  return (
    <form action={action} className="space-y-2.5">
      <TextField
        label="NID number"
        hint="stored encrypted"
        name="nid"
        inputMode="numeric"
        placeholder="10, 13 or 17 digits"
        error={state.error}
        required
      />
      {state.ok ? <p className="text-[12.5px] text-success-600">{state.ok}</p> : null}
      <Button type="submit" disabled={pending} className="h-9 px-4 text-[13px]">
        {pending ? "Submitting…" : "Verify NID"}
      </Button>
    </form>
  );
}
