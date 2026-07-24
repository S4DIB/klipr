/**
 * Durable waitlist-lead capture. SERVER ONLY (uses node:fs + the Supabase
 * service-role key — never import from a Client Component).
 *
 * Persistence: Supabase `waitlist_leads` is the only durable store. The local
 * file is a best-effort dev store / transient insurance (wiped on redeploy),
 * so it is never reported as "success" when Supabase is meant to persist:
 *   - Supabase OK          → ok:true (durable)
 *   - Supabase FAILS       → ok:false → the route 500s so the visitor RETRIES;
 *       the full lead is logged (recoverable) + written to disk best-effort.
 *   - Supabase NOT set up  → ok:true (dev), written to file, always logged.
 */
import fs from "node:fs";
import path from "node:path";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

/** One page a clipper runs — paste-a-link + a niche chosen per page (spec §8). */
export type LeadPage = { link: string; niche: string };

export type LeadReviewStatus = "pending" | "approved" | "declined";

export type Lead = {
  email: string;
  role: "clipper" | "brand";
  name?: string;
  phone?: string;
  pages?: LeadPage[]; // clipper
  postFrequency?: string; // clipper
  company?: string; // brand
  designation?: string; // brand
  source?: string;
  at: string; // ISO timestamp
  /** Vetting decision from /admin/applications. Absent = pending. */
  status?: LeadReviewStatus;
  declineReason?: string;
  reviewedAt?: string;
};

export type SaveResult = {
  ok: boolean;
  store: "supabase" | "file" | "log";
  duplicate: boolean;
};

const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const hasSupabaseService = Boolean(
  hasSupabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "waitlist.json");

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase().normalize("NFC");
}

function logRecoverable(lead: Lead, reason: string, err?: unknown) {
  console.error(
    `[leads] LEAD_NOT_IN_DB reason=${reason} payload=${JSON.stringify(lead)}`,
    err ?? "",
  );
}

/* ── file store (dev / best-effort insurance) ── */

function readFile(): Lead[] {
  if (!fs.existsSync(FILE)) return [];
  try {
    const rows = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return Array.isArray(rows) ? (rows as Lead[]) : [];
  } catch {
    try {
      const bak = `${FILE}.corrupt-${Date.now()}`;
      fs.renameSync(FILE, bak);
      console.error(`[leads] corrupt ${FILE} moved to ${bak}`);
    } catch {
      /* ignore */
    }
    return [];
  }
}

function writeFileAtomic(rows: Lead[]) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2));
  fs.renameSync(tmp, FILE);
}

function saveToFile(lead: Lead): boolean {
  const rows = readFile();
  const dup = rows.some((r) => r.email === lead.email);
  if (!dup) {
    rows.push(lead);
    writeFileAtomic(rows);
  }
  return !dup;
}

/* ── optional forward to an email tool / automation (Zapier, Make, Loops…) ── */

async function forwardToWebhook(lead: Lead): Promise<void> {
  const url = process.env.LEADS_WEBHOOK_URL;
  if (!url) return;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
      signal: ctrl.signal,
    }).finally(() => clearTimeout(t));
  } catch {
    /* best-effort */
  }
}

/* ── Supabase insert ──
 * Pages are stored in the jsonb `handles` column (schemaless, no migration).
 * company / designation / post_frequency are columns added by migration 0003 —
 * if that migration hasn't run yet, the first insert errors on the unknown
 * columns, so we retry with ONLY the guaranteed columns. Capture never breaks;
 * the extra fields simply start saving once 0003 is applied. */
async function insertToSupabase(lead: Lead): Promise<void> {
  const sb = createSupabaseAdmin();
  const core = {
    email: lead.email,
    role: lead.role,
    name: lead.name ?? null,
    phone: lead.phone ?? null,
    handles: lead.pages ?? [],
    source: lead.source ?? null,
  };
  const full = {
    ...core,
    company: lead.company ?? null,
    designation: lead.designation ?? null,
    post_frequency: lead.postFrequency ?? null,
  };
  const opts = { onConflict: "email", ignoreDuplicates: true } as const;

  const { error } = await sb.from("waitlist_leads").upsert(full, opts);
  if (!error) return;
  // Likely the 0003 columns don't exist yet — retry with core columns only.
  console.warn("[leads] full insert failed, retrying core columns (run migration 0003?):", error.message);
  const retry = await sb.from("waitlist_leads").upsert(core, opts);
  if (retry.error) throw retry.error;
}

