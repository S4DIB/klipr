"use client";

import { useActionState } from "react";
import { submitClip, type SubmitState } from "@/app/(app)/campaign/[id]/actions";
import { Button } from "@/components/ui/button";
import type { Platform } from "@/lib/db/types";

export function SubmitForm({
  campaignId,
  platforms,
}: {
  campaignId: string;
  platforms: Platform[];
}) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(
    submitClip,
    {},
  );

  if (state.ok) {
    return (
      <div className="rounded-xl border border-ok/30 bg-ok/5 p-5 text-center">
        <p className="font-display font-semibold text-text-hi">Clip submitted ✓</p>
        <p className="mt-1 text-sm text-text-mid">
          We&rsquo;ll verify the views and it&rsquo;ll show in your dashboard as
          pending.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="campaignId" value={campaignId} />
      <div>
        <p className="mb-1.5 text-sm font-medium text-text-hi">Post link</p>
        <input
          name="postUrl"
          placeholder="https://www.tiktok.com/@you/video/..."
          className="h-11 w-full rounded-xl border border-line bg-white px-3 text-text-hi outline-none placeholder:text-text-low focus:border-volt-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-text-hi">Platform</p>
          <select
            name="platform"
            defaultValue={platforms[0]}
            className="h-11 w-full rounded-xl border border-line bg-white px-3 text-text-hi outline-none focus:border-volt-500"
          >
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-text-hi">Posted from</p>
          <input
            name="postingHandle"
            placeholder="@yourpage"
            className="h-11 w-full rounded-xl border border-line bg-white px-3 text-text-hi outline-none placeholder:text-text-low focus:border-volt-500"
          />
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <Button type="submit" className="h-12 w-full" disabled={pending}>
        {pending ? "Submitting…" : "Submit clip"}
      </Button>
    </form>
  );
}
