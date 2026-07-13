"use server";

import { redirect } from "next/navigation";
import { hasSupabase, siteUrl } from "@/lib/env";
import { ensureGoogleUser, setSession } from "@/lib/auth/session";
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

  // stub mode: demo clipper identity
  const user = await ensureGoogleUser("you@gmail.com", "Demo Clipper");
  await setSession(user.id);
  redirect(user.profileCompleted ? "/marketplace" : "/onboarding");
}

/** Stub-only demo admin entry (hidden when Supabase is configured). */
export async function signInAsAdmin() {
  await setSession("usr_admin");
  redirect("/admin");
}
