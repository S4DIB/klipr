import Link from "next/link";
import type { Metadata } from "next";
import { requireActiveClipper } from "@/lib/auth/guards";
import { listCampaigns } from "@/lib/db";
import { GlassPanel } from "@/components/app/glass-panel";
import { CampaignCover } from "@/components/app/campaign-cover";
import { EmptyState } from "@/components/app/empty-state";
import { IconTrophy, IconVerified } from "@/components/icons";
import { TikTokIcon, InstagramIcon, YouTubeIcon } from "@/components/ui/platform-icons";
import { PLATFORMS } from "@/lib/platforms";
import { takaFromPoisha, dhakaDate } from "@/lib/format";
import { isEarlyAccessLocked } from "@/lib/campaign-rules";
import { cn } from "@/lib/cn";
import type { Platform } from "@/lib/db/types";

export const metadata: Metadata = { title: "Campaigns" };

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "budget", label: "Biggest budget" },
  { key: "ending", label: "Ending soon" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

const PLATFORM_ICON: Partial<Record<Platform, (p: { className?: string }) => React.ReactNode>> = {
  youtube: YouTubeIcon,
  tiktok: TikTokIcon,
  instagram: InstagramIcon,
};

/** Deterministic brand-avatar fill so cards don't all look identical. */
const AVATAR_FILLS = ["bg-violet-600", "bg-violet-900", "bg-[#b3117d]", "bg-[#0b7a5e]"];
function avatarFill(seed: string): string {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i);
  return AVATAR_FILLS[n % AVATAR_FILLS.length];
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * The marketplace — a clean "discover" feed of live campaigns. Every clip
 * earns the same fixed rate; cards lead with the brand and the per-1M
 * headline. Early-access drops render as honest locked cards for lower tiers.
 */
export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const user = await requireActiveClipper();
  const { sort: sortParam, q: qParam } = await searchParams;
  const sort: SortKey = SORTS.some((s) => s.key === sortParam) ? (sortParam as SortKey) : "newest";
  const q = (qParam ?? "").trim();
  const needle = q.toLowerCase();
  const now = new Date().toISOString();

  const campaigns = (await listCampaigns("active")).filter(
    (c) =>
      !needle ||
      [c.name, c.brandName, c.niche].some((s) => s.toLowerCase().includes(needle)),
  );
  campaigns.sort((a, b) => {
    if (sort === "budget") return b.budgetPoisha - b.spentPoisha - (a.budgetPoisha - a.spentPoisha);
    if (sort === "ending") return a.endDate.localeCompare(b.endDate);
    return b.createdAt.localeCompare(a.createdAt);
  });
  const unlocked = campaigns.filter((c) => !isEarlyAccessLocked(c, user.tier, now));
  const locked = campaigns.filter((c) => isEarlyAccessLocked(c, user.tier, now));

  const sortHref = (key: SortKey) => {
    const p = new URLSearchParams();
    if (key !== "newest") p.set("sort", key);
    if (q) p.set("q", q);
    const s = p.toString();
    return s ? `/campaigns?${s}` : "/campaigns";
  };

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 lg:max-w-none">
      <header>
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink-900">
          Discover campaigns
        </h1>
        <p className="mt-0.5 text-[14px] text-ink-500">Join campaigns to start earning</p>
      </header>

      {/* sort pills */}
      <div className="flex flex-wrap gap-2">
        {SORTS.map((s) => {
          const active = sort === s.key;
          return (
            <Link
              key={s.key}
              href={sortHref(s.key)}
              className={cn(
                "rounded-full px-4 py-2 text-[13px] font-bold transition-colors",
                active
                  ? "bg-ink-900 text-white"
                  : "bg-white text-ink-600 shadow-[var(--shadow-xs)] hover:text-ink-900",
              )}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {unlocked.length === 0 && locked.length === 0 ? (
        <GlassPanel>
          <EmptyState
            title={q ? `No campaigns match “${q}”` : "No live campaigns right now"}
            line={
              q
                ? "Try a different campaign name, brand, or niche."
                : "New campaigns are announced here first. Check back soon."
            }
          />
        </GlassPanel>
      ) : (
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-3">
          {unlocked.map((c) => (
            <Link key={c.id} href={`/campaigns/${c.id}`} className="block h-full">
              <GlassPanel interactive className="flex h-full flex-col gap-4 p-5">
                {/* cover — real clip art, or an on-brand placeholder for now */}
                <CampaignCover
                  coverUrl={c.coverUrl}
                  seed={c.id}
                  className="-mx-5 -mt-5"
                />

                {/* brand row */}
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-[17px] font-extrabold text-white",
                      avatarFill(c.brandName),
                    )}
                  >
                    {c.brandName.trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-[15px] font-bold text-ink-900">
                      <span className="truncate">{c.brandName}</span>
                      <IconVerified size={14} strokeWidth={1.6} className="shrink-0 text-violet-500" />
                    </p>
                    <p className="text-[12px] text-ink-500">
                      {timeAgo(c.createdAt)} · {c.niche}
                    </p>
                  </div>
                </div>

                {/* campaign title */}
                <p className="text-[15px] font-semibold leading-snug text-ink-800">{c.name}</p>

                {/* footer: platforms + headline rate */}
                <div className="mt-auto flex items-end justify-between gap-3 border-t border-[rgba(53,5,90,0.07)] pt-4">
                  <div className="flex items-center gap-2 text-ink-700">
                    {c.allowedPlatforms.map((p) => {
                      const Icon = PLATFORM_ICON[p];
                      return Icon ? (
                        <Icon key={p} className="h-[18px] w-[18px]" />
                      ) : (
                        <span key={p} className="text-[11px] text-ink-500">
                          {PLATFORMS[p].label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[22px] font-bold leading-none text-ink-900 [font-variant-numeric:tabular-nums]">
                      {takaFromPoisha(c.rateClipperPer1k * 1000)}
                    </p>
                    <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-400">
                      per 1M views
                    </p>
                  </div>
                </div>
              </GlassPanel>
            </Link>
          ))}

          {locked.map((c) => (
            <GlassPanel key={c.id} className="flex h-full flex-col gap-4 p-5 opacity-90">
              <CampaignCover
                coverUrl={c.coverUrl}
                seed={c.id}
                locked
                className="-mx-5 -mt-5"
              />
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-ink-150 text-[17px] font-extrabold text-ink-400">
                  {c.brandName.trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-ink-500">{c.brandName}</p>
                  <p className="text-[12px] text-ink-400">{c.niche}</p>
                </div>
                <span className="ml-auto flex shrink-0 items-center gap-[5px] whitespace-nowrap rounded-full bg-violet-100 px-[9px] py-[5px] text-[11px] font-bold text-violet-700">
                  <IconTrophy size={13} strokeWidth={1.4} />
                  Early access
                </span>
              </div>
              <p className="text-[15px] font-semibold leading-snug text-ink-500">{c.name}</p>
              <p className="mt-auto border-t border-[rgba(53,5,90,0.07)] pt-4 text-[12.5px] leading-[1.5] text-ink-500">
                Opens to all tiers{" "}
                <span className="font-bold text-ink-700">
                  {c.earlyAccessEndsAt ? dhakaDate(c.earlyAccessEndsAt) : "soon"}
                </span>
                . Reach <span className="font-bold capitalize text-violet-700">{c.earlyAccessTier}</span>{" "}
                to see new campaigns first.
              </p>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
