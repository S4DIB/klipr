import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { listCampaignInvites, listCampaignsByAgency, listSubmissions } from "@/lib/db";
import { loadPublicClipper } from "@/lib/clippers/directory";
import { inviteStatus } from "@/lib/clippers/invite-rules";
import { acceptsSubmissions } from "@/lib/campaign-rules";
import { GlassPanel } from "@/components/app/glass-panel";
import { TierBadge } from "@/components/app/tier-badge";
import { StatusChip } from "@/components/app/status-chip";
import { PlatformGlyph } from "@/components/app/platform-glyph";
import { InviteSheet } from "@/components/app/invite-sheet";
import { IconChevronLeft, IconFire, IconTrophy } from "@/components/icons";
import { PLATFORMS } from "@/lib/platforms";
import { dhakaDate, views as fmtViews } from "@/lib/format";

export const metadata: Metadata = { title: "Clipper" };

/**
 * A clipper as an agency sees them: proof of delivery, standing, reach, fit —
 * and the invite action. Everything rendered comes from PublicClipper, the
 * whitelist in lib/clippers/stats; nothing private is loaded for this page.
 */
export default async function AgencyClipperPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("agency");
  const { id } = await params;
  const clipper = await loadPublicClipper(id);
  if (!clipper) notFound();

  const now = new Date().toISOString();
  const [myCampaigns, myInvites] = await Promise.all([
    listCampaignsByAgency(user.id),
    listCampaignInvites({ clipperProfileId: id, agencyProfileId: user.id }),
  ]);
  const live = myCampaigns.filter((c) => acceptsSubmissions(c, now));
  const invitedIds = new Set(myInvites.map((i) => i.campaignId));
  const invitable = live
    .filter((c) => !invitedIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, endsLabel: dhakaDate(c.endDate) }));
  // their clips on MY campaigns decide each invite's status; nothing else is shown
  const theirSubs = myInvites.length ? await listSubmissions({ profileId: id }) : [];
  const campaignName = new Map(myCampaigns.map((c) => [c.id, c.name]));

  const s = clipper.stats;
  const initial = (clipper.displayName || "K").trim().charAt(0).toUpperCase();
  const firstName = clipper.displayName.trim().split(/\s+/)[0] || clipper.displayName;
  const joined = new Date(clipper.joinedAt).toLocaleDateString("en-US", {
    timeZone: "Asia/Dhaka",
    month: "short",
    year: "numeric",
  });
  const stats = [
    { label: "Verified views", value: fmtViews(s.settledViews) },
    { label: "Per clip", value: s.clipsDelivered ? fmtViews(s.medianViewsPerClip) : "—" },
    { label: "Clips", value: String(s.clipsDelivered) },
    { label: "Campaigns", value: String(s.campaignsCompleted) },
    { label: "Qualify rate", value: s.qualifyRate === null ? "—" : `${Math.round(s.qualifyRate * 100)}%` },
  ];

  return (
    <div className="mx-auto w-full max-w-[480px] lg:max-w-none">
      <Link
        href="/agency/clippers"
        className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-600 transition-colors hover:text-ink-900"
      >
        <IconChevronLeft size={16} strokeWidth={1.4} /> Find clippers
      </Link>

      <div className="mt-[14px] flex flex-col gap-[14px] lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-5">
        <div className="flex min-w-0 flex-col gap-[14px]">
          {/* header — cover · avatar · name · standing · stats */}
          <GlassPanel className="overflow-hidden">
            <div className="field-cover relative h-[112px] sm:h-[148px]">
              {clipper.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={clipper.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : null}
            </div>

            <div className="relative px-5 pb-5 sm:px-7 sm:pb-6">
              <span className="absolute -top-[44px] left-5 flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full bg-volt-600 font-mono text-[32px] text-yellow shadow-[0_12px_28px_-10px_rgba(31,3,53,0.35)] ring-4 ring-white sm:-top-[52px] sm:left-7 sm:h-[104px] sm:w-[104px] sm:text-[38px]">
                {clipper.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={clipper.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  initial
                )}
              </span>
              <div className="min-h-[44px] sm:min-h-[52px]" />

              <h1 className="mt-2 text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink-900 sm:text-[26px]">
                {clipper.displayName}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <TierBadge tier={clipper.tier} />
                {clipper.rank ? (
                  <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 font-mono text-[11px] font-bold text-violet-700">
                    <IconTrophy size={11} strokeWidth={1.5} /> #{clipper.rank} on the leaderboard
                  </span>
                ) : null}
                {clipper.username ? (
                  <span className="text-[12.5px] text-ink-500">@{clipper.username}</span>
                ) : null}
                {clipper.streakWeeks > 0 ? (
                  <span className="flex items-center gap-1.5 text-[12px] font-bold text-warning-600">
                    <span className="flame" aria-hidden="true">
                      <IconFire size={15} strokeWidth={1.4} />
                    </span>
                    {clipper.streakWeeks}-week streak
                  </span>
                ) : null}
                <span className="text-[12.5px] text-ink-500">Joined {joined}</span>
              </div>
              {clipper.location || clipper.postLanguages ? (
                <p className="mt-2 text-[13px] text-ink-600">
                  {[clipper.location, clipper.postLanguages && `Posts in ${clipper.postLanguages}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}

              <div className="mt-5 grid grid-cols-3 gap-y-4 border-t border-[rgba(53,5,90,0.07)] pt-4 sm:grid-cols-5">
                {stats.map((st, i) => (
                  <div
                    key={st.label}
                    className={
                      "px-2 text-center sm:border-l sm:border-[rgba(53,5,90,0.07)]" +
                      (i === 0 ? " sm:border-l-0" : "")
                    }
                  >
                    <p className="font-mono text-[17px] font-bold tracking-[-0.02em] text-ink-900 [font-variant-numeric:tabular-nums] sm:text-[19px] xl:text-[21px]">
                      {st.value}
                    </p>
                    <p className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                      {st.label}
                    </p>
                  </div>
                ))}
              </div>
              {s.liveClips > 0 ? (
                <p className="mt-3 text-[12px] text-ink-500">
                  {s.liveClips} clip{s.liveClips === 1 ? "" : "s"} tracking right now.
                </p>
              ) : null}
            </div>
          </GlassPanel>

          {/* reach — the vetted pages they post from */}
          <GlassPanel className="p-5">
            <span className="eyebrow">Pages</span>
            {clipper.platforms.length === 0 ? (
              <p className="mt-2.5 text-[13.5px] text-ink-500">No pages connected yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-[rgba(53,5,90,0.06)]">
                {clipper.platforms.map((p) => (
                  <li key={`${p.platform}-${p.handle}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(53,5,90,0.05)] text-ink-700">
                      <PlatformGlyph platform={p.platform} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold text-ink-900">{p.handle}</span>
                      <span className="block text-[12px] text-ink-500">{PLATFORMS[p.platform].surface}</span>
                    </span>
                    {p.followerCount ? (
                      <span className="text-right">
                        <span className="block font-mono text-[14px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
                          {fmtViews(p.followerCount)}
                        </span>
                        <span className="block text-[11px] text-ink-500">followers</span>
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </GlassPanel>

          {/* fit */}
          <GlassPanel className="p-5">
            <span className="eyebrow">Posts about</span>
            {clipper.niches.length === 0 ? (
              <p className="mt-2.5 text-[13.5px] text-ink-500">No niches declared.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {clipper.niches.map((n) => (
                  <span key={n} className="glass-well rounded-full px-3 py-1.5 text-[12.5px] font-semibold text-ink-700">
                    {n}
                  </span>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>

        <div className="flex flex-col gap-[14px]">
          {/* the one ink surface — the action */}
          <GlassPanel variant="ink" className="p-5">
            <p className="eyebrow text-[rgba(255,255,244,0.6)]">Work with {firstName}</p>
            <p className="mt-2 text-[13.5px] leading-[1.55] text-[rgba(255,255,244,0.8)]">
              Invite them to one of your live campaigns. They get a notification linking to the
              brief; taking part means submitting a clip, so there&rsquo;s no back-and-forth.
            </p>
            <InviteSheet
              clipperId={clipper.id}
              clipperName={clipper.displayName}
              campaigns={invitable}
              liveCount={live.length}
              variant="highlight"
              className="mt-4"
            />
          </GlassPanel>

          {myInvites.length > 0 ? (
            <GlassPanel className="p-4">
              <span className="eyebrow">Your invites</span>
              <ul className="mt-2 flex flex-col gap-1">
                {myInvites.map((inv) => {
                  const status = inviteStatus(inv, theirSubs);
                  return (
                    <li key={inv.id}>
                      <Link
                        href={`/agency/campaigns/${inv.campaignId}`}
                        className="liftrow flex items-center justify-between gap-3 rounded-[12px] px-2.5 py-2.5"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[13.5px] font-semibold text-ink-900">
                            {campaignName.get(inv.campaignId) ?? "Campaign"}
                          </span>
                          <span className="block text-[11.5px] text-ink-500">
                            Invited {dhakaDate(inv.createdAt)}
                          </span>
                        </span>
                        <StatusChip
                          status={status === "submitted" ? "tracking" : "pending"}
                          label={status === "submitted" ? "Submitted" : "Invited"}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </GlassPanel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
