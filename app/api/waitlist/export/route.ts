import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { listLeads } from "@/lib/leads";
import { leadsToCsv } from "@/lib/leads/csv";

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
  const csv = leadsToCsv(leads);

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
