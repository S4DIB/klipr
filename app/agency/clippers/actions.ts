"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guards";
import {
  countCampaignInvitesSince,
  createCampaignInvite,
  createNotification,
  findCampaignInvite,
  getCampaign,
  getProfilesByIds,
  newId,
} from "@/lib/db";
import {
  INVITE_BLOCK_MESSAGE,
  INVITE_MESSAGE_MAX,
  inviteBlock,
  inviteWindowStart,
} from "@/lib/clippers/invite-rules";
import { takaFromPoisha } from "@/lib/format";

const schema = z.object({
  clipperId: z.string().trim().min(1, "Pick a clipper."),
  campaignId: z.string().trim().min(1, "Pick a campaign."),
  message: z
    .string()
    .trim()
    .max(INVITE_MESSAGE_MAX, `Keep the note under ${INVITE_MESSAGE_MAX} characters.`)
    .optional(),
});

export type InviteState = { error?: string; ok?: boolean };

/**
 * Invite a clipper to one of the agency's live campaigns. Every rule lives in
 * lib/clippers/invite-rules; this gathers the facts, records the invite and
 * drops a notification that links the clipper to the brief. Server actions
 * bypass the proxy matcher, so the role check here is the security boundary.
 */
export async function inviteClipper(_prev: InviteState, formData: FormData): Promise<InviteState> {
  let user;
  try {
    user = await requireRole("agency");
  } catch {
    return { error: "Agency account required." };
  }

  const parsed = schema.safeParse({
    clipperId: formData.get("clipperId"),
    campaignId: formData.get("campaignId"),
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const { clipperId, campaignId, message } = parsed.data;
  const now = new Date().toISOString();

  const [campaign, [clipper], existing, sentInWindow] = await Promise.all([
    getCampaign(campaignId),
    // service-role read — getProfile is RLS-scoped to self and would return nothing here
    getProfilesByIds([clipperId]),
    findCampaignInvite(campaignId, clipperId),
    countCampaignInvitesSince(user.id, inviteWindowStart(now)),
  ]);

  const block = inviteBlock({
    campaign,
    agencyId: user.id,
    clipper,
    alreadyInvited: Boolean(existing),
    sentInWindow,
    nowIso: now,
  });
  if (block || !campaign || !clipper) return { error: INVITE_BLOCK_MESSAGE[block ?? "not_owner"] };

  await createCampaignInvite({
    id: newId("inv"),
    campaignId,
    agencyProfileId: user.id,
    clipperProfileId: clipperId,
    message: message || undefined,
    createdAt: now,
  });

  const agencyName = user.orgName || user.displayName;
  // a retainer invite IS the offer — lead with the fee and the deliverable
  const retainer =
    campaign.payoutModel === "retainer"
      ? `${takaFromPoisha(campaign.retainerClipperPoisha ?? 0)} for ${campaign.retainerVideos ?? 0} videos`
      : null;
  await createNotification({
    id: newId("ntf"),
    profileId: clipperId,
    kind: "campaign_invite",
    title: retainer
      ? `${agencyName} offered you a retainer`
      : `${agencyName} invited you to a campaign`,
    body: retainer
      ? `“${campaign.name}” — ${retainer}.${message ? ` ${message}` : " Open the campaign to grab the clip and start posting."}`
      : message
        ? `“${campaign.name}” — ${message}`
        : `You've been invited to clip for “${campaign.name}”. Open the campaign to grab the clip and submit.`,
    href: `/campaigns/${campaignId}`,
    createdAt: now,
  });

  revalidatePath(`/agency/clippers/${clipperId}`);
  revalidatePath(`/agency/campaigns/${campaignId}`);
  revalidatePath("/dashboard");
  revalidatePath(`/campaigns/${campaignId}`);
  return { ok: true };
}
