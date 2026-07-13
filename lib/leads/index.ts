/**
 * Durable waitlist-lead capture. SERVER ONLY (uses node:fs + the Supabase
 * service-role key — never import from a Client Component).
 *
 * Truth in advertising: the ONLY durable store is Supabase. The local file is a
 * best-effort dev store / transient insurance — it is wiped on redeploy and not
 * shared across replicas, so it is never treated as "success" when Supabase is
 * supposed to be handling persistence:
 *
 *   - Supabase configured + write OK  → ok:true  (durable)
 *   - Supabase configured + write FAILS → ok:false → the route 500s so the
 *       visitor RETRIES (into the recovered DB) instead of being lied to; the
 *       full lead is also logged (recoverable) + best-effort written to disk.
 *   - Supabase NOT configured (dev / not-yet-set-up) → ok:true, written to the
 *       file, and ALWAYS logged with the full payload so it's recoverable.
 *
 * So a lead is never *silently* lost: if it isn't durably in Postgres, either
 * the visitor is asked to retry or the full payload is in the deploy logs.
 */
import fs from "node:fs";
import path from "node:path";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type LeadHandle = {
  platform: string;
  handle: string;
  followers: number;
  kind: string;
};

export type Lead = {
  email: string;
  role: "clipper" | "brand";
  name?: string;
  phone?: string;
  category?: string;
  handles?: LeadHandle[];
  source?: string;
  at: string; // ISO timestamp
};

export type SaveResult = {
  ok: boolean;
  store: "supabase" | "file" | "log";
  duplicate: boolean;
};

const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
/** service-role writes need the URL *and* the secret key. */
const hasSupabaseService = Boolean(
  hasSupabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "waitlist.json");

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase().normalize("NFC");
}

/** Full payload on one greppable line, so a non-durable lead is recoverable
 *  from the Coolify/host deploy logs. */
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
    // Corrupt/partial file: preserve it (don't let the next write clobber the
    // rows it still contains) by moving it aside for manual recovery.
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

/** Atomic write: temp file + rename, so a crash mid-write can't corrupt the store. */
function writeFileAtomic(rows: Lead[]) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2));
  fs.renameSync(tmp, FILE);
}

/** Append to the file store, deduped by email. Returns whether it was new. */
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
    // best-effort: the lead is already durably stored; the webhook is a bonus
  }
}

/* ── public API ── */

/**
 * Persist one lead. Resolves `{ ok:false }` (never throws) when Supabase is
 * configured but the durable write fails, so the caller can 500 → the visitor
 * retries rather than being falsely told it worked.
 */
export async function saveLead(lead: Lead): Promise<SaveResult> {
  const normalized: Lead = { ...lead, email: normalizeEmail(lead.email) };
  const webhook = forwardToWebhook(normalized);

  if (hasSupabaseService) {
    try {
      const sb = createSupabaseAdmin();
      // first-touch upsert: re-signups return no error and don't clobber the original
      const { error } = await sb.from("waitlist_leads").upsert(
        {
          email: normalized.email,
          role: normalized.role,
          name: normalized.name ?? null,
          phone: normalized.phone ?? null,
          category: normalized.category ?? null,
          handles: normalized.handles ?? [],
          source: normalized.source ?? null,
        },
        { onConflict: "email", ignoreDuplicates: true },
      );
      if (error) throw error;
      await webhook;
      return { ok: true, store: "supabase", duplicate: false };
    } catch (e) {
      // Configured but the durable store failed — do NOT report success.
      logRecoverable(normalized, "supabase-write-failed", e);
      try {
        saveToFile(normalized);
      } catch {
        /* disk also unavailable; the payload is already in the logs */
      }
      await webhook;
      return { ok: false, store: "log", duplicate: false };
    }
  }

  // Supabase not configured for leads (local dev, or a prod misconfig). Signups
  // still work, but the file is ephemeral — so always log the full payload too.
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

/**
 * All leads, newest first. Supabase is the authoritative source; any local
 * file rows (dev, or a Supabase-outage window on THIS instance) are merged in
 * as a courtesy — they are not a cross-replica guarantee, so during an outage
 * rely on the deploy-log payloads for a complete picture.
 */
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
          category: row.category ?? undefined,
          handles: Array.isArray(row.handles) ? row.handles : [],
          source: row.source ?? undefined,
          at: row.created_at,
        });
      }
    } catch (e) {
      console.error("[leads] supabase read failed:", e);
    }
  }

  for (const r of readFile()) {
    if (!byEmail.has(r.email)) byEmail.set(r.email, r);
  }

  return [...byEmail.values()].sort((a, b) => (a.at < b.at ? 1 : -1));
}
