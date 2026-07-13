import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DATA_DIR, "waitlist.json");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PLATFORMS = new Set(["tiktok", "facebook", "instagram", "youtube"]);
const KINDS = new Set(["page", "profile"]);
const MAX_HANDLES = 8;

type Handle = {
  platform: string;
  handle: string;
  followers: number;
  kind: string;
};

type Entry =
  | { role: "brand"; email: string; at: string }
  | {
      role: "clipper";
      name: string;
      email: string;
      phone: string;
      category: string;
      handles: Handle[];
      at: string;
    };

const PHONE_RE = /^\+?[\d\s()-]{6,20}$/;

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

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return bad("Enter a valid email.");
  }

  let entry: Entry;

  if (body.role === "brand") {
    entry = { role: "brand", email, at: new Date().toISOString() };
  } else {
    const name = str(body.name, 100);
    if (!name) return bad("Enter your name.");

    const phone = str(body.phone, 20);
    if (!phone || !PHONE_RE.test(phone)) {
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

    const handles: Handle[] = [];
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

    entry = {
      role: "clipper",
      name,
      email,
      phone,
      category,
      handles,
      at: new Date().toISOString(),
    };
  }

  const entries: Entry[] = fs.existsSync(FILE)
    ? (JSON.parse(fs.readFileSync(FILE, "utf8")) as Entry[])
    : [];

  if (!entries.some((e) => e.email === email)) {
    entries.push(entry);
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(entries, null, 2));
  }

  // Duplicate signups get the same success response — no email enumeration.
  return NextResponse.json({ ok: true });
}
