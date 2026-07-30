/**
 * Local persistence — a JSON-file-backed store so the app runs with ZERO
 * external accounts (stub mode). Same async-ish surface as the Supabase
 * implementation; selected by lib/db/index.ts. Server-only.
 *
 * Reseeds automatically when the on-disk version ≠ 4 (dev data is disposable).
 * The stub boots an EMPTY store — no demo data (see GO-LIVE-PLAN.md).
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  DB,
  Profile,
  Application,
  ApplicationPage,
  ConnectedAccount,
  Campaign,
  Submission,
  ViewSnapshot,
  XpEvent,
  LedgerEntry,
  PayoutBatch,
  FraudFlag,
  CampaignStatus,
  SubmissionStatus,
} from "./types.ts";
import type { LedgerDraft } from "../ledger.ts";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

const now = () => new Date().toISOString();

export function newId(prefix: string) {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

/* ────────────────────────── seed ────────────────────────── */

function seed(): DB {
  // Production runs on Supabase; the local stub boots an EMPTY, honest store.
  // No demo data — every account, campaign, and clip is created through the
  // real flows. See GO-LIVE-PLAN.md.
  return {
    profiles: [],
    applications: [],
    applicationPages: [],
    connectedAccounts: [],
    campaigns: [],
    submissions: [],
    viewSnapshots: [],
    xpEvents: [],
    ledgerEntries: [],
    payoutBatches: [],
    fraudFlags: [],
    sweepLocks: [],
    version: 4,
  };
}

/* ────────────────────────── load / save ────────────────────────── */

const g = globalThis as unknown as { __klipr_db?: DB };

function load(): DB {
  if (g.__klipr_db) return g.__klipr_db;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as DB;
      if (parsed.version === 4) {
        g.__klipr_db = parsed;
        return g.__klipr_db;
      }
      console.warn("[store] .data/db.json is not v4 — reseeding (dev data is disposable)");
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
    // best-effort; the in-memory copy still works for the session
  }
}

/* ── Profiles ─────────────────────────────────────────── */
export function getProfile(id: string): Profile | undefined {
  return load().profiles.find((p) => p.id === id);
}
export function getProfileByEmail(email: string): Profile | undefined {
  return load().profiles.find((p) => p.email === email);
}
export function listProfiles(role?: Profile["role"]): Profile[] {
  const all = load().profiles;
  return role ? all.filter((p) => p.role === role) : all;
}
export function upsertProfile(p: Profile): Profile {
  const db = load();
  const i = db.profiles.findIndex((x) => x.id === p.id);
  if (i >= 0) db.profiles[i] = p;
  else db.profiles.push(p);
  save();
  return p;
}
export function updateProfile(id: string, patch: Partial<Profile>): Profile | undefined {
  const db = load();
  const i = db.profiles.findIndex((p) => p.id === id);
  if (i < 0) return undefined;
  db.profiles[i] = { ...db.profiles[i], ...patch };
  save();
  return db.profiles[i];
}

