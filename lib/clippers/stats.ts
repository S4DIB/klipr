/**
 * Clipper directory — pure helpers. What an agency is allowed to see about a
 * clipper, and how the directory is searched, filtered and ranked. No I/O;
 * the loaders in ./directory.ts feed these.
 *
 * Privacy: `PublicClipper` is the ONLY clipper shape that reaches an agency.
 * Anything not on it (email, bKash, NID, earnings, raw XP) is unreachable
 * rather than merely un-rendered.
 */
import type {
  ApplicationPage,
  ConnectedAccount,
  Platform,
  Profile,
  Submission,
  Tier,
} from "../db/types.ts";
import { PLATFORM_ORDER } from "../platforms.ts";
import { TIER_ORDER } from "../xp.ts";

export interface ClipperStats {
  /** Settled clips, whether or not they cleared the campaign minimum. */
  clipsDelivered: number;
  /** Clips still inside a tracking window. */
  liveClips: number;
  /** Distinct campaigns with at least one paid (qualifying) settlement. */
  campaignsCompleted: number;
  /** Lifetime verified views — settled clips only, at their locked count. */
  settledViews: number;
  /** Median locked views across settled clips: what one clip is worth. */
  medianViewsPerClip: number;
  /** Share of settled clips that cleared the minimum and got paid. Null until a clip settles. */
  qualifyRate: number | null;
  /** Most recent submission, any status. */
  lastActiveAt?: string;
}

export interface PublicPlatform {
  platform: Platform;
  handle: string;
  followerCount?: number;
}

/** The agency-facing view of a clipper. Whitelist — add fields deliberately. */
export interface PublicClipper {
  id: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  coverUrl?: string;
  tier: Tier;
  streakWeeks: number;
  location?: string;
  postLanguages?: string;
  joinedAt: string;
  /** Leaderboard position; absent when opted out or not yet settled. */
  rank?: number;
  /** Vetted, active pages — the platforms this clipper can actually post on. */
  platforms: PublicPlatform[];
  /** Declared niches from vetted application pages. */
  niches: string[];
  stats: ClipperStats;
}

/**
 * Who appears in the directory: an active earner who finished onboarding.
 * Mid-setup accounts have no pages yet, so inviting them would go nowhere.
 * Network (the dormant clipper-side role) is included, like the leaderboard.
 */
export function isDirectoryVisible(p: Profile): boolean {
  return (
    (p.role === "clipper" || p.role === "network") &&
    p.access === "active" &&
    p.accountStatus === "active" &&
    p.profileCompleted
  );
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Performance from a clipper's own submissions. "Qualified" means the clip
 * cleared its campaign's minimum and was paid — read straight off
 * `earnedPoisha`, which is what settlement actually wrote, so it holds for
 * both per-views and per-video campaigns without a campaign join.
 */
export function clipperStats(subs: Submission[]): ClipperStats {
  const settled = subs.filter((s) => s.status === "settled");
  const qualified = settled.filter((s) => (s.earnedPoisha ?? 0) > 0);
  const live = subs.filter((s) => s.status === "tracking" || s.status === "held");
  const locked = settled.map((s) => s.lockedViews ?? 0);
  const lastActiveAt = subs.reduce<string | undefined>(
    (acc, s) => (!acc || s.submittedAt > acc ? s.submittedAt : acc),
    undefined,
  );
  return {
    clipsDelivered: settled.length,
    liveClips: live.length,
    campaignsCompleted: new Set(qualified.map((s) => s.campaignId)).size,
    settledViews: locked.reduce((a, v) => a + v, 0),
    medianViewsPerClip: median(locked),
    qualifyRate: settled.length ? qualified.length / settled.length : null,
    lastActiveAt,
  };
}

export function toPublicClipper(args: {
  profile: Profile;
  submissions: Submission[];
  accounts: ConnectedAccount[];
  pages: ApplicationPage[];
  rank?: number;
}): PublicClipper {
  const { profile: p } = args;
  const platforms = args.accounts
    .filter((a) => a.profileId === p.id && a.status === "active")
    .map<PublicPlatform>((a) => ({
      platform: a.platform,
      handle: a.handle,
      followerCount: a.followerCount,
    }))
    .sort((a, b) => PLATFORM_ORDER.indexOf(a.platform) - PLATFORM_ORDER.indexOf(b.platform));
  const niches = [...new Set(args.pages.map((pg) => pg.niche).filter(Boolean))].sort();
  return {
    id: p.id,
    displayName: p.displayName,
    username: p.username,
    avatarUrl: p.avatarUrl,
    coverUrl: p.coverUrl,
    tier: p.tier,
    streakWeeks: p.streakWeeks,
    location: p.location,
    postLanguages: p.postLanguages,
    joinedAt: p.createdAt,
    rank: args.rank,
    platforms,
    niches,
    stats: clipperStats(args.submissions.filter((s) => s.profileId === p.id)),
  };
}

/* ── search · filter · sort ─────────────────────────────── */

export const DIRECTORY_SORTS = [
  { key: "views", label: "Most views" },
  { key: "perclip", label: "Best per clip" },
  { key: "rank", label: "Leaderboard" },
  { key: "newest", label: "Newest" },
] as const;
export type DirectorySort = (typeof DIRECTORY_SORTS)[number]["key"];

export function normalizeSort(value?: string): DirectorySort {
  return DIRECTORY_SORTS.some((s) => s.key === value) ? (value as DirectorySort) : "views";
}

export interface DirectoryFilter {
  q?: string;
  tier?: Tier;
  platform?: Platform;
  niche?: string;
}

export function normalizeTier(value?: string): Tier | undefined {
  return TIER_ORDER.includes(value as Tier) ? (value as Tier) : undefined;
}
export function normalizePlatform(value?: string): Platform | undefined {
  return PLATFORM_ORDER.includes(value as Platform) ? (value as Platform) : undefined;
}

/** Free-text match across the fields an agency would type: name, handle, place, niche. */
export function matchesQuery(c: PublicClipper, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    c.displayName,
    c.username ? `@${c.username}` : "",
    c.location ?? "",
    c.postLanguages ?? "",
    ...c.platforms.map((p) => p.handle),
    ...c.niches,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export function filterClippers(list: PublicClipper[], f: DirectoryFilter): PublicClipper[] {
  return list.filter(
    (c) =>
      (!f.q || matchesQuery(c, f.q)) &&
      (!f.tier || c.tier === f.tier) &&
      (!f.platform || c.platforms.some((p) => p.platform === f.platform)) &&
      (!f.niche || c.niches.includes(f.niche)),
  );
}

/** Stable sort. Ties fall back to more clips, then name — never insertion order. */
export function sortClippers(list: PublicClipper[], sort: DirectorySort): PublicClipper[] {
  const byName = (a: PublicClipper, b: PublicClipper) => a.displayName.localeCompare(b.displayName);
  const byViews = (a: PublicClipper, b: PublicClipper) =>
    b.stats.settledViews - a.stats.settledViews ||
    b.stats.clipsDelivered - a.stats.clipsDelivered ||
    byName(a, b);
  const cmp: Record<DirectorySort, (a: PublicClipper, b: PublicClipper) => number> = {
    views: byViews,
    perclip: (a, b) => b.stats.medianViewsPerClip - a.stats.medianViewsPerClip || byViews(a, b),
    rank: (a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || byViews(a, b),
    newest: (a, b) => b.joinedAt.localeCompare(a.joinedAt) || byName(a, b),
  };
  return [...list].sort(cmp[sort]);
}
