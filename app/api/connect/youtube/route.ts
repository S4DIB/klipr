import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { currentUser } from "@/lib/auth/session";
import { listVettedPagesForProfile } from "@/lib/db";
import { serverEnv } from "@/lib/env.server";
import { siteUrl } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Start the YouTube connect flow for a VETTED page. Separate Google OAuth
 * client from Supabase sign-in (scope: youtube.readonly). The state cookie
 * binds the callback to this session + page.
 */
export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login", siteUrl));

  const clientId = serverEnv.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId || !serverEnv.GOOGLE_OAUTH_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/connections?error=oauth_unconfigured", siteUrl));
  }

  const url = new URL(request.url);
  const pageId = url.searchParams.get("page") ?? "";
  const vetted = await listVettedPagesForProfile(user.id);
  const page = vetted.find((p) => p.id === pageId && p.platform === "youtube");
  if (!page) {
    return NextResponse.redirect(new URL("/connections?error=page_not_vetted", siteUrl));
  }

  const nonce = randomBytes(16).toString("hex");
  const jar = await cookies();
  jar.set("klipr_yt_state", `${nonce}:${pageId}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", `${siteUrl}/api/connect/youtube/callback`);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "https://www.googleapis.com/auth/youtube.readonly");
  auth.searchParams.set("access_type", "offline");
  auth.searchParams.set("prompt", "consent");
  auth.searchParams.set("state", nonce);
  return NextResponse.redirect(auth);
}
