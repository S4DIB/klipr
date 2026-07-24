import { NextResponse } from "next/server";
import { runSweep } from "@/lib/verify/sweep";
import { serverEnv } from "@/lib/env.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The verification sweep — hit every ~15 minutes by Vercel cron (Pro) or an
 * external pinger (GitHub Actions / cron-job.org on Hobby). Idempotent, so
 * duplicate or overlapping pings are harmless. Requires CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = serverEnv.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const report = await runSweep();
  return NextResponse.json(report);
}
