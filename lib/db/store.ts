/**
 * Local persistence — a JSON-file-backed store so the app runs with ZERO
 * external accounts. Swap this module for Supabase/Postgres in production
 * (the call sites only use the exported functions). Server-only.
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  DB,
  Profile,
  Campaign,
  Submission,
  Payout,
} from "./types.ts";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

function now() {
  return new Date().toISOString();
}
function daysFromNow(d: number) {
  return new Date(Date.now() + d * 86400_000).toISOString();
}

export function newId(prefix: string) {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

function seed(): DB {
  const admin: Profile = {
    id: "usr_admin",
    email: "admin@klipr.app",
    displayName: "Klipr Admin",
    role: "admin",
    accountStatus: "active",
    profileCompleted: true,
    createdAt: now(),
  };

  const campaigns: Campaign[] = [
    {
      id: "cmp_aila", name: "Eid drop teaser", brand: "Aila Active", niche: "Fashion",
      brief: "Tease the Eid collection with fast, punchy cuts. Hook in the first 2 seconds.",
      guidelines: "Keep it under 30s. Do not alter the logo. No competitor brands in frame.",
      allowedPlatforms: ["TikTok", "Instagram"], sourceUrl: "https://example.com/aila.mp4",
      budget: 40000, minViewThreshold: 2000, startDate: now(), endDate: daysFromNow(14),
      status: "active", createdAt: now(),
    },
    {
      id: "cmp_north", name: "New single rollout", brand: "Northbeat Records", niche: "Music",
      brief: "Clip the most viral 15s of the music video. Caption with the song name.",
      guidelines: "Audio must stay original. Credit @northbeat in the caption.",
      allowedPlatforms: ["YouTube", "TikTok"], sourceUrl: "https://example.com/north.mp4",
      budget: 75000, minViewThreshold: 3000, startDate: now(), endDate: daysFromNow(21),
      status: "active", createdAt: now(),
    },
    {
      id: "cmp_pulse", name: "Top story recaps", brand: "Pulse Daily", niche: "News",
      brief: "Recap the day's top story in a 20s vertical clip.",
      guidelines: "Factual only. No editorialising. Use the supplied footage.",
      allowedPlatforms: ["Instagram", "YouTube"], sourceUrl: "https://example.com/pulse.mp4",
      budget: 25000, minViewThreshold: 2000, startDate: now(), endDate: daysFromNow(10),
      status: "active", createdAt: now(),
    },
    {
      id: "cmp_orbit", name: "App launch UGC", brand: "Orbit App", niche: "Tech",
      brief: "Show one feature you'd actually use. Authentic, talking-head style.",
      guidelines: "Show the app on screen. No paid-actor vibes. Be real.",
      allowedPlatforms: ["TikTok", "YouTube"], sourceUrl: "https://example.com/orbit.mp4",
      budget: 50000, minViewThreshold: 2500, startDate: now(), endDate: daysFromNow(18),
      status: "active", createdAt: now(),
    },
  ];

  return { profiles: [admin], campaigns, submissions: [], payouts: [] };
}

// Persist a singleton across dev HMR reloads.
const g = globalThis as unknown as { __klipr_db?: DB };

function load(): DB {
  if (g.__klipr_db) return g.__klipr_db;
  try {
    if (fs.existsSync(DATA_FILE)) {
      g.__klipr_db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as DB;
      return g.__klipr_db;
    }
  } catch {
    // fall through to seed
  }
  g.__klipr_db = seed();
  save();
  return g.__klipr_db;
}

function save() {
  if (!g.__klipr_db) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(g.__klipr_db, null, 2));
  } catch {
    // best-effort; in-memory copy still works for the session
  }
}

/* ── Profiles ─────────────────────────────────────────── */
export function getProfile(id: string): Profile | undefined {
  return load().profiles.find((p) => p.id === id);
}
export function getProfileByEmail(email: string): Profile | undefined {
  return load().profiles.find((p) => p.email === email);
}
export function listProfiles(): Profile[] {
  return load().profiles;
}
export function upsertProfile(p: Profile): Profile {
  const db = load();
  const i = db.profiles.findIndex((x) => x.id === p.id);
  if (i >= 0) db.profiles[i] = p;
  else db.profiles.push(p);
  save();
  return p;
}

/* ── Campaigns ────────────────────────────────────────── */
export function listCampaigns(status?: Campaign["status"]): Campaign[] {
  const all = load().campaigns;
  return status ? all.filter((c) => c.status === status) : all;
}
export function getCampaign(id: string): Campaign | undefined {
  return load().campaigns.find((c) => c.id === id);
}
export function upsertCampaign(c: Campaign): Campaign {
  const db = load();
  const i = db.campaigns.findIndex((x) => x.id === c.id);
  if (i >= 0) db.campaigns[i] = c;
  else db.campaigns.push(c);
  save();
  return c;
}

/* ── Submissions ──────────────────────────────────────── */
export function listSubmissions(filter?: {
  campaignId?: string;
  profileId?: string;
}): Submission[] {
  let rows = load().submissions;
  if (filter?.campaignId) rows = rows.filter((s) => s.campaignId === filter.campaignId);
  if (filter?.profileId) rows = rows.filter((s) => s.profileId === filter.profileId);
  return rows;
}
export function getSubmissionByUrl(postUrl: string): Submission | undefined {
  return load().submissions.find((s) => s.postUrl === postUrl);
}
export function createSubmission(s: Submission): Submission {
  load().submissions.push(s);
  save();
  return s;
}
export function updateSubmission(
  id: string,
  patch: Partial<Submission>,
): Submission | undefined {
  const db = load();
  const i = db.submissions.findIndex((s) => s.id === id);
  if (i < 0) return undefined;
  db.submissions[i] = { ...db.submissions[i], ...patch };
  save();
  return db.submissions[i];
}

/* ── Payouts ──────────────────────────────────────────── */
export function listPayouts(filter?: {
  campaignId?: string;
  profileId?: string;
}): Payout[] {
  let rows = load().payouts;
  if (filter?.campaignId) rows = rows.filter((p) => p.campaignId === filter.campaignId);
  if (filter?.profileId) rows = rows.filter((p) => p.profileId === filter.profileId);
  return rows;
}
export function replacePayoutsForCampaign(campaignId: string, rows: Payout[]) {
  const db = load();
  db.payouts = db.payouts.filter((p) => p.campaignId !== campaignId).concat(rows);
  save();
}
export function updatePayout(
  id: string,
  patch: Partial<Payout>,
): Payout | undefined {
  const db = load();
  const i = db.payouts.findIndex((p) => p.id === id);
  if (i < 0) return undefined;
  db.payouts[i] = { ...db.payouts[i], ...patch };
  save();
  return db.payouts[i];
}
