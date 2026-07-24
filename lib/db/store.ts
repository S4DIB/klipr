/**
 * Local persistence — a JSON-file-backed store so the app runs with ZERO
 * external accounts (stub mode). Same async-ish surface as the Supabase
 * implementation; selected by lib/db/index.ts. Server-only.
 *
 * V3 store: reseeds automatically when the on-disk version ≠ 3 (dev data is
 * disposable). Seed identities are all "Demo …" — honest, stub-only.
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
  Platform,
} from "./types.ts";
import { RATE_BRAND_PER_1K, RATE_CLIPPER_PER_1K } from "./types.ts";
import type { LedgerDraft } from "../ledger.ts";
import { simulatedViews } from "../verify/simulated.ts";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

const now = () => new Date().toISOString();
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400_000).toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export function newId(prefix: string) {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

/* ────────────────────────── seed ────────────────────────── */

function seed(): DB {
  const profiles: Profile[] = [
    {
      id: "usr_admin", email: "admin@klipr.app", displayName: "Demo Admin",
      role: "admin", access: "active", tier: "beginner", xpTotal: 0, streakWeeks: 0,
      nidStatus: "none", leaderboardOptOut: true, accountStatus: "active",
      profileCompleted: true, onboardingStep: 99, createdAt: now(),
    },
    {
      id: "usr_brand", email: "brand@klipr.app", displayName: "Demo Brand Manager",
      role: "brand", access: "active", tier: "beginner", xpTotal: 0, streakWeeks: 0,
      nidStatus: "none", orgName: "Demo Aila Active", leaderboardOptOut: true,
      accountStatus: "active", profileCompleted: true, onboardingStep: 99, createdAt: now(),
    },
    {
      id: "usr_clipper", email: "clipper@klipr.app", displayName: "Demo Clipper",
      role: "clipper", access: "active", tier: "beginner", xpTotal: 92, streakWeeks: 1,
      bkashNumber: "01712345678", nidStatus: "none", leaderboardOptOut: false,
      accountStatus: "active", profileCompleted: true, onboardingStep: 99, createdAt: hoursAgo(240),
    },
    {
      id: "usr_agency", email: "agency@klipr.app", displayName: "Demo Network Manager",
      role: "agency", access: "active", tier: "beginner", xpTotal: 0, streakWeeks: 0,
      bkashNumber: "01898765432", nidStatus: "none", orgName: "Demo Dhaka Clips Network",
      leaderboardOptOut: false, accountStatus: "active", profileCompleted: true,
      onboardingStep: 99, createdAt: hoursAgo(200),
    },
    {
      id: "usr_waitlist", email: "applicant@klipr.app", displayName: "Demo Applicant",
      role: "clipper", access: "waitlisted", tier: "beginner", xpTotal: 0, streakWeeks: 0,
      nidStatus: "none", leaderboardOptOut: false, accountStatus: "active",
      profileCompleted: false, onboardingStep: 0, createdAt: hoursAgo(30),
    },
    {
      // Fresh vetted clipper — nothing set up yet, so the "Get set up to earn"
      // checklist shows in full on their dashboard.
      id: "usr_newbie", email: "newbie@klipr.app", displayName: "Demo New Clipper",
      role: "clipper", access: "active", tier: "beginner", xpTotal: 0, streakWeeks: 0,
      nidStatus: "none", leaderboardOptOut: false, accountStatus: "active",
      profileCompleted: true, onboardingStep: 99, createdAt: hoursAgo(2),
    },
  ];

  const applications: Application[] = [
    {
      id: "app_clipper", profileId: "usr_clipper", role: "clipper",
      note: "I post meme clips daily, usually evenings. Two pages, both mine.",
      status: "approved", reviewedBy: "usr_admin", reviewedAt: hoursAgo(230),
      createdAt: hoursAgo(240),
    },
    {
      id: "app_agency", profileId: "usr_agency", role: "agency",
      note: "We run a small network of niche pages across IG and YouTube.",
      status: "approved", reviewedBy: "usr_admin", reviewedAt: hoursAgo(190),
      createdAt: hoursAgo(200),
    },
    {
      id: "app_wait", profileId: "usr_waitlist", role: "clipper",
      note: "Posting 4-5 times a week on my food page. Views are organic.",
      status: "submitted", createdAt: hoursAgo(30),
    },
  ];

  const applicationPages: ApplicationPage[] = [
    {
      id: "apg_cl_yt", applicationId: "app_clipper", platform: "youtube",
      handle: "@democlips", url: "https://www.youtube.com/@democlips",
      selfReportedFollowers: 12400, niche: "Memes", vetStatus: "approved",
      vetChecklist: { activeRecently: true, postingCadence: true, realEngagement: true },
    },
    {
      id: "apg_cl_tt", applicationId: "app_clipper", platform: "tiktok",
      handle: "@democlips", url: "https://www.tiktok.com/@democlips",
      selfReportedFollowers: 8300, niche: "Memes", vetStatus: "approved",
      vetChecklist: { activeRecently: true, postingCadence: true, realEngagement: true },
    },
    {
      id: "apg_ag_ig", applicationId: "app_agency", platform: "instagram",
      handle: "@dhakaclips", url: "https://www.instagram.com/dhakaclips",
      selfReportedFollowers: 45000, niche: "Entertainment", vetStatus: "approved",
      vetChecklist: { activeRecently: true, postingCadence: true, realEngagement: true },
    },
    {
      id: "apg_ag_yt", applicationId: "app_agency", platform: "youtube",
      handle: "@dhakaclipsyt", url: "https://www.youtube.com/@dhakaclipsyt",
      selfReportedFollowers: 9100, niche: "Entertainment", vetStatus: "approved",
      vetChecklist: { activeRecently: true, postingCadence: true, realEngagement: true },
    },
    {
      id: "apg_w_fb", applicationId: "app_wait", platform: "facebook",
      handle: "Demo Food BD", url: "https://www.facebook.com/demofoodbd",
      selfReportedFollowers: 22000, niche: "Food", vetStatus: "pending",
    },
    {
      id: "apg_w_yt", applicationId: "app_wait", platform: "youtube",
      handle: "@demofoodbd", url: "https://www.youtube.com/@demofoodbd",
      selfReportedFollowers: 3100, niche: "Food", vetStatus: "pending",
    },
  ];

  const connectedAccounts: ConnectedAccount[] = [
    {
      id: "acc_cl_yt", profileId: "usr_clipper", platform: "youtube",
      applicationPageId: "apg_cl_yt", externalId: "UCdemo00000000000000001",
      handle: "@democlips", displayName: "Demo Clips", followerCount: 12400,
      proof: "simulated", status: "active", createdAt: hoursAgo(228),
    },
    {
      id: "acc_cl_tt", profileId: "usr_clipper", platform: "tiktok",
      applicationPageId: "apg_cl_tt", externalId: "tt_demo_000001",
      handle: "@democlips", displayName: "Demo Clips", followerCount: 8300,
      proof: "simulated", status: "active", createdAt: hoursAgo(228),
    },
    {
      id: "acc_ag_ig", profileId: "usr_agency", platform: "instagram",
      applicationPageId: "apg_ag_ig", externalId: "ig_demo_000001",
      handle: "@dhakaclips", displayName: "Dhaka Clips", followerCount: 45000,
      proof: "simulated", status: "active", createdAt: hoursAgo(188),
    },
    {
      id: "acc_ag_yt", profileId: "usr_agency", platform: "youtube",
      applicationPageId: "apg_ag_yt", externalId: "UCdemo00000000000000002",
      handle: "@dhakaclipsyt", displayName: "Dhaka Clips YT", followerCount: 9100,
      proof: "simulated", status: "active", createdAt: hoursAgo(188),
    },
  ];

  const baseCampaign = {
    brandProfileId: "usr_brand",
    rateClipperPer1k: RATE_CLIPPER_PER_1K,
    rateBrandPer1k: RATE_BRAND_PER_1K,
    maxPayoutPerClipperPoisha: 500_000, // ৳5,000
    trackingWindowDays: 7,
    createdAt: hoursAgo(220),
  };

  const campaigns: Campaign[] = [
    {
      ...baseCampaign,
      id: "cmp_eid", name: "Demo Eid drop teaser", brandName: "Demo Aila Active",
      brief: "Post the supplied teaser clip as-is. Hook is in the first 2 seconds.",
      guidelines: "Do not alter the logo. No competitor brands in frame.",
      niche: "Fashion", allowedPlatforms: ["tiktok", "youtube"] as Platform[],
      sourceUrl: "https://example.com/assets/demo-eid.mp4",
      budgetPoisha: 4_000_000, spentPoisha: 25_200,
      minQualifyViews: 2000, submissionCapBase: 1,
      startDate: hoursAgo(240), endDate: daysFromNow(14),
      status: "active" as CampaignStatus, fundedAt: hoursAgo(236),
    },
    {
      ...baseCampaign,
      id: "cmp_music", name: "Demo single rollout", brandName: "Demo Northbeat Records",
      brief: "Post the supplied 15s cut. Caption with the song name.",
      guidelines: "Audio must stay original. Credit @northbeat in the caption.",
      niche: "Music", allowedPlatforms: ["youtube", "tiktok"] as Platform[],
      sourceUrl: "https://example.com/assets/demo-single.mp4",
      budgetPoisha: 7_500_000, spentPoisha: 0,
      minQualifyViews: 3000, submissionCapBase: 2,
      startDate: hoursAgo(120), endDate: daysFromNow(21),
      status: "active" as CampaignStatus, fundedAt: hoursAgo(118),
    },
    {
      ...baseCampaign,
      id: "cmp_tech", name: "Demo app launch", brandName: "Demo Orbit App",
      brief: "Post the supplied feature demo clip to your page.",
      guidelines: "Show the app on screen. Keep the supplied caption hashtags.",
      niche: "Tech", allowedPlatforms: ["tiktok", "youtube", "instagram"] as Platform[],
      sourceUrl: "https://example.com/assets/demo-orbit.mp4",
      budgetPoisha: 5_000_000, spentPoisha: 0,
      minQualifyViews: 2000, submissionCapBase: 1,
      earlyAccessTier: "pro" as const, earlyAccessEndsAt: daysFromNow(3),
      startDate: hoursAgo(48), endDate: daysFromNow(18),
      status: "active" as CampaignStatus, fundedAt: hoursAgo(46),
    },
    {
      ...baseCampaign,
      id: "cmp_pending", name: "Demo top story recaps", brandName: "Demo Pulse Daily",
      brief: "Post the daily recap clip.",
      guidelines: "Factual only. Use the supplied footage.",
      niche: "News", allowedPlatforms: ["youtube"] as Platform[],
      sourceUrl: "https://example.com/assets/demo-pulse.mp4",
      budgetPoisha: 2_500_000, spentPoisha: 0,
      minQualifyViews: 2000, submissionCapBase: 1,
      startDate: now(), endDate: daysFromNow(10),
      status: "pending_funding" as CampaignStatus,
    },
  ];

  /**
   * Tracking submissions live on the SAME simulated curves the sweep polls,
   * so the seed→sweep handoff is continuous (no fake velocity spikes).
   */
  const TT_ID = "7300000000000000001"; // cap ≈ 59.6k — comfortably above cmp_music's 3k minimum
  const YT_ID = "demoVid0002"; // cap ≈ 71.9k, steep organic knee
  const ttAge = 48; // hours since submission
  const ytAge = 24;
  const ttBase = simulatedViews(TT_ID, 0);
  const ytBase = simulatedViews(YT_ID, 0);
  const ttLatest = simulatedViews(TT_ID, ttAge);
  const ytLatest = simulatedViews(YT_ID, ytAge);

  const submissions: Submission[] = [
    {
      id: "sub_settled", campaignId: "cmp_eid", profileId: "usr_clipper",
      connectedAccountId: "acc_cl_yt", platform: "youtube",
      postUrl: "https://www.youtube.com/shorts/demoVid0001", mediaId: "demoVid0001",
      baselineViews: 150, latestViews: 4350, countedViews: 4200,
      lockedViews: 4200, earnedPoisha: 21_000, xpAwarded: 92,
      status: "settled" as SubmissionStatus,
      submittedAt: hoursAgo(216), windowEndsAt: hoursAgo(48), settledAt: hoursAgo(47),
    },
    {
      id: "sub_track_tt", campaignId: "cmp_music", profileId: "usr_clipper",
      connectedAccountId: "acc_cl_tt", platform: "tiktok",
      postUrl: "https://www.tiktok.com/@democlips/video/7300000000000000001",
      mediaId: TT_ID,
      baselineViews: ttBase, latestViews: ttLatest,
      countedViews: Math.max(0, ttLatest - ttBase),
      status: "tracking" as SubmissionStatus,
      submittedAt: hoursAgo(ttAge), windowEndsAt: daysFromNow(5),
    },
    {
      id: "sub_track_yt", campaignId: "cmp_music", profileId: "usr_clipper",
      connectedAccountId: "acc_cl_yt", platform: "youtube",
      postUrl: "https://www.youtube.com/shorts/demoVid0002", mediaId: YT_ID,
      baselineViews: ytBase, latestViews: ytLatest,
      countedViews: Math.max(0, ytLatest - ytBase),
      status: "tracking" as SubmissionStatus,
      submittedAt: hoursAgo(ytAge), windowEndsAt: daysFromNow(6),
    },
  ];

  /** Snapshot series along the real curve: age 0 … ageNow, every 6h. */
  const curveSnaps = (submissionId: string, mediaId: string, ageNow: number): ViewSnapshot[] => {
    const rows: ViewSnapshot[] = [];
    for (let age = 0, i = 0; age <= ageNow; age += 6, i++) {
      rows.push({
        id: `snp_${submissionId}_${i}`,
        submissionId,
        views: simulatedViews(mediaId, age),
        source: "simulated" as const,
        capturedAt: hoursAgo(ageNow - age),
      });
    }
    return rows;
  };

  const viewSnapshots: ViewSnapshot[] = [
    // historical, settled clip — static series (never re-polled)
    ...[216, 192, 168, 144, 120, 96, 72, 48].map((h, i) => ({
      id: `snp_sub_settled_${i}`,
      submissionId: "sub_settled",
      views: [150, 620, 1400, 2300, 3100, 3800, 4200, 4350][i],
      source: "simulated" as const,
      capturedAt: hoursAgo(h),
    })),
    ...curveSnaps("sub_track_tt", TT_ID, ttAge),
    ...curveSnaps("sub_track_yt", YT_ID, ytAge),
  ];

  const xpEvents: XpEvent[] = [
    {
      id: "xp_settled_views", profileId: "usr_clipper", connectedAccountId: "acc_cl_yt",
      submissionId: "sub_settled", campaignId: "cmp_eid",
      amount: 42, reason: "views", createdAt: hoursAgo(47),
    },
    {
      id: "xp_settled_completion", profileId: "usr_clipper", connectedAccountId: "acc_cl_yt",
      submissionId: "sub_settled", campaignId: "cmp_eid",
      amount: 50, reason: "completion_bonus", createdAt: hoursAgo(47),
    },
  ];

  // Zero-sum ledger history matching the world above.
  const L = (
    id: string, eventId: string, eventType: LedgerEntry["eventType"], account: string,
    amountPoisha: number, refs: Partial<LedgerEntry>, createdAt: string,
  ): LedgerEntry => ({ id, eventId, eventType, account, amountPoisha, createdAt, ...refs });

  const ledgerEntries: LedgerEntry[] = [
    // escrow funding for the three active campaigns
    L("led_f1a", "fund:cmp_eid", "escrow_funding", "external", -4_000_000, { campaignId: "cmp_eid" }, hoursAgo(236)),
    L("led_f1b", "fund:cmp_eid", "escrow_funding", "escrow:cmp_eid", 4_000_000, { campaignId: "cmp_eid" }, hoursAgo(236)),
    L("led_f2a", "fund:cmp_music", "escrow_funding", "external", -7_500_000, { campaignId: "cmp_music" }, hoursAgo(118)),
    L("led_f2b", "fund:cmp_music", "escrow_funding", "escrow:cmp_music", 7_500_000, { campaignId: "cmp_music" }, hoursAgo(118)),
    L("led_f3a", "fund:cmp_tech", "escrow_funding", "external", -5_000_000, { campaignId: "cmp_tech" }, hoursAgo(46)),
    L("led_f3b", "fund:cmp_tech", "escrow_funding", "escrow:cmp_tech", 5_000_000, { campaignId: "cmp_tech" }, hoursAgo(46)),
    // the one settled clip: 4,200 views → clipper ৳210, brand cost ৳252, margin ৳42
    L("led_s1a", "settle:sub_settled", "settlement", "escrow:cmp_eid", -25_200,
      { campaignId: "cmp_eid", submissionId: "sub_settled", profileId: "usr_clipper" }, hoursAgo(47)),
    L("led_s1b", "settle:sub_settled", "settlement", "clipper:usr_clipper", 21_000,
      { campaignId: "cmp_eid", submissionId: "sub_settled", profileId: "usr_clipper" }, hoursAgo(47)),
    L("led_s1c", "settle:sub_settled", "settlement", "margin", 4_200,
      { campaignId: "cmp_eid", submissionId: "sub_settled", profileId: "usr_clipper" }, hoursAgo(47)),
  ];

  return {
    profiles,
    applications,
    applicationPages,
    connectedAccounts,
    campaigns,
    submissions,
    viewSnapshots,
    xpEvents,
    ledgerEntries,
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
