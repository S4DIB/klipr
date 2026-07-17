/**
 * Lead → CSV. Shared by the token-gated public export route and the
 * admin-session download, so the injection-hardening lives in one place.
 * SERVER ONLY (imported by routes that already read the private lead list).
 */
import type { Lead } from "@/lib/leads";

function csvCell(v: unknown): string {
  let s = v == null ? "" : String(v);
  // Neutralize CSV/formula injection: a lead-submitted value starting with
  // = + - @ (or tab/CR) executes as a formula when opened in Excel/Sheets.
  // Prefix with an apostrophe so it's treated as literal text.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  // Always quote + escape embedded quotes; keep data otherwise intact.
  return `"${s.replace(/"/g, '""')}"`;
}

function pagesText(pages?: Lead["pages"]): string {
  if (!pages || pages.length === 0) return "";
  return pages.map((p) => `${p.link} (${p.niche})`).join(" | ");
}

const HEADER = [
  "created_at", "role", "email", "name", "phone",
  "company", "designation", "pages", "post_frequency", "source",
];

/** Build an Excel-safe CSV (UTF-8 BOM, CRLF, formula-injection neutralized). */
export function leadsToCsv(leads: Lead[]): string {
  const lines = [HEADER.map(csvCell).join(",")];
  for (const l of leads) {
    lines.push(
      [
        l.at,
        l.role,
        l.email,
        l.name ?? "",
        l.phone ?? "",
        l.company ?? "",
        l.designation ?? "",
        pagesText(l.pages),
        l.postFrequency ?? "",
        l.source ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
  }
  // Prepend a UTF-8 BOM so Excel opens accented names/emojis correctly.
  return "﻿" + lines.join("\r\n");
}
