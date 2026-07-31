"use client";

import { useActionState } from "react";
import { Button, ArrowEast } from "@/components/ui/button";
import { PreviewCard } from "./preview-card";
import { VField } from "./violet-field";
import { saveBkash, type BkashState } from "./actions";

/**
 * Step 4 — Payout. The final step: saving the bKash number finishes onboarding
 * and drops the clipper into the app. Single column on the violet card.
 */
export function BkashForm({
  avatarUrl,
  name,
  username,
  location,
  languages,
  defaultValue,
  onBack,
}: {
  avatarUrl?: string;
  name: string;
  username: string;
  location?: string;
  languages?: string[];
  defaultValue?: string;
  onBack?: React.ReactNode;
}) {
  const [state, action, pending] = useActionState<BkashState, FormData>(saveBkash, {});
  return (
    <div>
      <h1 className="text-[26px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
        Where should the money go?
      </h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-white">
        Earnings settle automatically after each clip&rsquo;s tracking window and
        pay out to bKash.
      </p>

      <div className="mt-5">
        <PreviewCard
          avatarUrl={avatarUrl}
          name={name}
          username={username}
          location={location}
          languages={languages}
        />
      </div>

      <form action={action} className="mt-5">
        <VField
          label="bKash number"
          name="bkashNumber"
          inputMode="numeric"
          placeholder="01XXXXXXXXX"
          defaultValue={defaultValue}
          error={state.error}
          required
        />
        <p className="mt-2.5 text-[12px] leading-relaxed text-white">
          NID verification is only needed before your first payout releases — never
          for browsing or submitting.
        </p>

        <div className="mt-6 flex items-center gap-3">
          {onBack}
          <Button type="submit" variant="inverse" disabled={pending} className="flex-1">
            {pending ? "Saving…" : "Enter Klipr"} <ArrowEast />
          </Button>
        </div>
      </form>
    </div>
  );
}
