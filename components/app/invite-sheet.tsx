"use client";

import { useActionState, useState } from "react";
import { Sheet } from "@/components/app/sheet";
import { SelectField, TextAreaField } from "@/components/app/field";
import { Button } from "@/components/ui/button";
import { IconCheckCircle } from "@/components/icons";
import { inviteClipper, type InviteState } from "@/app/agency/clippers/actions";
import { INVITE_MESSAGE_MAX } from "@/lib/clippers/invite-rules";
import { cn } from "@/lib/cn";

export interface InvitableCampaign {
  id: string;
  name: string;
  /** "ends Oct 4, 2026" — rendered beside the name so the pick is informed. */
  endsLabel: string;
  /** Short model tag beside the name, e.g. "retainer" — an invite there is an offer. */
  tag?: string;
}

/**
 * The invite flow: pick one of the agency's live campaigns, add an optional
 * note, send. The clipper gets a notification linking to the brief; there's
 * no accept step — taking part means submitting a clip.
 */
export function InviteSheet({
  clipperId,
  clipperName,
  campaigns,
  liveCount,
  variant = "primary",
  className,
}: {
  clipperId: string;
  clipperName: string;
  /** Live campaigns this clipper has NOT been invited to yet. */
  campaigns: InvitableCampaign[];
  /** All live campaigns, so the empty state can say the right thing. */
  liveCount: number;
  variant?: "primary" | "highlight";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<InviteState, FormData>(inviteClipper, {});
  const single = campaigns.length === 1 ? campaigns[0] : undefined;
  const firstName = clipperName.trim().split(/\s+/)[0] || clipperName;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        onClick={() => setOpen(true)}
        className={cn("h-11 w-full text-[14px]", className)}
      >
        Invite to a campaign
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title={`Invite ${firstName}`}>
        {state.ok ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <span className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-success-bg text-success-600">
              <IconCheckCircle size={34} strokeWidth={1.3} />
            </span>
            <div>
              <h3 className="text-[19px] font-extrabold tracking-[-0.02em] text-text-hi">
                Invite sent
              </h3>
              <p className="mt-[5px] text-[13px] leading-[1.55] text-ink-600">
                {firstName} will see it in their notifications and on their dashboard, with a
                link straight to the brief. You&rsquo;ll see <b>Submitted</b> here the moment
                their clip lands.
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
        ) : campaigns.length === 0 ? (
          <div className="py-2">
            <p className="text-[14px] leading-relaxed text-ink-600">
              {liveCount === 0
                ? "You don't have a live campaign to invite them to yet. Invites go out for campaigns that are funded and accepting clips."
                : `${firstName} is already invited to every live campaign you're running.`}
            </p>
            {liveCount === 0 ? (
              <Button href="/agency/campaigns/new" variant="secondary" className="mt-4 h-11 text-[14px]">
                Create a campaign
              </Button>
            ) : null}
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-3.5">
            <input type="hidden" name="clipperId" value={clipperId} />

            {single ? (
              <div>
                <p className="eyebrow mb-[7px]">Campaign</p>
                <div className="glass-well flex items-center gap-2.5 px-[13px] py-[11px]">
                  <input type="hidden" name="campaignId" value={single.id} />
                  <span className="flex-1 truncate text-[13.5px] font-semibold text-ink-900">
                    {single.name}
                  </span>
                  {single.tag ? (
                    <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10.5px] font-bold text-violet-700">
                      {single.tag}
                    </span>
                  ) : null}
                  <span className="shrink-0 text-[11px] text-ink-500">ends {single.endsLabel}</span>
                </div>
              </div>
            ) : (
              <SelectField label="Campaign" name="campaignId" required defaultValue="">
                <option value="" disabled>
                  Pick a live campaign
                </option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.tag ? ` · ${c.tag}` : ""} · ends {c.endsLabel}
                  </option>
                ))}
              </SelectField>
            )}

            <TextAreaField
              label="Add a note"
              hint="optional"
              name="message"
              maxLength={INVITE_MESSAGE_MAX}
              rows={3}
              placeholder={`Why ${firstName} is a fit for this brief — they'll read it in the invite.`}
              className="min-h-[84px]"
            />

            {state.error ? (
              <p className="text-[13px] font-medium text-danger-600" role="alert">
                {state.error}
              </p>
            ) : null}

            <p className="text-[11.5px] leading-[1.5] text-ink-500">
              One invite per clipper per campaign. They take part by submitting a clip — there&rsquo;s
              nothing for them to accept.
            </p>

            <Button type="submit" disabled={pending} className="h-12 w-full text-[15px]">
              {pending ? "Sending…" : "Send invite"}
            </Button>
          </form>
        )}
      </Sheet>
    </>
  );
}
