import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db";
import { accessAllowed, routeFor } from "@/lib/auth/guards";
import { promoteIfPreapproved } from "@/lib/auth/preapproval";

/**
 * Google OAuth callback. Invite-only: exchange the code, then allow the session
 * ONLY for admins/brands or a clipper the admin already approved on the waitlist
 * (promoteIfPreapproved flips them to "active"). Anyone else is signed straight
 * back out and told to join the waitlist — no self-serve account.
 */
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

      if (promoted && accessAllowed(promoted)) {
        return NextResponse.redirect(new URL(routeFor(promoted), url.origin));
      }
      // Not approved → refuse the session entirely.
      await sb.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=not_approved", url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
