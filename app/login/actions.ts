"use server";

import { redirect } from "next/navigation";
import { hasSupabase, siteUrl } from "@/lib/env";
import { ensureGoogleUser, setSession } from "@/lib/auth/session";
import { accessAllowed, routeFor } from "@/lib/auth/guards";
import { promoteIfAdmin } from "@/lib/auth/preapproval";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function signInWithGoogle() {
  if (hasSupabase) {
    const sb = await createSupabaseServer();
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
    if (error || !data?.url) redirect("/login?error=oauth");
    redirect(data.url);
  }

  // Dev stub mode (no Supabase): mint/lookup the identity like a first-time
  // Google sign-in (ensureGoogleUser also promotes an approved-waitlist email),
  // then auto-provision the admin allowlist. Invite-only gate: only staff/brand
  // or an approved clipper gets a session. KLIPR_DEV_ADMIN_EMAIL is the stub admin.
  const user = await promoteIfAdmin(await ensureGoogleUser("you@gmail.com", "You"));
  if (!accessAllowed(user)) redirect("/login?error=not_approved");
  await setSession(user.id);
  redirect(routeFor(user));
}
