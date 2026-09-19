import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { loadClipperDirectory } from "@/lib/clippers/directory";
import {
  DIRECTORY_SORTS,
  filterClippers,
  normalizePlatform,
  normalizeSort,
  normalizeTier,
  sortClippers,
} from "@/lib/clippers/stats";
import { ClipperCard } from "@/components/app/clipper-card";
import { GlassPanel } from "@/components/app/glass-panel";
import { EmptyState } from "@/components/app/empty-state";
import { IconSearch } from "@/components/icons";
import { NICHES, PLATFORM_ORDER, PLATFORMS } from "@/lib/platforms";
import { TIER_ORDER } from "@/lib/xp";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Find clippers" };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Pill({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-pressed={on}
      className={cn(
        "rounded-full px-4 py-2 text-[13px] font-bold transition-colors",
        on ? "bg-ink-900 text-white" : "bg-white text-ink-600 shadow-[var(--shadow-xs)] hover:text-ink-900",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * The clipper directory — every vetted, onboarded clipper on Klipr, searchable
 * the way an agency thinks (name, handle, city, niche) and filterable by tier
 * and platform. Server-rendered from the URL: the search form is a plain GET,
 * so it works without JS and every view is a shareable link.
 */
export default async function FindClippersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tier?: string; platform?: string; niche?: string; sort?: string }>;
}) {
  await requireRole("agency");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const tier = normalizeTier(sp.tier);
  const platform = normalizePlatform(sp.platform);
  const niche = (NICHES as readonly string[]).includes(sp.niche ?? "") ? sp.niche : undefined;
  const sort = normalizeSort(sp.sort);

  const all = await loadClipperDirectory();
  const list = sortClippers(filterClippers(all, { q, tier, platform, niche }), sort);
  const filtered = Boolean(q || tier || platform || niche);

  const hrefWith = (patch: Record<string, string | undefined>) => {
    const merged: Record<string, string | undefined> = {
      q,
      tier,
      platform,
      niche,
      sort: sort === "views" ? undefined : sort,
      ...patch,
    };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/agency/clippers?${s}` : "/agency/clippers";
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink-900">Find clippers</h1>
        <p className="mt-0.5 text-[14px] text-ink-500">
          {all.length === 1 ? "1 vetted clipper" : `${all.length} vetted clippers`} on Klipr. Every
          one has passed review and can post today.
        </p>
      </header>

      {/* search · niche · sort — one GET form, no JS required */}
      <form
        action="/agency/clippers"
        role="search"
        className="flex flex-col gap-2.5 sm:flex-row sm:items-center"
      >
        {tier ? <input type="hidden" name="tier" value={tier} /> : null}
        {platform ? <input type="hidden" name="platform" value={platform} /> : null}
        <label className="flex h-11 flex-1 items-center gap-2 rounded-full bg-white pl-4 pr-3 shadow-[var(--shadow-xs)] transition-shadow focus-within:shadow-[0_0_0_2px_rgba(125,4,215,0.25)]">
          <IconSearch size={15} strokeWidth={1.5} className="shrink-0 text-ink-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name, @handle, city or niche"
            className="w-full bg-transparent text-[13.5px] text-ink-900 outline-none placeholder:text-ink-500"
          />
        </label>
        <div className="flex gap-2.5">
          <select
            name="niche"
            defaultValue={niche ?? ""}
            aria-label="Niche"
            className="h-11 min-w-0 flex-1 rounded-full bg-white px-4 text-[13px] font-semibold text-ink-700 shadow-[var(--shadow-xs)] sm:flex-none"
          >
            <option value="">Any niche</option>
            {NICHES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sort}
            aria-label="Sort"
            className="h-11 min-w-0 flex-1 rounded-full bg-white px-4 text-[13px] font-semibold text-ink-700 shadow-[var(--shadow-xs)] sm:flex-none"
          >
            {DIRECTORY_SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-11 shrink-0 rounded-full bg-violet-700 px-5 text-[13px] font-bold text-white transition-colors hover:bg-violet-800"
          >
            Search
          </button>
        </div>
      </form>

      {/* tier · platform pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Pill href={hrefWith({ tier: undefined })} on={!tier}>
          All tiers
        </Pill>
        {TIER_ORDER.map((t) => (
          <Pill key={t} href={hrefWith({ tier: tier === t ? undefined : t })} on={tier === t}>
            {cap(t)}
          </Pill>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-[rgba(53,5,90,0.12)] sm:block" aria-hidden="true" />
        {PLATFORM_ORDER.map((p) => (
          <Pill
            key={p}
            href={hrefWith({ platform: platform === p ? undefined : p })}
            on={platform === p}
          >
            {PLATFORMS[p].label}
          </Pill>
        ))}
        {filtered ? (
          <Link
            href="/agency/clippers"
            className="ml-1 text-[12.5px] font-semibold text-violet-600 transition-colors hover:text-violet-700"
          >
            Clear filters
          </Link>
        ) : null}
      </div>

      {list.length === 0 ? (
        <GlassPanel>
          <EmptyState
            title={
              all.length === 0
                ? "No clippers yet"
                : q
                  ? `No clippers match “${q}”`
                  : "No clippers match those filters"
            }
            line={
              all.length === 0
                ? "Approved clippers appear here the moment they finish onboarding."
                : "Try a broader search, another tier, or clear the filters."
            }
            action={
              filtered ? (
                <Link
                  href="/agency/clippers"
                  className="rounded-full bg-ink-900 px-5 py-2.5 text-[13px] font-bold text-white"
                >
                  Show everyone
                </Link>
              ) : undefined
            }
          />
        </GlassPanel>
      ) : (
        <>
          {filtered ? (
            <p className="-mt-1 text-[12.5px] text-ink-500">
              {list.length} of {all.length}
            </p>
          ) : null}
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((c) => (
              <ClipperCard key={c.id} clipper={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
