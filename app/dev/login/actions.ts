"use server";

import { redirect, notFound } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { getProfile } from "@/lib/db";
import { setSession } from "@/lib/auth/session";
import { routeFor } from "@/lib/auth/guards";

/**
 * DEV ONLY. Signs the stub session in as an existing local profile and drops
 * into that role's home. Guarded off whenever Supabase is configured — i.e.
 * it never runs in production.
 */
export async function signInAsProfile(formData: FormData) {
  if (hasSupabase) notFound();

  const id = formData.get("profileId");
  if (typeof id !== "string") notFound();
  const profile = await getProfile(id);
  if (!profile) notFound();

  await setSession(profile.id);
  redirect(routeFor(profile));
}
