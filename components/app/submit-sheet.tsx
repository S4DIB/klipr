"use client";

import { useActionState, useState } from "react";
import { Sheet } from "@/components/app/sheet";
import { SelectField } from "@/components/app/field";
import { Button } from "@/components/ui/button";
import { IconCheckCircle, IconVerified } from "@/components/icons";
import { submitClip, type SubmitState } from "@/app/(app)/campaigns/[id]/actions";
import { PLATFORMS } from "@/lib/platforms";
import type { Platform } from "@/lib/db/types";

export interface SubmitAccount {
  id: string;
  platform: Platform;
  handle: string;
  proof: "oauth" | "simulated" | "manual";
}

/**
 * The submit flow: post from a vetted page, paste the post link. Budget is a
 * ceiling, settlement is first-come first-served. With no platform API, the
 * clip is reviewed and its verified view count is entered by an admin.
 */
export function SubmitSheet({
  campaignId,
  campaignName,
  accounts,
  urlHint,
}: {
  campaignId: string;
  campaignName: string;
  accounts: SubmitAccount[];
  urlHint: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitClip, {});
  const single = accounts.length === 1 ? accounts[0] : undefined;

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="h-11 flex-1 text-[14px]">
        Submit your clip
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Submit your clip">
        {state.ok ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <span className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-success-bg text-success-600">
              <IconCheckCircle size={34} strokeWidth={1.3} />
            </span>
            <div>
              <h3 className="text-[19px] font-extrabold tracking-[-0.02em] text-text-hi">
                Submitted
              </h3>
              <p className="mt-[5px] text-[13px] leading-[1.55] text-ink-600">
                Your clip is <b>in review</b>. Our team verifies the view count and settles your
                earnings — usually within a day of the campaign&rsquo;s tracking window.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-1 h-11 w-full text-[14px]"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-2">
            <p className="text-[14px] leading-relaxed text-ink-600">
              You need a vetted page on one of this campaign&rsquo;s platforms before you can
              submit.
            </p>
            <Button href="/connections" variant="secondary" className="mt-4 h-11 text-[14px]">
              Connect a page
            </Button>
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-3.5">
            <p className="-mt-3 text-[12.5px] text-ink-500">{campaignName}</p>
            <input type="hidden" name="campaignId" value={campaignId} />

            {single ? (
              <div>
                <p className="eyebrow mb-[7px]">Post from</p>
                <div className="glass-well flex items-center gap-2.5 px-[13px] py-[11px]">
                  <input type="hidden" name="accountId" value={single.id} />
                  <span className="text-success-600">
                    <IconVerified size={18} strokeWidth={1.4} />
                  </span>
                  <span className="flex-1 truncate text-[13.5px] font-semibold text-ink-900">
                    {single.handle} · {PLATFORMS[single.platform].label}
                  </span>
                  {single.proof === "simulated" ? (
                    <span className="text-[11px] font-bold text-warning-600">Simulated</span>
                  ) : (
                    <span className="text-[11px] font-bold text-success-600">Vetted ✓</span>
                  )}
                </div>
              </div>
            ) : (
              <SelectField label="Post from" name="accountId" required>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.handle} · {PLATFORMS[a.platform].surface}
                    {a.proof === "simulated" ? " (simulated)" : ""}
                  </option>
                ))}
              </SelectField>
            )}

            <div>
              <p className="eyebrow mb-[7px]">Paste your post URL</p>
              <input
                type="text"
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
                name="postUrl"
                required
                placeholder={urlHint}
                className="focus-quiet glass-well w-full px-[13px] py-[11px] text-[13.5px] text-ink-900 transition-colors placeholder:text-ink-400 focus:border-[rgba(125,4,215,0.5)]"
              />
            </div>

            {state.error ? (
              <p className="text-[13px] font-medium text-danger-600" role="alert">
                {state.error}
              </p>
            ) : null}

            <p className="text-[11.5px] leading-[1.5] text-ink-500">
              Budget is a ceiling. Earnings settle first-come, first-served. Verified views are
              counted by our team after review.
            </p>

            <Button type="submit" disabled={pending} className="h-12 w-full text-[15px]">
              {pending ? "Submitting…" : "Submit clip"}
            </Button>
          </form>
        )}
      </Sheet>
    </>
  );
}