/* ── Applications ─────────────────────────────────────── */
export function createApplication(app: Application, pages: ApplicationPage[]): Application {
  const db = load();
  db.applications.push(app);
  db.applicationPages.push(...pages);
  save();
  return app;
}
export function listApplications(status?: Application["status"]): Application[] {
  const all = load().applications;
  const rows = status ? all.filter((a) => a.status === status) : all;
  return [...rows].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export function getApplication(id: string): Application | undefined {
  return load().applications.find((a) => a.id === id);
}
export function latestApplicationForProfile(profileId: string): Application | undefined {
  return [...load().applications]
    .filter((a) => a.profileId === profileId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}
export function updateApplication(id: string, patch: Partial<Application>): Application | undefined {
  const db = load();
  const i = db.applications.findIndex((a) => a.id === id);
  if (i < 0) return undefined;
  db.applications[i] = { ...db.applications[i], ...patch };
  save();
  return db.applications[i];
}
export function listApplicationPages(applicationId: string): ApplicationPage[] {
  return load().applicationPages.filter((p) => p.applicationId === applicationId);
}
export function updateApplicationPage(id: string, patch: Partial<ApplicationPage>): ApplicationPage | undefined {
  const db = load();
  const i = db.applicationPages.findIndex((p) => p.id === id);
  if (i < 0) return undefined;
  db.applicationPages[i] = { ...db.applicationPages[i], ...patch };
  save();
  return db.applicationPages[i];
}
/** Approved (vetted) pages across a profile's applications — the connectable set. */
export function listVettedPagesForProfile(profileId: string): ApplicationPage[] {
  const db = load();
  const appIds = new Set(db.applications.filter((a) => a.profileId === profileId).map((a) => a.id));
  return db.applicationPages.filter((p) => appIds.has(p.applicationId) && p.vetStatus === "approved");
}

/* ── Connected accounts ───────────────────────────────── */
export function listConnectedAccounts(profileId?: string): ConnectedAccount[] {
  const all = load().connectedAccounts;
  return profileId ? all.filter((a) => a.profileId === profileId) : all;
}
export function getConnectedAccount(id: string): ConnectedAccount | undefined {
  return load().connectedAccounts.find((a) => a.id === id);
}
export function upsertConnectedAccount(a: ConnectedAccount): ConnectedAccount {
  const db = load();
  const i = db.connectedAccounts.findIndex((x) => x.id === a.id);
  if (i >= 0) db.connectedAccounts[i] = a;
  else db.connectedAccounts.push(a);
  save();
  return a;
}
export function updateConnectedAccount(
  id: string,
  patch: Partial<ConnectedAccount>,
): ConnectedAccount | undefined {
  const db = load();
  const i = db.connectedAccounts.findIndex((a) => a.id === id);
  if (i < 0) return undefined;
  db.connectedAccounts[i] = { ...db.connectedAccounts[i], ...patch };
  save();
  return db.connectedAccounts[i];
}

/* ── Campaigns ────────────────────────────────────────── */
export function listCampaigns(status?: CampaignStatus): Campaign[] {
  const all = load().campaigns;
  return status ? all.filter((c) => c.status === status) : all;
}
export function listCampaignsByBrand(brandProfileId: string): Campaign[] {
  return load().campaigns.filter((c) => c.brandProfileId === brandProfileId);
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
export function updateCampaign(id: string, patch: Partial<Campaign>): Campaign | undefined {
  const db = load();
  const i = db.campaigns.findIndex((c) => c.id === id);
  if (i < 0) return undefined;
  db.campaigns[i] = { ...db.campaigns[i], ...patch };
  save();
  return db.campaigns[i];
}

/* ── Submissions ──────────────────────────────────────── */
export function listSubmissions(filter?: {
  campaignId?: string;
  profileId?: string;
  status?: SubmissionStatus;
}): Submission[] {
  let rows = load().submissions;
  if (filter?.campaignId) rows = rows.filter((s) => s.campaignId === filter.campaignId);
  if (filter?.profileId) rows = rows.filter((s) => s.profileId === filter.profileId);
  if (filter?.status) rows = rows.filter((s) => s.status === filter.status);
  return rows;
}
export function getSubmission(id: string): Submission | undefined {
  return load().submissions.find((s) => s.id === id);
}
export function getSubmissionByUrl(postUrl: string): Submission | undefined {
  return load().submissions.find((s) => s.postUrl === postUrl);
}
export function findSubmissionByMedia(campaignId: string, mediaId: string): Submission | undefined {
  return load().submissions.find((s) => s.campaignId === campaignId && s.mediaId === mediaId);
}
export function createSubmission(s: Submission): Submission {
  load().submissions.push(s);
  save();
  return s;
}
export function updateSubmission(id: string, patch: Partial<Submission>): Submission | undefined {
  const db = load();
  const i = db.submissions.findIndex((s) => s.id === id);
  if (i < 0) return undefined;
  db.submissions[i] = { ...db.submissions[i], ...patch };
  save();
  return db.submissions[i];
}
/** Tracking submissions whose window has ended — the settle set. */
export function listSubmissionsDue(nowIso: string): Submission[] {
  return load().submissions.filter((s) => s.status === "tracking" && s.windowEndsAt <= nowIso);
}
/** Tracking submissions still inside their window — the poll set. */
export function listSubmissionsPolling(nowIso: string): Submission[] {
  return load().submissions.filter(
    (s) => (s.status === "tracking" || s.status === "held") && s.windowEndsAt > nowIso,
  );
}
export function listPendingSubmissions(): Submission[] {
  return load().submissions.filter((s) => s.status === "pending");
}

/* ── View snapshots ───────────────────────────────────── */
export function appendSnapshots(rows: ViewSnapshot[]): void {
  if (!rows.length) return;
  load().viewSnapshots.push(...rows);
  save();
}
export function listSnapshots(submissionId: string): ViewSnapshot[] {
  return load()
    .viewSnapshots.filter((v) => v.submissionId === submissionId)
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
}

/* ── XP ───────────────────────────────────────────────── */
export function appendXpEvents(rows: XpEvent[]): void {
  if (!rows.length) return;
  load().xpEvents.push(...rows);
  save();
}
export function listXpEvents(profileId: string): XpEvent[] {
  return load().xpEvents.filter((e) => e.profileId === profileId);
}
/** Per-connected-account XP totals — the agency portfolio view. */
export function xpByAccount(profileId: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of load().xpEvents) {
    if (e.profileId !== profileId || !e.connectedAccountId) continue;
    out[e.connectedAccountId] = (out[e.connectedAccountId] ?? 0) + e.amount;
  }
  return out;
}

/* ── Ledger ───────────────────────────────────────────── */
/**
 * Append one zero-sum event. Idempotent: if ANY (eventId, account) row
 * already exists the whole event is skipped and `inserted:false` returns.
 */
export function appendLedgerEvent(drafts: LedgerDraft[]): { inserted: boolean } {
  if (!drafts.length) return { inserted: false };
  const db = load();
  const exists = db.ledgerEntries.some((e) =>
    drafts.some((d) => d.eventId === e.eventId && d.account === e.account),
  );
  if (exists) return { inserted: false };
  const ts = now();
  db.ledgerEntries.push(
    ...drafts.map((d) => ({ ...d, id: newId("led"), createdAt: ts })),
  );
  save();
  return { inserted: true };
}
export function listLedger(filter?: { account?: string; profileId?: string }): LedgerEntry[] {
  let rows = load().ledgerEntries;
  if (filter?.account) rows = rows.filter((e) => e.account === filter.account);
  if (filter?.profileId) rows = rows.filter((e) => e.profileId === filter.profileId);
  return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function ledgerBalance(account: string): number {
  return load().ledgerEntries.reduce(
    (acc, e) => (e.account === account ? acc + e.amountPoisha : acc),
    0,
  );
}

/* ── Payout batches ───────────────────────────────────── */
export function createPayoutBatch(b: PayoutBatch): PayoutBatch {
  load().payoutBatches.push(b);
  save();
  return b;
}
export function listPayoutBatches(filter?: {
  profileId?: string;
  status?: PayoutBatch["status"];
}): PayoutBatch[] {
  let rows = load().payoutBatches;
  if (filter?.profileId) rows = rows.filter((b) => b.profileId === filter.profileId);
  if (filter?.status) rows = rows.filter((b) => b.status === filter.status);
  return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function updatePayoutBatch(id: string, patch: Partial<PayoutBatch>): PayoutBatch | undefined {
  const db = load();
  const i = db.payoutBatches.findIndex((b) => b.id === id);
  if (i < 0) return undefined;
  db.payoutBatches[i] = { ...db.payoutBatches[i], ...patch };
  save();
  return db.payoutBatches[i];
}

/* ── Fraud flags ──────────────────────────────────────── */
export function createFraudFlag(f: FraudFlag): FraudFlag {
  load().fraudFlags.push(f);
  save();
  return f;
}
export function listFraudFlags(filter?: {
  status?: FraudFlag["status"];
  submissionId?: string;
}): FraudFlag[] {
  let rows = load().fraudFlags;
  if (filter?.status) rows = rows.filter((f) => f.status === filter.status);
  if (filter?.submissionId) rows = rows.filter((f) => f.submissionId === filter.submissionId);
  return rows;
}
export function updateFraudFlag(id: string, patch: Partial<FraudFlag>): FraudFlag | undefined {
  const db = load();
  const i = db.fraudFlags.findIndex((f) => f.id === id);
  if (i < 0) return undefined;
  db.fraudFlags[i] = { ...db.fraudFlags[i], ...patch };
  save();
  return db.fraudFlags[i];
}

/* ── Leaderboard ──────────────────────────────────────── */
export interface LeaderboardRow {
  profileId: string;
  displayName: string;
  tier: Profile["tier"];
  settledViews: number;
}
/** Top earners by settled verified views — opt-outs and blocked users excluded. */
export function leaderboard(limit = 20): LeaderboardRow[] {
  const db = load();
  const byProfile = new Map<string, number>();
  for (const s of db.submissions) {
    if (s.status !== "settled" || !s.lockedViews) continue;
    byProfile.set(s.profileId, (byProfile.get(s.profileId) ?? 0) + s.lockedViews);
  }
  const rows: LeaderboardRow[] = [];
  for (const [profileId, settledViews] of byProfile) {
    const p = db.profiles.find((x) => x.id === profileId);
    if (!p || p.leaderboardOptOut || p.accountStatus !== "active") continue;
    if (p.role !== "clipper" && p.role !== "agency") continue;
    rows.push({ profileId, displayName: p.displayName, tier: p.tier, settledViews });
  }
  return rows.sort((a, b) => b.settledViews - a.settledViews).slice(0, limit);
}

/* ── Sweep lock ───────────────────────────────────────── */
/** Unique-insert overlap guard. True = lock acquired (run the sweep). */
export function acquireSweepLock(key: string): boolean {
  const db = load();
  if (db.sweepLocks.includes(key)) return false;
  db.sweepLocks.push(key);
  // keep the list from growing unboundedly
  if (db.sweepLocks.length > 200) db.sweepLocks = db.sweepLocks.slice(-100);
  save();
  return true;
}
