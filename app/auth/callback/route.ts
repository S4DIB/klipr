import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db";
import { accessAllowed, routeFor } from "@/lib/auth/guards";
import { promoteIfAdmin, promoteIfPreapproved } from "@/lib/auth/preapproval";
import { siteUrl } from "@/lib/env";

/**
 * Google OAuth callback. Invite-only: exchange the code, then allow the session
 * ONLY for admins/brands or a clipper the admin already approved on the waitlist
 * (promoteIfPreapproved flips them to "active"). Anyone else is signed straight
 * back out and told to join the waitlist — no self-serve account.
 *
 * Redirects are built from siteUrl (NEXT_PUBLIC_SITE_URL), NOT request.url:
 * behind a reverse proxy (Coolify/Traefik) request.url's origin is the internal
 * container host (localhost:3000), which would bounce the user off the site.
 */
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");

  if (code) {
    const sb = await createSupabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) {
      try {
        const {
          data: { user },
        } = await sb.auth.getUser();
        const profile = user ? await getProfile(user.id) : null;
        // The SaaS admin email is provisioned here; then approved-waitlist clippers
        // are unlocked. Anything else stays access "none".
        let promoted = profile ? await promoteIfAdmin(profile) : null;
        if (promoted) promoted = await promoteIfPreapproved(promoted);

        if (promoted && accessAllowed(promoted)) {
          return NextResponse.redirect(new URL(routeFor(promoted), siteUrl));
        }
      } catch (e) {
        // Provisioning failed (e.g. a DB write): never dead-end the user on a
        // raw 500 — log it, drop the half-made session, and let them retry.
        console.error("[auth/callback] account provisioning failed:", e);
        await sb.auth.signOut();
        return NextResponse.redirect(new URL("/login?error=auth", siteUrl));
      }
      // Not approved → refuse the session entirely.
      await sb.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=not_approved", siteUrl));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", siteUrl));
}