/* ── public API ── */

export async function saveLead(lead: Lead): Promise<SaveResult> {
  const normalized: Lead = { ...lead, email: normalizeEmail(lead.email) };
  const webhook = forwardToWebhook(normalized);

  if (hasSupabaseService) {
    try {
      await insertToSupabase(normalized);
      await webhook;
      return { ok: true, store: "supabase", duplicate: false };
    } catch (e) {
      logRecoverable(normalized, "supabase-write-failed", e);
      try {
        saveToFile(normalized);
      } catch {
        /* logged already */
      }
      await webhook;
      return { ok: false, store: "log", duplicate: false };
    }
  }

  logRecoverable(normalized, hasSupabaseUrl ? "service-role-key-missing" : "no-durable-db");
  let isNew = true;
  try {
    isNew = saveToFile(normalized);
  } catch (e) {
    console.error("[leads] file write failed:", e);
  }
  await webhook;
  return { ok: true, store: "file", duplicate: !isNew };
}

export async function listLeads(): Promise<Lead[]> {
  const byEmail = new Map<string, Lead>();

  if (hasSupabaseService) {
    try {
      const sb = createSupabaseAdmin();
      const { data, error } = await sb
        .from("waitlist_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      for (const r of data ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row = r as any;
        byEmail.set(row.email, {
          email: row.email,
          role: row.role,
          name: row.name ?? undefined,
          phone: row.phone ?? undefined,
          pages: Array.isArray(row.handles) ? row.handles : [],
          postFrequency: row.post_frequency ?? undefined,
          company: row.company ?? undefined,
          designation: row.designation ?? undefined,
          source: row.source ?? undefined,
          at: row.created_at,
          status: row.status ?? undefined,
          declineReason: row.decline_reason ?? undefined,
          reviewedAt: row.reviewed_at ?? undefined,
        });
      }
    } catch (e) {
      console.error("[leads] supabase read failed:", e);
    }
  }

  for (const r of readFile()) {
    const existing = byEmail.get(r.email);
    if (!existing) {
      byEmail.set(r.email, r);
    } else if (!existing.status && r.status) {
      // review decision landed in the file store (Supabase columns missing) —
      // carry it over so the queue reflects it
      existing.status = r.status;
      existing.declineReason = r.declineReason;
      existing.reviewedAt = r.reviewedAt;
    }
  }

  return [...byEmail.values()].sort((a, b) => (a.at < b.at ? 1 : -1));
}

export async function getLeadByEmail(email: string): Promise<Lead | undefined> {
  const normalized = normalizeEmail(email);
  return (await listLeads()).find((l) => l.email === normalized);
}

/**
 * Record the admin's vetting decision on a waitlist lead. Supabase first
 * (columns from migration 0005); falls back to the file store so a decision
 * is never lost in dev or before the migration runs.
 */
export async function updateLeadReview(
  email: string,
  review: { status: "approved" | "declined"; declineReason?: string },
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const reviewedAt = new Date().toISOString();

  if (hasSupabaseService) {
    try {
      const sb = createSupabaseAdmin();
      const { error } = await sb
        .from("waitlist_leads")
        .update({
          status: review.status,
          decline_reason: review.declineReason ?? null,
          reviewed_at: reviewedAt,
        })
        .eq("email", normalized);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn(
        "[leads] review update failed (run migration 0005?), falling back to file:",
        e,
      );
    }
  }

  const rows = readFile();
  let row = rows.find((r) => r.email === normalized);
  if (!row) {
    // lead exists only in Supabase — mirror it into the file so the decision sticks
    const known = await getLeadByEmail(normalized);
    if (!known) return false;
    row = { ...known };
    rows.push(row);
  }
  row.status = review.status;
  row.declineReason = review.declineReason;
  row.reviewedAt = reviewedAt;
  writeFileAtomic(rows);
  return true;
}
