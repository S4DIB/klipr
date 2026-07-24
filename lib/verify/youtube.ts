/**
 * YouTube adapter — live from day one when YOUTUBE_API_KEY is set.
 * videos.list part=statistics,snippet,status · ≤50 ids per call · 1 quota
 * unit per call (10k units/day default ⇒ ~500k checks/day). On quota errors
 * the sweep skips and retries next run — snapshots are deltas, nothing lost.
 */
import type { ConnectedAccount } from "@/lib/db/types";
import type { ParsedPost, PlatformAdapter, StatsQuery, StatsResult } from "./types.ts";
import { simulatedFetchStats } from "./simulated.ts";

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Pure URL → videoId. Supports shorts, watch, youtu.be, m., live. */
export function parseYouTubeUrl(url: string): ParsedPost | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;

  if (host === "youtu.be") {
    id = u.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com") {
    const [, seg1, seg2] = u.pathname.split("/");
    if (seg1 === "shorts" || seg1 === "live" || seg1 === "embed") id = seg2 ?? null;
    else if (seg1 === "watch") id = u.searchParams.get("v");
  }

  if (!id || !ID_RE.test(id)) return null;
  return {
    platform: "youtube",
    mediaId: id,
    canonicalUrl: `https://www.youtube.com/shorts/${id}`,
  };
}

interface YtVideo {
  id: string;
  statistics?: { viewCount?: string };
  snippet?: { channelId?: string };
  status?: { privacyStatus?: string };
}

async function liveFetchStats(queries: StatsQuery[]): Promise<StatsResult[]> {
  const key = process.env.YOUTUBE_API_KEY!;
  const out: StatsResult[] = [];
  const fetchedAt = new Date().toISOString();

  for (let i = 0; i < queries.length; i += 50) {
    const batch = queries.slice(i, i + 50);
    const ids = batch.map((q) => q.mediaId).join(",");
    const url =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?part=statistics,snippet,status&id=${ids}&key=${key}`;
    let res: Response;
    try {
      res = await fetch(url, { cache: "no-store" });
    } catch {
      out.push(...batch.map((q) => ({ ok: false as const, mediaId: q.mediaId, error: "api_error" as const })));
      continue;
    }
    if (res.status === 403) {
      // quota — skip, retry next sweep
      out.push(...batch.map((q) => ({ ok: false as const, mediaId: q.mediaId, error: "quota" as const })));
      continue;
    }
    if (!res.ok) {
      out.push(...batch.map((q) => ({ ok: false as const, mediaId: q.mediaId, error: "api_error" as const })));
      continue;
    }
    const json = (await res.json()) as { items?: YtVideo[] };
    const byId = new Map((json.items ?? []).map((v) => [v.id, v]));
    for (const q of batch) {
      const v = byId.get(q.mediaId);
      if (!v) {
        // absent from the response = deleted, not a transport error
        out.push({ ok: false, mediaId: q.mediaId, error: "not_found" });
      } else if (v.status?.privacyStatus && v.status.privacyStatus !== "public") {
        out.push({ ok: false, mediaId: q.mediaId, error: "private" });
      } else {
        out.push({
          ok: true,
          mediaId: q.mediaId,
          views: Number(v.statistics?.viewCount ?? 0),
          source: "live",
          fetchedAt,
        });
      }
    }
  }
  return out;
}

/** channelId ownership check at submit time — 1 quota unit. */
async function liveVerifyOwnership(
  account: ConnectedAccount,
  post: ParsedPost,
): Promise<"owned" | "not_owned" | "unknown"> {
  const key = process.env.YOUTUBE_API_KEY!;
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${post.mediaId}&key=${key}`,
      { cache: "no-store" },
    );
    if (!res.ok) return "unknown";
    const json = (await res.json()) as { items?: YtVideo[] };
    const channelId = json.items?.[0]?.snippet?.channelId;
    if (!channelId) return "unknown";
    return channelId === account.externalId ? "owned" : "not_owned";
  } catch {
    return "unknown";
  }
}

function mode(): "live" | "simulated" {
  const forced = process.env.VERIFY_MODE_YOUTUBE;
  if (forced === "live" || forced === "simulated") return forced;
  return process.env.YOUTUBE_API_KEY ? "live" : "simulated";
}

export const youtubeAdapter: PlatformAdapter = {
  platform: "youtube",
  mode,
  parsePostUrl: parseYouTubeUrl,
  async fetchStats(queries) {
    return mode() === "live" ? liveFetchStats(queries) : simulatedFetchStats(queries);
  },
  async verifyOwnership(account, post) {
    if (mode() !== "live") return account.status === "active" ? "owned" : "unknown";
    // Live verification demands OAuth-proved accounts (channelId is durable proof).
    if (account.proof !== "oauth") return "unknown";
    return liveVerifyOwnership(account, post);
  },
};
