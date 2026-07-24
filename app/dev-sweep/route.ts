import { NextResponse } from "next/server";
import { hasSupabase } from "@/lib/env";
import { runSweep } from "@/lib/verify/sweep";

/**
 * DEV ONLY — time-travel sweep for QA: /dev-sweep?at=2026-07-30T00:00:00Z
 * runs the sweep as if at that instant (settles windows that would have
 * closed by then). Hard-disabled outside development / with Supabase.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development" || hasSupabase) {
    return new NextResponse("Not found", { status: 404 });
  }
  const at = new URL(request.url).searchParams.get("at");
  const when = at ? new Date(at) : new Date();
  if (Number.isNaN(when.getTime())) {
    return NextResponse.json({ error: "bad `at` timestamp" }, { status: 400 });
  }
  const report = await runSweep(when);
  return NextResponse.json(report);
}
