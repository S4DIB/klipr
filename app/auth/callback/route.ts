import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db";
import { routeFor } from "@/lib/auth/guards";
import { promoteIfPreapproved } from "@/lib/auth/preapproval";

/** Google OAuth callback: exchange the code for a session, then route by
 *  role + access state (the gated model — new users land on /apply). */
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
      // approved on the waitlist before signing up? Unlock the app right here.
      const promoted = profile ? await promoteIfPreapproved(profile) : null;
      const dest = promoted ? routeFor(promoted) : "/apply";
      return NextResponse.redirect(new URL(dest, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
