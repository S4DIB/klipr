/**
 * Platform metadata — the single place that knows platform labels, ordering
 * and rollout posture. Adapter mode (live/simulated) is resolved server-side
 * in lib/verify; this file is client-safe.
 */
import type { Platform } from "@/lib/db/types";

export interface PlatformMeta {
  id: Platform;
  label: string;
  /** Marketplace surface label, e.g. "YouTube Shorts". */
  surface: string;
  /** Per flows v2: TikTok + YouTube are the recommended defaults. */
  recommended: boolean;
  /** URL hint shown in submit forms. */
  urlHint: string;
}

export const PLATFORMS: Record<Platform, PlatformMeta> = {
  youtube: {
    id: "youtube",
    label: "YouTube",
    surface: "YouTube Shorts",
    recommended: true,
    urlHint: "https://www.youtube.com/shorts/…",
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    surface: "TikTok",
    recommended: true,
    urlHint: "https://www.tiktok.com/@you/video/…",
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    surface: "Instagram Reels",
    recommended: false,
    urlHint: "https://www.instagram.com/reel/…",
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    surface: "Facebook Reels",
    recommended: false,
    urlHint: "https://www.facebook.com/reel/…",
  },
};

export const PLATFORM_ORDER: Platform[] = ["tiktok", "youtube", "instagram", "facebook"];

/** Infer the platform from a pasted page/profile link. Null when unknown. */
export function platformFromUrl(link: string): Platform | null {
  let host: string;
  try {
    host = new URL(link.startsWith("http") ? link : `https://${link}`).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host === "youtu.be" || host.endsWith("youtube.com")) return "youtube";
  if (host.endsWith("tiktok.com")) return "tiktok";
  if (host.endsWith("instagram.com")) return "instagram";
  if (host.endsWith("facebook.com") || host.endsWith("fb.com") || host === "fb.watch") {
    return "facebook";
  }
  return null;
}

/** Best-effort handle from a page link: "@name" segment, else the last path segment. */
export function handleFromUrl(link: string): string {
  try {
    const u = new URL(link.startsWith("http") ? link : `https://${link}`);
    const segments = u.pathname.split("/").filter(Boolean);
    return segments.find((s) => s.startsWith("@")) ?? segments.at(-1) ?? u.hostname;
  } catch {
    return link;
  }
}

export const NICHES = [
  "Memes",
  "Sports",
  "Entertainment",
  "Food",
  "Music",
  "Tech",
  "Gaming",
  "Fashion",
  "News",
  "Motivation",
  "Education",
  "Other",
] as const;
