import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { listLeads } from "@/lib/leads";
import { leadsToCsv } from "@/lib/leads/csv";

/* Admin-only lead export. Unlike /api/waitlist/export (token-gated, for
 * external automation), this reuses the admin session — the same gate as the
 * rest of /admin — so a signed-in admin downloads with one click, no token. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "admin") {
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
