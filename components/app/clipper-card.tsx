import Link from "next/link";
import { GlassPanel } from "@/components/app/glass-panel";
import { TierBadge } from "@/components/app/tier-badge";
import { PlatformGlyph } from "@/components/app/platform-glyph";
import { views as fmtViews } from "@/lib/format";
import { PLATFORMS } from "@/lib/platforms";
import type { PublicClipper } from "@/lib/clippers/stats";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-mono text-[15px] font-bold tracking-[-0.02em] text-ink-900 [font-variant-numeric:tabular-nums]">
        {value}
      </p>
      <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
        {label}
      </p>
    </div>
  );
}

/**
 * One clipper in the directory grid — a people-search card: cover band, avatar
 * straddling the edge, name + tier + rank, then the three numbers an agency
 * scans for and the pages they can post from. The whole card links through.
 */
export function ClipperCard({ clipper: c }: { clipper: PublicClipper }) {
  const initial = (c.displayName || "K").trim().charAt(0).toUpperCase();
  const hasPages = c.platforms.length > 0;

  return (
    <Link href={`/agency/clippers/${c.id}`} className="block h-full">
      <GlassPanel interactive className="flex h-full flex-col overflow-hidden">
        {/* cover band — their own photo, else the brand gradient */}
        <div className="field-cover relative h-[72px]">
          {c.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          {c.rank ? (
            <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 font-mono text-[11px] font-bold text-violet-700 shadow-[var(--shadow-xs)]">
              #{c.rank}
            </span>
          ) : null}
        </div>

        <div className="relative flex flex-1 flex-col px-4 pb-4">
          <span className="absolute -top-7 left-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-volt-600 font-mono text-[20px] text-yellow ring-4 ring-white">
            {c.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              initial
            )}
          </span>
          <div className="min-h-[30px]" />

          <p className="mt-1 truncate text-[15px] font-extrabold tracking-[-0.01em] text-ink-900">
            {c.displayName}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-500">
            <TierBadge tier={c.tier} size="sm" />
            {c.username ? <span className="truncate">@{c.username}</span> : null}
            {c.location ? <span className="truncate">· {c.location}</span> : null}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[rgba(53,5,90,0.07)] pt-3">
            <Stat value={fmtViews(c.stats.settledViews)} label="Verified views" />
            <Stat
              value={c.stats.clipsDelivered ? fmtViews(c.stats.medianViewsPerClip) : "—"}
              label="Per clip"
            />
            <Stat value={String(c.stats.clipsDelivered)} label="Clips" />
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
            {c.platforms.map((p) => (
              <span
                key={`${p.platform}-${p.handle}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(53,5,90,0.05)] px-2 py-1 text-[11px] font-semibold text-ink-600"
                title={`${p.handle} · ${PLATFORMS[p.platform].label}`}
              >
                <PlatformGlyph platform={p.platform} className="h-3 w-3" />
                {p.followerCount ? fmtViews(p.followerCount) : PLATFORMS[p.platform].label}
              </span>
            ))}
            {c.niches.slice(0, 2).map((n) => (
              <span
                key={n}
                className="rounded-full border border-[rgba(53,5,90,0.1)] px-2 py-1 text-[11px] text-ink-500"
              >
                {n}
              </span>
            ))}
            {!hasPages && c.niches.length === 0 ? (
              <span className="text-[11px] text-ink-400">No pages connected yet</span>
            ) : null}
          </div>
        </div>
      </GlassPanel>
    </Link>
  );
}
