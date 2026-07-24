"use server";

import { redirect } from "next/navigation";
import { hasSupabase, siteUrl } from "@/lib/env";
import { ensureGoogleUser, setSession } from "@/lib/auth/session";
import { routeFor } from "@/lib/auth/guards";
import { getProfile } from "@/lib/db";
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

  // stub mode: skip OAuth. Enter directly as the seeded ACTIVE demo clipper
  // so testing lands straight in the app. Falls back to a fresh applicant
  // identity if the seed is missing.
  const demo = await getProfile("usr_clipper");
  const user = demo ?? (await ensureGoogleUser("you@gmail.com", "You"));
  await setSession(user.id);
  redirect(routeFor(user));
}

/** Stub-only demo identities (hidden when Supabase is configured). */
async function signInAsSeed(id: string) {
  const profile = await getProfile(id);
  if (!profile) redirect("/login?error=seed");
  await setSession(profile.id);
  redirect(routeFor(profile));
}

export async function signInAsClipper() {
  await signInAsSeed("usr_clipper");
}
export async function signInAsNewClipper() {
  await signInAsSeed("usr_newbie");
}
export async function signInAsAgency() {
  await signInAsSeed("usr_agency");
}
export async function signInAsBrand() {
  await signInAsSeed("usr_brand");
}
export async function signInAsAdmin() {
  await signInAsSeed("usr_admin");
}
export async function signInAsApplicant() {
  await signInAsSeed("usr_waitlist");
}
