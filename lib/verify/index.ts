import type { Platform } from "@/lib/db/types";
import type { PlatformAdapter } from "./types.ts";
import { youtubeAdapter } from "./youtube.ts";
import { facebookAdapter, instagramAdapter, tiktokAdapter } from "./others.ts";

export type { ParsedPost, PlatformAdapter, StatsQuery, StatsResult } from "./types.ts";

const ADAPTERS: Record<Platform, PlatformAdapter> = {
  youtube: youtubeAdapter,
  tiktok: tiktokAdapter,
  instagram: instagramAdapter,
  facebook: facebookAdapter,
};

export function getAdapter(platform: Platform): PlatformAdapter {
  return ADAPTERS[platform];
}
