import { NextResponse } from "next/server";
import { saveLead, type Lead, type LeadPage } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s()-]{6,20}$/;
const MAX_PAGES = 8;

function bad(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length >= 1 && t.length <= max ? t : null;
}

function validPhone(phone: string | null): phone is string {
  return !!phone && PHONE_RE.test(phone) && (phone.match(/\d/g)?.length ?? 0) >= 7;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request.");
  }

  // Honeypot: a hidden field real users never fill. Bot → pretend success, drop it.
  if (typeof body.contact_time === "string" && body.contact_time.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const email = String(body.email ?? "").trim().toLowerCase().normalize("NFC");
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return bad("Enter a valid email.");
  }

  const name = str(body.name, 100);
  if (!name) return bad("Enter your name.");

  const phone = str(body.phone, 20);
  if (!validPhone(phone)) return bad("Enter a valid phone number.");

  const source = typeof body.source === "string" ? body.source.slice(0, 200) : undefined;
  const at = new Date().toISOString();

  let lead: Lead;

  if (body.role === "brand") {
    const company = str(body.company, 100);
    if (!company) return bad("Enter your company name.");
    const designation = str(body.designation, 80);
    if (!designation) return bad("Enter your role.");
    lead = { role: "brand", name, email, phone, company, designation, source, at };
  } else {
    const raw = body.pages;
    if (!Array.isArray(raw) || raw.length < 1) {
      return bad("Add at least one page.");
    }
    if (raw.length > MAX_PAGES) {
      return bad(`No more than ${MAX_PAGES} pages.`);
    }
    const pages: LeadPage[] = [];
    for (const p of raw as Record<string, unknown>[]) {
      const link = str(p.link, 200);
      const niche = str(p.niche, 40);
      if (!link) return bad("Paste a link for each page.");
      if (!niche) return bad("Pick a niche for each page.");
      pages.push({ link, niche });
    }
    const postFrequency = str(body.postFrequency, 40);
    if (!postFrequency) return bad("Tell us how often you post.");
    lead = { role: "clipper", name, email, phone, pages, postFrequency, source, at };
  }

  const result = await saveLead(lead);
  if (!result.ok) {
    return NextResponse.json({ error: "Something went wrong — try again." }, { status: 500 });
  }
  // Duplicate signups get the same success response — no email enumeration.
  return NextResponse.json({ ok: true });
}
