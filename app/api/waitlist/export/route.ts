import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { listLeads, type Lead } from "@/lib/leads";

/* Node runtime + never cached: this returns the private lead list. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Constant-time token check (avoids leaking the token via timing). */
function tokenOk(provided: string | null): boolean {
  const secret = process.env.WAITLIST_EXPORT_TOKEN;
  if (!secret || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function csvCell(v: unknown): string {
  let s = v == null ? "" : String(v);
  // Neutralize CSV/formula injection: a lead-submitted value starting with
  // = + - @ (or tab/CR) executes as a formula when opened in Excel/Sheets.
  // Prefix with an apostrophe so it's treated as literal text.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  // Always quote + escape embedded quotes; keep data otherwise intact.
  return `"${s.replace(/"/g, '""')}"`;
}

function handlesText(handles?: Lead["handles"]): string {
  if (!handles || handles.length === 0) return "";
  return handles
    .map((h) => `${h.platform}:${h.handle} (${h.kind}, ${h.followers} followers)`)
    .join(" | ");
}

export async function GET(req: Request) {
  // If no token is configured, the export is simply off (not discoverable).
  if (!process.env.WAITLIST_EXPORT_TOKEN) {
    return NextResponse.json({ error: "Export not configured." }, { status: 404 });
  }

  const url = new URL(req.url);
  const provided = url.searchParams.get("token") ?? req.headers.get("x-export-token");
  if (!tokenOk(provided)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const leads = await listLeads();

  const header = ["created_at", "role", "email", "name", "phone", "category", "handles", "source"];
  const lines = [header.map(csvCell).join(",")];
  for (const l of leads) {
    lines.push(
      [
        l.at,
        l.role,
        l.email,
        l.name ?? "",
        l.phone ?? "",
        l.category ?? "",
        handlesText(l.handles),
        l.source ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
  }
  // Prepend a UTF-8 BOM so Excel opens accented names/emojis correctly.
  const csv = "﻿" + lines.join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="klipr-leads-${stamp}.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
