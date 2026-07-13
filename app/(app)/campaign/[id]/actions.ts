"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser } from "@/lib/auth/session";
import {
  getCampaign,
  getSubmissionByUrl,
  listSubmissions,
  createSubmission,
  newId,
} from "@/lib/db";
import type { Platform } from "@/lib/db/types";

const schema = z.object({
  campaignId: z.string(),
  postUrl: z.string().trim().url("Enter a valid post URL"),
  platform: z.enum(["TikTok", "Instagram", "YouTube", "Facebook"]),
  postingHandle: z.string().trim().min(2, "Add the handle you posted from").max(40),
});

export type SubmitState = { error?: string; ok?: boolean };

export async function submitClip(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const user = await currentUser();
  if (!user) return { error: "Please sign in." };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const { campaignId, postUrl, platform, postingHandle } = parsed.data;

  const campaign = await getCampaign(campaignId);
  if (!campaign || campaign.status !== "active") {
    return { error: "This campaign isn't open for submissions." };
  }
  // platform must match what the campaign accepts
  if (!campaign.allowedPlatforms.includes(platform as Platform)) {
    return { error: `This campaign doesn't accept ${platform} links.` };
  }
  // one unique post link, ever
  if (await getSubmissionByUrl(postUrl)) {
    return { error: "That post link has already been submitted." };
  }
  // individuals submit once; agencies may submit many
  if (user.role !== "agency") {
    const mine = await listSubmissions({ campaignId, profileId: user.id });
    if (mine.length > 0) {
      return { error: "You've already submitted to this campaign." };
    }
  }

  await createSubmission({
    id: newId("sub"),
    campaignId,
    profileId: user.id,
    postingHandle,
    platform: platform as Platform,
    postUrl,
    status: "pending",
    verifiedViews: 0,
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/campaign/${campaignId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
