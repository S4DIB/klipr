/**
 * Session — dual-mode. With Supabase configured, reads the real Supabase Auth
 * user (Google OAuth) and joins to the profile row. Without it, a cookie-based
 * stub identity so dev runs with no OAuth setup.
 */
import { cookies } from "next/headers";
import { hasSupabase } from "@/lib/env";
import { getProfile, getProfileByEmail, upsertProfile, newId } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Profile } from "@/lib/db/types";

const COOKIE = "klipr_uid";

export async function currentUser(): Promise<Profile | null> {
  if (hasSupabase) {
    const sb = await createSupabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return null;
    return (await getProfile(user.id)) ?? null;
  }
  // stub mode
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  return (await getProfile(id)) ?? null;
}

/** Stub-only: set the demo session cookie. */
export async function setSession(profileId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, profileId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession(): Promise<void> {
  if (hasSupabase) {
    const sb = await createSupabaseServer();
    await sb.auth.signOut();
    return;
  }
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Stub-only Google identity (real Google profile is created by the DB trigger). */
export async function ensureGoogleUser(
  email: string,
  displayName: string,
): Promise<Profile> {
  const existing = await getProfileByEmail(email);
  if (existing) return existing;
  return upsertProfile({
    id: newId("usr"),
    email,
    displayName,
    role: "individual",
    accountStatus: "active",
    profileCompleted: false,
    createdAt: new Date().toISOString(),
  });
}
