/**
 * TikTok / Instagram / Facebook adapters — thin wrappers over the simulated
 * core until each platform's app review passes. Going live later means
 * implementing fetchStats/verifyOwnership against the real API and flipping
 * VERIFY_MODE_<PLATFORM>=live; URL parsing and the account shape don't change.
 * Expected go-live order per flows v2: TikTok → Instagram → Facebook.
 */
import type { Platform } from "@/lib/db/types";
import type { ParsedPost, PlatformAdapter } from "./types.ts";
import { simulatedFetchStats } from "./simulated.ts";

function envMode(platform: Platform): "live" | "simulated" {
  const forced = process.env[`VERIFY_MODE_${platform.toUpperCase()}`];
  // No live implementations yet — "live" is only honoured once one exists.
  return forced === "live" ? "simulated" : "simulated";
}

export function parseTikTokUrl(url: string): ParsedPost | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  if (host !== "tiktok.com") return null;
  // /@handle/video/{digits} or /@handle/photo/{digits}
  const m = u.pathname.match(/^\/@[^/]+\/(?:video|photo)\/(\d{8,25})/);
  if (!m) return null;
  return {
    platform: "tiktok",
    mediaId: m[1],
    canonicalUrl: `https://www.tiktok.com${u.pathname.replace(/\/$/, "")}`,
  };
}

export function parseInstagramUrl(url: string): ParsedPost | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  if (host !== "instagram.com") return null;
  const m = u.pathname.match(/^\/(?:reel|reels|p)\/([A-Za-z0-9_-]{5,20})/);
  if (!m) return null;
  return {
    platform: "instagram",
    mediaId: m[1],
    canonicalUrl: `https://www.instagram.com/reel/${m[1]}/`,
  };
}

export function parseFacebookUrl(url: string): ParsedPost | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^web\.|^m\./, "");
  if (host === "fb.watch") {
    const code = u.pathname.split("/")[1];
    if (!code || !/^[A-Za-z0-9_-]{5,20}$/.test(code)) return null;
    return { platform: "facebook", mediaId: `fbw_${code}`, canonicalUrl: `https://fb.watch/${code}/` };
  }
  if (host !== "facebook.com") return null;
  const reel = u.pathname.match(/^\/reel\/(\d{8,25})/);
  if (reel) {
    return {
      platform: "facebook",
      mediaId: reel[1],
      canonicalUrl: `https://www.facebook.com/reel/${reel[1]}`,
    };
  }
  if (u.pathname.startsWith("/watch")) {
    const v = u.searchParams.get("v");
    if (v && /^\d{8,25}$/.test(v)) {
      return {
        platform: "facebook",
        mediaId: v,
        canonicalUrl: `https://www.facebook.com/watch/?v=${v}`,
      };
    }
  }
  return null;
}

function simulatedAdapter(
  platform: Platform,
  parse: (url: string) => ParsedPost | null,
): PlatformAdapter {
  return {
    platform,
    mode: () => envMode(platform),
    parsePostUrl: parse,
    async fetchStats(queries) {
      return simulatedFetchStats(queries);
    },
    async verifyOwnership(account) {
      // Simulated mode: the vetted, connected account IS the trust anchor.
      return account.status === "active" ? "owned" : "unknown";
    },
  };
}

export const tiktokAdapter = simulatedAdapter("tiktok", parseTikTokUrl);
export const instagramAdapter = simulatedAdapter("instagram", parseInstagramUrl);
export const facebookAdapter = simulatedAdapter("facebook", parseFacebookUrl);
