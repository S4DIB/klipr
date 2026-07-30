import type { Metadata } from "next";
import { getProfile, listConnectedAccounts, listVettedPagesForProfile } from "@/lib/db";
import { GlassPanel } from "@/components/app/glass-panel";
import { StatusChip } from "@/components/app/status-chip";
import { EmptyState } from "@/components/app/empty-state";
import { PLATFORMS } from "@/lib/platforms";
import { dhakaDateTime } from "@/lib/format";
import { approveAccount, rejectAccount } from "./actions";

export const metadata: Metadata = { title: "Accounts · Admin" };

/** Manual ownership approval for connected pages (no platform API). */
export default async function AdminAccountsPage() {
  const all = await listConnectedAccounts();
  const pending = all.filter((a) => a.status === "pending");
  const recent = all
    .filter((a) => a.status !== "pending" && a.verifiedAt)
    .sort((a, b) => (b.verifiedAt ?? "").localeCompare(a.verifiedAt ?? ""))
    .slice(0, 8);

  const cases = await Promise.all(
    pending.map(async (acc) => {
      const [profile, pages] = await Promise.all([
        getProfile(acc.profileId),
        listVettedPagesForProfile(acc.profileId),
      ]);
      return { acc, profile, page: pages.find((p) => p.id === acc.applicationPageId) };
    }),
  );

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">02 / Account verification</p>
        <h1 className="display-1 mt-1 text-[32px] text-text-hi">Confirm ownership.</h1>
        <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-text-mid">
          Clippers connect a vetted page; approve it once you&rsquo;ve confirmed the page is
          really theirs. Only approved accounts can submit clips.
        </p>
      </header>

      {cases.length === 0 ? (
        <GlassPanel>
          <EmptyState title="Nothing to verify" line="New connected accounts show up here." />
        </GlassPanel>
      ) : (
        cases.map(({ acc, profile, page }) => (
          <GlassPanel key={acc.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <StatusChip status="pending" />
                  <span className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-text-mid">
                    {PLATFORMS[acc.platform].label}
                  </span>
                  <span className="text-[12px] text-text-low">{dhakaDateTime(acc.createdAt)}</span>
                </div>
                <p className="mt-2 text-[14.5px] font-medium text-text-hi">
                  {profile?.displayName ?? "Unknown"} · {acc.handle}
                </p>
                <p className="mt-0.5 text-[12.5px] text-text-mid">
                  {acc.followerCount != null
                    ? `${acc.followerCount.toLocaleString("en-US")} followers · `
                    : ""}
                  {page?.niche ? `${page.niche} · ` : ""}
                  {page?.url ? (
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-volt-500 underline decoration-[rgba(125,4,215,0.35)] underline-offset-2"
                    >
                      open page ↗
                    </a>
                  ) : null}
                </p>
              </div>
              <div className="flex gap-2.5">
                <form action={approveAccount}>
                  <input type="hidden" name="accountId" value={acc.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-[rgba(10,143,79,0.12)] px-4 py-2 text-[13px] font-semibold text-ok transition-colors hover:bg-[rgba(10,143,79,0.2)]"
                  >
                    Approve
                  </button>
                </form>
                <form action={rejectAccount}>
                  <input type="hidden" name="accountId" value={acc.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-[rgba(255,123,192,0.16)] px-4 py-2 text-[13px] font-semibold text-text-hi transition-colors hover:bg-[rgba(255,123,192,0.28)]"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </div>
          </GlassPanel>
        ))
      )}

      {recent.length > 0 && (
        <section className="space-y-3">
          <p className="eyebrow">Recently decided</p>
          <GlassPanel className="divide-y divide-[rgba(53,5,90,0.06)] p-3">
            {recent.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-4 px-3 py-3">
                <span className="font-mono text-[12px] text-text-mid">
                  {PLATFORMS[a.platform].label} · {a.handle}
                </span>
                <StatusChip status={a.status} />
              </div>
            ))}
          </GlassPanel>
        </section>
      )}
    </div>
  );
}
