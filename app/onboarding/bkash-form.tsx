"use client";

import { useActionState } from "react";
import { TextField } from "@/components/app/field";
import { Button, ArrowEast } from "@/components/ui/button";
import { saveBkash, type BkashState } from "./actions";

export function BkashForm({ defaultValue }: { defaultValue?: string }) {
  const [state, action, pending] = useActionState<BkashState, FormData>(saveBkash, {});
  return (
    <form action={action} className="space-y-4">
      <TextField
        label="bKash number"
        hint="where every payout lands"
        name="bkashNumber"
        inputMode="numeric"
        placeholder="01XXXXXXXXX"
        defaultValue={defaultValue}
        error={state.error}
        required
      />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save payout number"} <ArrowEast />
      </Button>
      <p className="text-center text-[12px] leading-relaxed text-text-low">
        NID verification is only needed before your first payout releases.
        Never for browsing or submitting.
      </p>
    </form>
  );
}
