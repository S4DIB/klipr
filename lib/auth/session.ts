/**
 * Session — dual-mode. With Supabase configured, reads the real Supabase Auth
 * user (Google OAuth) and joins to the profile row. Without it, a cookie-based
 * stub identity so dev runs with no OAuth setup.
 */
import { cookies } from "next/headers";
import { hasSupabase } from "@/lib/env";
import { getProfile, getProfileByEmail, upsertProfile, newId } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase/server";
import { promoteIfPreapproved } from "@/lib/auth/preapproval";
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
  if (existing) return promoteIfPreapproved(existing);

  // Dev-only bootstrap: in stub mode (no Supabase), the empty store has no
  // admin. KLIPR_DEV_ADMIN_EMAIL lets one email come in as an active admin so
  // the manual-verification queues are reachable locally. Never set in prod.
  const devAdmin =
    !hasSupabase &&
    Boolean(process.env.KLIPR_DEV_ADMIN_EMAIL) &&
    email.toLowerCase() === process.env.KLIPR_DEV_ADMIN_EMAIL!.toLowerCase();

  const created = await upsertProfile({
    id: newId("usr"),
    email,
    displayName,
    role: devAdmin ? "admin" : "clipper",
    // no marketplace access until the application is vetted (admins are active)
    access: devAdmin ? "active" : "none",
    tier: "beginner",
    xpTotal: 0,
    streakWeeks: 0,
    nidStatus: "none",
    leaderboardOptOut: false,
    accountStatus: "active",
    profileCompleted: devAdmin,
    onboardingStep: devAdmin ? 99 : 0,
    createdAt: new Date().toISOString(),
  });
  return promoteIfPreapproved(created);
}
