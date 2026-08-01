"use server";

import { revalidatePath } from "next/cache";
import { requireActiveClipper } from "@/lib/auth/guards";
import {
  createSubmission,
  findSubmissionByMedia,
  getCampaign,
  getConnectedAccount,
  getSubmissionByUrl,
  listSubmissions,
  newId,
} from "@/lib/db";
import { getAdapter } from "@/lib/verify";
import { normalizeUrl } from "@/lib/url";
import { submissionCap } from "@/lib/xp";
import {
  acceptsSubmissions,
  remainingBudgetPoisha,
  submissionWindowEnd,
} from "@/lib/campaign-rules";

export type SubmitState = { error?: string; ok?: boolean };

/**
 * The submit action. Every check the flows demand, in order:
 * active clipper → campaign accepting → submission cap →
 * URL parses → global URL dedup → per-campaign media dedup → account is
 * theirs, right platform, vetted-by-construction → ownership via adapter →
 * baseline snapshot → tracking.
 */
export async function submitClip(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  let user;
  try {
    user = await requireActiveClipper();
  } catch {
    return { error: "Sign in as an approved clipper to submit." };
  }

  const campaignId = String(formData.get("campaignId") ?? "");
  const accountId = String(formData.get("accountId") ?? "");
  const rawUrl = normalizeUrl(String(formData.get("postUrl") ?? ""));
  const now = new Date().toISOString();

  const campaign = await getCampaign(campaignId);
  if (!campaign) return { error: "Campaign not found." };
  if (!acceptsSubmissions(campaign, now)) {
    return { error: "This campaign is no longer accepting submissions." };
  }
  if (remainingBudgetPoisha(campaign) <= 0) {
    return { error: "This campaign's budget is fully committed." };
  }

  // per-campaign submission cap, scaled by tier
  const mine = await listSubmissions({ campaignId, profileId: user.id });
  const counted = mine.filter((s) => s.status !== "rejected").length;
  const cap = submissionCap(campaign.submissionCapBase, user.tier);
  if (counted >= cap) {
    return { error: `You've reached this campaign's submission cap for your tier (${cap}).` };
  }

  const account = await getConnectedAccount(accountId);
  if (!account || account.profileId !== user.id || account.status !== "active") {
    return { error: "Pick one of your connected pages." };
  }
  if (!campaign.allowedPlatforms.includes(account.platform)) {
    return { error: "That page's platform isn't accepted by this campaign." };
  }

  const adapter = getAdapter(account.platform);
  if (adapter.mode() === "live" && account.proof !== "oauth") {
    return { error: "This platform verifies live. Reconnect the page with OAuth first." };
  }

  const post = adapter.parsePostUrl(rawUrl);
  if (!post) {
    return { error: "That doesn't look like a post link on this page's platform." };
  }

  if (await getSubmissionByUrl(post.canonicalUrl)) {
    return { error: "That post has already been submitted." };
  }
  if (await findSubmissionByMedia(campaignId, post.mediaId)) {
    return { error: "This video is already in this campaign. The same clip can't earn twice." };
  }

  const owned = await adapter.verifyOwnership(account, post);
  if (owned === "not_owned") {
    return { error: "That post doesn't belong to the connected page." };
  }
  if (owned === "unknown" && adapter.mode() === "live") {
    return { error: "Couldn't confirm the post belongs to your page. Try again in a minute." };
  }

  // Manual mode (no platform API): no baseline is fetched — the clip goes to
  // the admin review queue as "tracking", and an admin enters the verified view
  // count to settle it. Live mode snapshots a baseline so views count onward.
  let baselineViews = 0;
  let status: "tracking" | "pending" = "tracking";
  if (adapter.mode() !== "manual") {
    const [stats] = await adapter.fetchStats([{ mediaId: post.mediaId, submittedAt: now }]);
    const baselineOk = stats?.ok === true;
    if (!baselineOk && stats && "error" in stats && stats.error === "not_found") {
      return { error: "The platform can't find that post. Is it public?" };
    }
    if (!baselineOk && stats && "error" in stats && stats.error === "private") {
      return { error: "That post is private. Make it public first." };
    }
    baselineViews = baselineOk && stats.ok ? stats.views : 0;
    status = baselineOk ? "tracking" : "pending"; // pending → the sweep retries the baseline
  }

  await createSubmission({
    id: newId("sub"),
    campaignId,
    profileId: user.id,
    connectedAccountId: account.id,
    platform: account.platform,
    postUrl: post.canonicalUrl,
    mediaId: post.mediaId,
    baselineViews,
    latestViews: baselineViews,
    countedViews: 0,
    status,
    submittedAt: now,
    windowEndsAt: submissionWindowEnd(campaign, now),
  });

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/clips");
  revalidatePath("/home");
  return { ok: true };
}
