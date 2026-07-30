/**
 * Platform verification adapters — one interface, four implementations.
 * The flows-v2 principle in code: a submission is only trusted because the
 * account was already OAuth-connected AND the page was already vetted; the
 * submit action enforces both before any stats call.
 *
 * Note on the interface: fetchStats takes {mediaId, submittedAt} items (not
 * bare ids) so the simulated adapters can be deterministic over a clip's age
 * with ONE uniform call path for live and simulated. Live adapters ignore
 * submittedAt.
 */
import type { ConnectedAccount, Platform } from "@/lib/db/types";

export interface ParsedPost {
  platform: Platform;
  mediaId: string;
  canonicalUrl: string;
}

export interface StatsQuery {
  mediaId: string;
  /** ISO — used by simulated adapters to grow views deterministically. */
  submittedAt: string;
}

export type StatsResult =
  | { ok: true; mediaId: string; views: number; source: "live" | "simulated"; fetchedAt: string }
  | { ok: false; mediaId: string; error: "not_found" | "private" | "api_error" | "quota" };

export interface PlatformAdapter {
  platform: Platform;
  /** "live" = real API; "manual" = admin enters view counts (no API);
   *  "simulated" = deterministic fake curves (tests/opt-in dev only). */
  mode(): "live" | "manual" | "simulated";
  /** Pure, synchronous URL → media identity. null = not a valid post URL. */
  parsePostUrl(url: string): ParsedPost | null;
  /** Batched stats read. Order/length may differ from input; match by mediaId. */
  fetchStats(queries: StatsQuery[]): Promise<StatsResult[]>;
  verifyOwnership(
    account: ConnectedAccount,
    post: ParsedPost,
  ): Promise<"owned" | "not_owned" | "unknown">;
}
