/**
 * Per-request authorization guards. Layouts gate with redirects; every
 * SERVER ACTION must call one of these too — Next 16 server actions bypass
 * the proxy matcher, so the action itself is the security boundary.
 */
import { currentUser } from "@/lib/auth/session";
import type { Profile, Role } from "@/lib/db/types";

export class AuthError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireUser(): Promise<Profile> {
  const user = await currentUser();
  if (!user) throw new AuthError("Sign in required");
  if (user.accountStatus === "blocked") throw new AuthError("Account blocked");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<Profile> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new AuthError();
  return user;
}

export async function requireAdmin(): Promise<Profile> {
  return requireRole("admin");
}

/** Clipper or agency with vetted marketplace access — the (app) shell rule. */
export async function requireActiveClipper(): Promise<Profile> {
  const user = await requireRole("clipper", "agency");
  if (user.access !== "active") throw new AuthError("Marketplace access pending");
  return user;
}

/** Where a signed-in profile belongs — shared by login, OAuth callback, layouts. */
export function routeFor(user: Profile): string {
  if (user.role === "admin") return "/admin";
  if (user.role === "brand") return user.profileCompleted ? "/brand" : "/apply";
  // clipper / agency — the gated access model
  switch (user.access) {
    case "active":
      return user.profileCompleted ? "/home" : "/onboarding";
    case "waitlisted":
    case "declined":
      return "/apply/status";
    default:
      return "/apply";
  }
}
