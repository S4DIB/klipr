import { NextResponse } from "next/server";
import { hasSupabase } from "@/lib/env";
import { getProfile } from "@/lib/db";
import { routeFor } from "@/lib/auth/guards";

/**
 * DEV ONLY — cookie-based identity switch for local stub mode, used by
 * screenshot tooling and manual QA: /dev-login?as=usr_clipper&to=/home
 * Hard-disabled outside development or whenever Supabase is configured.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development" || hasSupabase) {
    return new NextResponse("Not found", { status: 404 });
  }
  const url = new URL(request.url);
  const as = url.searchParams.get("as") ?? "";
  const profile = await getProfile(as);
  if (!profile) return new NextResponse("Unknown demo profile", { status: 400 });

  const to = url.searchParams.get("to") ?? routeFor(profile);
  const res = NextResponse.redirect(new URL(to, url.origin));
  res.cookies.set("klipr_uid", profile.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return res;
}
