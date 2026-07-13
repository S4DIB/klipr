import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db";

/** Google OAuth callback: exchange the code for a session, then route by
 *  whether the profile is completed (the onboarding gate). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const sb = await createSupabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await sb.auth.getUser();
      const profile = user ? await getProfile(user.id) : null;
      const dest = profile?.profileCompleted ? "/marketplace" : "/onboarding";
      return NextResponse.redirect(new URL(dest, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
