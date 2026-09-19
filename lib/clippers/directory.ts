/**
 * Clipper directory — the loaders. Reads go through the service-role client
 * (like leaderboard()), so RLS never sees them; the caller has already been
 * gated by requireRole("agency"), and ./stats.ts is the field whitelist.
 */
import "server-only";
import {
  getProfilesByIds,
  leaderboard,
  listConnectedAccounts,
  listProfiles,
  listSubmissions,
  listSubmissionsForProfiles,
  listVettedPagesForProfile,
  listVettedPagesForProfiles,
} from "@/lib/db";
import { isDirectoryVisible, toPublicClipper, type PublicClipper } from "./stats";

/** Leaderboard position by profile id. Opt-outs and unsettled clippers simply aren't there. */
async function rankMap(): Promise<Map<string, number>> {
  const rows = await leaderboard(1000);
  return new Map(rows.map((r, i) => [r.profileId, i + 1]));
}

/** Every directory-visible clipper with their public stats — four reads, no N+1. */
export async function loadClipperDirectory(): Promise<PublicClipper[]> {
  const profiles = (await listProfiles()).filter(isDirectoryVisible);
  if (!profiles.length) return [];
  const ids = profiles.map((p) => p.id);
  const idSet = new Set(ids);

  const [subs, accounts, pagesByProfile, ranks] = await Promise.all([
    listSubmissionsForProfiles(ids),
    listConnectedAccounts(),
    listVettedPagesForProfiles(ids),
    rankMap(),
  ]);

  // group once so each profile only sees its own rows
  const subsBy = new Map<string, typeof subs>();
  for (const s of subs) (subsBy.get(s.profileId) ?? subsBy.set(s.profileId, []).get(s.profileId)!).push(s);
  const accountsBy = new Map<string, typeof accounts>();
  for (const a of accounts) {
    if (!idSet.has(a.profileId)) continue;
    (accountsBy.get(a.profileId) ?? accountsBy.set(a.profileId, []).get(a.profileId)!).push(a);
  }

  return profiles.map((profile) =>
    toPublicClipper({
      profile,
      submissions: subsBy.get(profile.id) ?? [],
      accounts: accountsBy.get(profile.id) ?? [],
      pages: pagesByProfile[profile.id] ?? [],
      rank: ranks.get(profile.id),
    }),
  );
}

/** One clipper's public profile, or undefined when they're not directory-visible. */
export async function loadPublicClipper(id: string): Promise<PublicClipper | undefined> {
  // getProfilesByIds, not getProfile: the latter is RLS-scoped to self, so an
  // agency reading another profile through it gets nothing.
  const [profile] = await getProfilesByIds([id]);
  if (!profile || !isDirectoryVisible(profile)) return undefined;
  const [submissions, accounts, pages, ranks] = await Promise.all([
    listSubmissions({ profileId: id }),
    listConnectedAccounts(id),
    listVettedPagesForProfile(id),
    rankMap(),
  ]);
  return toPublicClipper({ profile, submissions, accounts, pages, rank: ranks.get(id) });
}
