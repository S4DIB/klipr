import { NextResponse } from "next/server";
import { hasSupabase } from "@/lib/env";
import { submitClip } from "@/app/(app)/campaigns/[id]/actions";

/**
 * DEV ONLY — drives the real submitClip server action for QA scripts:
 * /dev-submit?campaignId=…&accountId=…&url=… (uses the caller's session).
 * Hard-disabled outside development or when Supabase is configured.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development" || hasSupabase) {
    return new NextResponse("Not found", { status: 404 });
  }
  const u = new URL(request.url);
  const fd = new FormData();
  fd.set("campaignId", u.searchParams.get("campaignId") ?? "");
  fd.set("accountId", u.searchParams.get("accountId") ?? "");
  fd.set("postUrl", u.searchParams.get("url") ?? "");
  const result = await submitClip({}, fd);
  return NextResponse.json(result);
}
