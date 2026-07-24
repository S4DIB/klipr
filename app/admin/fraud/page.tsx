import type { Metadata } from "next";
import {
  getConnectedAccount,
  getProfile,
  getSubmission,
  listFraudFlags,
} from "@/lib/db";
import { GlassPanel } from "@/components/app/glass-panel";
import { StatusChip } from "@/components/app/status-chip";
import { EmptyState } from "@/components/app/empty-state";
import { views as fmtViews, dhakaDateTime } from "@/lib/format";
import { releaseHold, upholdHold } from "./actions";

export const metadata: Metadata = { title: "Fraud · Admin" };

export default async function AdminFraudPage() {
  const open = await listFraudFlags({ status: "open" });
  const resolved = (await listFraudFlags())
    .filter((f) => f.status !== "open")
    .slice(-8)
    .reverse();

  const cases = await Promise.all(
    open.map(async (flag) => {
      const sub = await getSubmission(flag.submissionId);
      const profile = sub ? await getProfile(sub.profileId) : undefined;
      const account = sub ? await getConnectedAccount(sub.connectedAccountId) : undefined;
      return { flag, sub, profile, account };
    }),
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">04 / Fraud holds</p>
        <h1 className="display-1 mt-1 text-[32px] text-text-hi">Held for review.</h1>
        <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-text-mid">
          Held clips keep counting but can never settle. Release resumes
          tracking; uphold rejects the clip, resets the streak, and taints the
          clean record Pro/Elite require.
        </p>
      </header>

      {cases.length === 0 ? (
        <GlassPanel>
          <EmptyState title="Nothing needs you" line="Automatic checks haven't held anything." />
        </GlassPanel>
      ) : (
        cases.map(({ flag, sub, profile, account }) => {
          const detail = JSON.parse(flag.detail || "{}") as Record<string, number | string>;
          return (
            <GlassPanel key={flag.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <StatusChip status="held" />
                    <span className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-text-mid">
                      {flag.rule.replace("_", " ")}
                    </span>
                    <span className="text-[12px] text-text-low">{dhakaDateTime(flag.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-[14.5px] font-medium text-text-hi">
                    {profile?.displayName ?? "Unknown"} · {account?.handle ?? "?"}
                  </p>
                  {sub && (
                    <p className="mt-0.5 text-[12.5px] text-text-mid">
                      {fmtViews(sub.countedViews)} counted views ·{" "}
                      <a
                        href={sub.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-volt-500 underline decoration-[rgba(125,4,215,0.35)] underline-offset-2"
                      >
                        open post ↗
                      </a>
                    </p>
                  )}
                  <div className="glass-well mt-3 inline-block px-3.5 py-2 font-mono text-[11.5px] text-text-mid">
                    {Object.entries(detail)
                      .map(([k, v]) => `${k}: ${typeof v === "number" ? v.toLocaleString("en-US") : v}`)
                      .join(" · ")}
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <form action={releaseHold}>
                    <input type="hidden" name="flagId" value={flag.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-[rgba(10,143,79,0.12)] px-4 py-2 text-[13px] font-semibold text-ok transition-colors hover:bg-[rgba(10,143,79,0.2)]"
                    >
                      Release · resume tracking
                    </button>
                  </form>
                  <form action={upholdHold}>
                    <input type="hidden" name="flagId" value={flag.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-[rgba(255,123,192,0.16)] px-4 py-2 text-[13px] font-semibold text-text-hi transition-colors hover:bg-[rgba(255,123,192,0.28)]"
                    >
                      Uphold · reject clip
                    </button>
                  </form>
                </div>
              </div>
            </GlassPanel>
          );
        })
      )}

      {resolved.length > 0 && (
        <section className="space-y-3">
          <p className="eyebrow">Recently resolved</p>
          <GlassPanel className="divide-y divide-[rgba(53,5,90,0.06)] p-3">
            {resolved.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-4 px-3 py-3">
                <span className="font-mono text-[12px] text-text-mid">
                  {f.rule.replace("_", " ")} · {f.submissionId}
                </span>
                <StatusChip status={f.status} />
              </div>
            ))}
          </GlassPanel>
        </section>
      )}
    </div>
  );
}
