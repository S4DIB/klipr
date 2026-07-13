import { NextResponse } from "next/server";
import { saveLead, type Lead, type LeadHandle } from "@/lib/leads";

/* Node runtime + always-dynamic: this writes to Postgres/disk, never cache it. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s()-]{6,20}$/;
const PLATFORMS = new Set(["tiktok", "facebook", "instagram", "youtube"]);
const KINDS = new Set(["page", "profile"]);
const MAX_HANDLES = 8;

function bad(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length >= 1 && t.length <= max ? t : null;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request.");
  }

  // Honeypot: a hidden form field real users never fill. If a bot fills it,
  // pretend success and drop it — no lead stored, no signal to the bot.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const email = String(body.email ?? "").trim().toLowerCase().normalize("NFC");
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return bad("Enter a valid email.");
  }

  // optional ad/campaign attribution — helps you see which ads convert
  const source = typeof body.source === "string" ? body.source.slice(0, 200) : undefined;

  let lead: Lead;

  if (body.role === "brand") {
    lead = { role: "brand", email, source, at: new Date().toISOString() };
  } else {
    const name = str(body.name, 100);
    if (!name) return bad("Enter your name.");

    const phone = str(body.phone, 20);
    if (!phone || !PHONE_RE.test(phone) || (phone.match(/\d/g)?.length ?? 0) < 7) {
      return bad("Enter a valid phone number.");
    }

    const category = str(body.category, 40);
    if (!category) return bad("Pick the category you clip in.");

    const raw = body.handles;
    if (!Array.isArray(raw) || raw.length < 1) {
      return bad("Add at least one social media handle.");
    }
    if (raw.length > MAX_HANDLES) {
      return bad(`No more than ${MAX_HANDLES} handles.`);
    }

    const handles: LeadHandle[] = [];
    for (const h of raw as Record<string, unknown>[]) {
      const platform = String(h.platform ?? "");
      const kind = String(h.kind ?? "");
      const handle = str(h.handle, 100);
      const followers = Number(h.followers);
      if (!PLATFORMS.has(platform)) return bad("Pick a platform for each handle.");
      if (!KINDS.has(kind)) return bad("Mark each handle as a page or a profile.");
      if (!handle) return bad("Fill in each handle you add.");
      if (!Number.isFinite(followers) || followers < 0 || followers > 1e9) {
        return bad("Enter a follower count for each handle.");
      }
      handles.push({ platform, handle, followers: Math.round(followers), kind });
    }

    lead = {
      role: "clipper",
      name,
      email,
      phone,
      category,
      handles,
      source,
      at: new Date().toISOString(),
    };
  }

  const result = await saveLead(lead);
  if (!result.ok) {
    // Extremely rare (disk + DB both unavailable). The lead is in the logs;
    // ask the visitor to retry rather than pretend it worked.
    return NextResponse.json({ error: "Something went wrong — try again." }, { status: 500 });
  }

  // Duplicate signups get the same success response — no email enumeration.
  return NextResponse.json({ ok: true });
}
