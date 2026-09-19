/**
 * Campaign-invite rules — pure. The server action in app/agency/clippers
 * gathers the facts (campaign, clipper, existing invite, recent count) and
 * asks these functions what to do; nothing here touches I/O.
 */
import type { Campaign, CampaignInvite, Profile, Submission } from "../db/types.ts";
import { acceptsSubmissions } from "../campaign-rules.ts";
import { isDirectoryVisible } from "./stats.ts";

/** Invites one agency may send in a rolling 24h — keeps the bell from becoming spam. */
export const INVITE_DAILY_LIMIT = 20;
export const INVITE_WINDOW_MS = 24 * 3600_000;
/** Optional personal note, kept short because it lands inside a notification. */
export const INVITE_MESSAGE_MAX = 240;

export function inviteWindowStart(nowIso: string): string {
  return new Date(new Date(nowIso).getTime() - INVITE_WINDOW_MS).toISOString();
}

export type InviteBlock =
  | "not_owner"
  | "campaign_not_accepting"
  | "clipper_unavailable"
  | "already_invited"
  | "rate_limited";

export const INVITE_BLOCK_MESSAGE: Record<InviteBlock, string> = {
  not_owner: "You can only invite clippers to your own campaigns.",
  campaign_not_accepting: "That campaign isn't accepting submissions right now.",
  clipper_unavailable: "That clipper isn't available to invite.",
  already_invited: "You've already invited this clipper to that campaign.",
  rate_limited: `You've reached today's limit of ${INVITE_DAILY_LIMIT} invites. Try again tomorrow.`,
};

/** The first reason an invite can't go out, or null when it can. Checked in order. */
export function inviteBlock(args: {
  campaign: Pick<Campaign, "agencyProfileId" | "status" | "endDate"> | undefined;
  agencyId: string;
  clipper: Profile | undefined;
  alreadyInvited: boolean;
  sentInWindow: number;
  nowIso: string;
}): InviteBlock | null {
  const { campaign, clipper } = args;
  if (!campaign || campaign.agencyProfileId !== args.agencyId) return "not_owner";
  if (!acceptsSubmissions(campaign, args.nowIso)) return "campaign_not_accepting";
  if (!clipper || !isDirectoryVisible(clipper)) return "clipper_unavailable";
  if (args.alreadyInvited) return "already_invited";
  if (args.sentInWindow >= INVITE_DAILY_LIMIT) return "rate_limited";
  return null;
}

export type InviteStatus = "sent" | "submitted";

/**
 * An invite is "accepted" the moment the clipper has a live or settled clip on
 * that campaign — there is no explicit accept. Rejected clips don't count.
 */
export function inviteStatus(invite: CampaignInvite, subs: Submission[]): InviteStatus {
  const took = subs.some(
    (s) =>
      s.campaignId === invite.campaignId &&
      s.profileId === invite.clipperProfileId &&
      s.status !== "rejected",
  );
  return took ? "submitted" : "sent";
}
