import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { currentUser } from "@/lib/auth/session";
import {
  listConnectedAccounts,
  listVettedPagesForProfile,
  newId,
  upsertConnectedAccount,
} from "@/lib/db";
import { encryptSecret } from "@/lib/crypto";
import { serverEnv } from "@/lib/env.server";
import { siteUrl } from "@/lib/env";

export const runtime = "nodejs";

/**
 * OAuth callback: exchange the code, read the channel (`mine=true`), store
 * the ConnectedAccount with encrypted tokens. The channelId is the DURABLE
 * ownership proof — stats polling uses the API key afterwards, so token
 * expiry never breaks verification.
 */
export async function GET(request: Request) {
  const to = (q: string) => NextResponse.redirect(new URL(`/connections?${q}`, siteUrl));

  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login", siteUrl));

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const saved = jar.get("klipr_yt_state")?.value;
  jar.delete("klipr_yt_state");

  if (!code || !state || !saved) return to("error=oauth_state");
  const [nonce, pageId] = saved.split(":");
  if (nonce !== state) return to("error=oauth_state");

  const vetted = await listVettedPagesForProfile(user.id);
  const page = vetted.find((p) => p.id === pageId && p.platform === "youtube");
  if (!page) return to("error=page_not_vetted");

  // exchange the code
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: serverEnv.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: serverEnv.GOOGLE_OAUTH_CLIENT_SECRET!,
      redirect_uri: `${siteUrl}/api/connect/youtube/callback`,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!tokenRes.ok) return to("error=oauth_exchange");
  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  // whose channel is this?
  const chRes = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
    { headers: { authorization: `Bearer ${tokens.access_token}` }, cache: "no-store" },
  );
  if (!chRes.ok) return to("error=channel_read");
  const chJson = (await chRes.json()) as {
    items?: {
      id: string;
      snippet?: { title?: string; customUrl?: string; thumbnails?: { default?: { url?: string } } };
      statistics?: { subscriberCount?: string };
    }[];
  };
  const channel = chJson.items?.[0];
  if (!channel) return to("error=no_channel");

  // one channel — one owner
  const existing = (await listConnectedAccounts()).find(
    (a) => a.platform === "youtube" && a.externalId === channel.id && a.profileId !== user.id,
  );
  if (existing) return to("error=channel_already_connected");

  const prior = (await listConnectedAccounts(user.id)).find(
    (a) => a.applicationPageId === page.id,
  );

  await upsertConnectedAccount({
    id: prior?.id ?? newId("acc"),
    profileId: user.id,
    platform: "youtube",
    applicationPageId: page.id,
    externalId: channel.id,
    handle: channel.snippet?.customUrl ?? page.handle,
    displayName: channel.snippet?.title,
    avatarUrl: channel.snippet?.thumbnails?.default?.url,
    followerCount: channel.statistics?.subscriberCount
      ? Number(channel.statistics.subscriberCount)
      : page.selfReportedFollowers,
    proof: "oauth",
    accessTokenEnc: encryptSecret(tokens.access_token),
    refreshTokenEnc: tokens.refresh_token ? encryptSecret(tokens.refresh_token) : undefined,
    tokenExpiresAt: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : undefined,
    status: "active",
    createdAt: prior?.createdAt ?? new Date().toISOString(),
  });

  return to("connected=youtube");
}
