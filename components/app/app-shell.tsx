import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { IconBell, IconChevronRight, IconWallet } from "@/components/icons";
import { signOut } from "@/lib/auth/actions";
import { dhakaToday } from "@/lib/format";
import { RailNav, type RailItem } from "@/components/app/rail-nav";
import { TabBar, type TabItem } from "@/components/app/tab-bar";
import { PageHeading, type PageTitle } from "@/components/app/page-heading";
import { HeaderSearch } from "@/components/app/header-search";
import { MobileNavStrip } from "@/components/app/mobile-nav-strip";
import type { TierName } from "@/components/app/tier-badge";

type ShellRole = "clipper" | "agency" | "brand" | "admin";

const RAIL: Record<ShellRole, RailItem[]> = {
  clipper: [
    { href: "/home", label: "Home", icon: "home" },
    { href: "/campaigns", label: "Campaigns", icon: "megaphone" },
    { href: "/clips", label: "My clips", icon: "graph" },
    { href: "/wallet", label: "Wallet", icon: "wallet" },
    { href: "/leaderboard", label: "Leaderboard", icon: "trophy" },
    { href: "/connections", label: "Connected accounts", icon: "users" },
  ],
  agency: [
    { href: "/home", label: "Home", icon: "home" },
    { href: "/campaigns", label: "Campaigns", icon: "megaphone" },
    { href: "/clips", label: "Clips", icon: "graph" },
    { href: "/wallet", label: "Wallet", icon: "wallet" },
    { href: "/connections", label: "Network", icon: "users" },
  ],
  brand: [
    { href: "/brand", label: "Overview", icon: "chart" },
    { href: "/brand/campaigns/new", label: "New campaign", icon: "add" },
    { href: "/brand/billing", label: "Billing", icon: "bkash" },
    { href: "/brand/settings", label: "Settings", icon: "gear" },
  ],
  admin: [
    { href: "/admin", label: "Ops home", icon: "home" },
    { href: "/admin/applications", label: "Applications", icon: "clock" },
    { href: "/admin/accounts", label: "Accounts", icon: "users" },
    { href: "/admin/clips", label: "Clips", icon: "graph" },
    { href: "/admin/campaigns", label: "Campaigns", icon: "megaphone" },
    { href: "/admin/payouts", label: "Payouts", icon: "bkash" },
    { href: "/admin/fraud", label: "Fraud", icon: "flag" },
    { href: "/admin/clippers", label: "Clippers", icon: "users" },
    { href: "/admin/leads", label: "Leads", icon: "send" },
  ],
};

/* Mobile tab bars. Admin has none — desktop-first ops; mobile gets a nav strip. */
const TABS: Record<ShellRole, TabItem[]> = {
  clipper: [
    { href: "/home", label: "Home", icon: "home" },
    { href: "/campaigns", label: "Campaigns", icon: "megaphone" },
    { href: "/campaigns", label: "Submit", icon: "upload", center: true },
    { href: "/clips", label: "Clips", icon: "graph" },
    { href: "/wallet", label: "Wallet", icon: "wallet" },
  ],
  agency: [
    { href: "/home", label: "Home", icon: "home" },
    { href: "/campaigns", label: "Campaigns", icon: "megaphone" },
    { href: "/campaigns", label: "Submit", icon: "upload", center: true },
    { href: "/connections", label: "Network", icon: "users" },
    { href: "/wallet", label: "Wallet", icon: "wallet" },
  ],
  brand: [
    { href: "/brand", label: "Overview", icon: "chart" },
    { href: "/brand", label: "Campaigns", icon: "megaphone" },
    { href: "/brand/campaigns/new", label: "New", icon: "upload", center: true },
    { href: "/brand/billing", label: "Billing", icon: "bkash" },
    { href: "/brand/settings", label: "Settings", icon: "gear" },
  ],
  admin: [],
};

/** Header titles per route — the rail items plus routes that live off-rail. */
const TITLES: Record<ShellRole, PageTitle[]> = {
  clipper: [
    ...RAIL.clipper.map(({ href, label }) => ({ href, label })),
    { href: "/settings", label: "Settings" },
  ],
  agency: [
    ...RAIL.agency.map(({ href, label }) => ({ href, label })),
    { href: "/settings", label: "Settings" },
  ],
  brand: [
    ...RAIL.brand.map(({ href, label }) => ({ href, label })),
    { href: "/brand/campaigns", label: "Campaigns" },
  ],
  admin: RAIL.admin.map(({ href, label }) => ({ href, label })),
};

/** Shared account dropdown (header avatar). */
function AccountMenu({
  displayName,
  role,
  settingsHref,
  initial,
}: {
  displayName: string;
  role: ShellRole;
  settingsHref?: string;
  initial: string;
}) {
  return (
    <details className="group relative">
      <summary
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-volt-600 font-mono text-[13px] text-yellow [&::-webkit-details-marker]:hidden"
        aria-label="Account menu"
      >
        {initial}
      </summary>
      <div className="glass-strong absolute right-0 top-11 z-50 w-56 rounded-[--radius-control] p-2">
        <p className="truncate px-3 py-2 text-[13px] font-medium text-text-hi">{displayName}</p>
        <p className="px-3 pb-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-text-low">
          {role}
        </p>
        <div className="hairline my-1" />
        {settingsHref ? (
          <Link
            href={settingsHref}
            className="block rounded-[10px] px-3 py-2 text-[13.5px] text-text-mid transition-colors hover:bg-[rgba(53,5,90,0.05)] hover:text-text-hi"
          >
            Settings
          </Link>
        ) : null}
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-[10px] px-3 py-2 text-left text-[13.5px] text-text-mid transition-colors hover:bg-[rgba(53,5,90,0.05)] hover:text-text-hi"
          >
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}

/**
 * The Klipr Glass app frame. Desktop: full-height sidebar (logo · nav ·
 * account menu) beside a content column whose header carries the Dhaka date,
 * the current page title, and the wallet balance — nothing else. Mobile:
 * slim header + floating TabBar.
 * Layouts gate access/role BEFORE rendering this. The shell trusts its props.
 */
/** Available balance as a header pill: ৳1,240.00 */
function takaWithDecimals(poisha: number): string {
  const sign = poisha < 0 ? "−" : "";
  const abs = Math.abs(poisha);
  const whole = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = String(abs % 100).padStart(2, "0");
  return `${sign}৳${whole}.${rem}`;
}

export function AppShell({
  role,
  displayName,
  tier,
  xpTotal,
  availablePoisha,
  children,
}: {
  role: ShellRole;
  displayName: string;
  /** Clipper/agency only. Rendered under the name in the sidebar. */
  tier?: TierName;
  /** Clipper/agency lifetime XP, rendered beside the tier. */
  xpTotal?: number;
  /** Clipper/agency available balance, shown in the header. */
  availablePoisha?: number;
  children: ReactNode;
}) {
  const homeHref = role === "brand" ? "/brand" : role === "admin" ? "/admin" : "/home";
  // admin has no settings surface — its account menus offer "Sign out" only
  const settingsHref =
    role === "brand" ? "/brand/settings" : role === "admin" ? undefined : "/settings";
  const showSearch = role === "clipper" || role === "agency";
  const cta =
    role === "brand"
      ? { href: "/brand/campaigns/new", label: "New campaign" }
      : role === "admin"
        ? null
        : { href: "/campaigns", label: "Browse campaigns" };
  const initial = (displayName || "K").trim().charAt(0).toUpperCase();
  // sidebar identity subtitle: "Beginner · 92 XP" for clippers/agencies, role otherwise
  const identityLine = tier
    ? `${tier.charAt(0).toUpperCase()}${tier.slice(1)} · ${(xpTotal ?? 0).toLocaleString("en-US")} XP`
    : `${role.charAt(0).toUpperCase()}${role.slice(1)}`;

  return (
    <div className="klipr-app relative flex min-h-dvh flex-col bg-white md:h-dvh md:overflow-hidden">
      {/* e0. Mobile only: the gradient field fills the viewport. On desktop
          it lives inside the rounded content canvas instead. */}
      <div className="field-app fixed inset-0 -z-10 md:hidden" aria-hidden="true" />

      {/* mobile header */}
      <header className="glass-strong sticky top-0 z-50 rounded-none border-x-0 border-t-0 md:hidden">
        <div className="flex h-14 items-center justify-between gap-4 px-5">
          <Link href={homeHref} aria-label="Klipr home" className="flex items-center gap-2 text-text-hi">
            <Logo className="text-[15px]" />
            {role === "admin" ? (
              <span className="rounded-full bg-volt-600 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-yellow">
                Ops
              </span>
            ) : null}
          </Link>
          <div className="flex items-center gap-2.5">
            {availablePoisha !== undefined ? (
              <Link
                href="/wallet"
                className="flex items-center gap-1.5 rounded-full bg-[rgba(53,5,90,0.05)] py-1.5 pl-2.5 pr-3"
                aria-label="Wallet balance"
              >
                <IconWallet size={14} strokeWidth={1.5} className="text-violet-600" />
                <span className="font-mono text-[13px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
                  {takaWithDecimals(availablePoisha)}
                </span>
              </Link>
            ) : null}
            <AccountMenu
              displayName={displayName}
              role={role}
              settingsHref={settingsHref}
              initial={initial}
            />
          </div>
        </div>
        {role === "admin" ? <MobileNavStrip items={TITLES.admin} /> : null}
      </header>

      <div className="flex min-h-0 flex-1">
        {/* desktop rail. Full height: logo · nav · account menu */}
        <aside
          data-lenis-prevent
          className="hidden w-[236px] shrink-0 flex-col overflow-y-auto px-3.5 pb-5 pt-5 md:flex"
        >
          <Link
            href={homeHref}
            aria-label="Klipr home"
            className="mb-6 flex items-center gap-2 px-3 text-text-hi"
          >
            <Logo className="text-[15px]" />
            {role === "admin" ? (
              <span className="rounded-full bg-volt-600 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-yellow">
                Ops
              </span>
            ) : null}
          </Link>
          <RailNav items={RAIL[role]} />

          {/* identity / account menu (settings · sign out) */}
          <div className="mt-auto border-t border-[rgba(53,5,90,0.08)] pt-3">
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-[12px] px-1.5 py-2 transition-colors hover:bg-[rgba(53,5,90,0.045)] [&::-webkit-details-marker]:hidden">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-volt-600 font-mono text-[13px] text-yellow">
                  {initial}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-ink-900">
                    {displayName}
                  </span>
                  <span className="block truncate text-[12px] font-medium text-ink-500">
                    {identityLine}
                  </span>
                </span>
                <IconChevronRight size={14} strokeWidth={1.4} className="shrink-0 text-ink-400" />
              </summary>
              <div className="glass-strong absolute inset-x-0 bottom-[calc(100%+8px)] z-50 rounded-[--radius-control] p-2">
                {settingsHref ? (
                  <Link
                    href={settingsHref}
                    className="block rounded-[10px] px-3 py-2 text-[13.5px] text-text-mid transition-colors hover:bg-[rgba(53,5,90,0.05)] hover:text-text-hi"
                  >
                    Settings
                  </Link>
                ) : null}
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full rounded-[10px] px-3 py-2 text-left text-[13.5px] text-text-mid transition-colors hover:bg-[rgba(53,5,90,0.05)] hover:text-text-hi"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </details>
          </div>
        </aside>

        {/* content column: page header over the canvas. On desktop the canvas
            is the app's one scroll container. data-lenis-prevent keeps the
            landing page's Lenis wheel-hijack away from it. */}
        <div className="flex min-w-0 flex-1 flex-col md:h-full">
          {/* desktop header — date + page title · search · bell · balance · CTA */}
          <header className="hidden h-[76px] shrink-0 items-center justify-between gap-4 bg-white pl-8 pr-6 md:flex">
            <PageHeading titles={TITLES[role]} dateLabel={dhakaToday()} />
            <div className="flex items-center gap-2.5">
              {showSearch ? (
                <HeaderSearch placeholder="Search campaigns, brands, clips" />
              ) : null}
              <details className="group relative">
                <summary
                  className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-[rgba(53,5,90,0.12)] text-ink-600 transition-colors hover:bg-[rgba(53,5,90,0.055)] hover:text-ink-900 [&::-webkit-details-marker]:hidden"
                  aria-label="Notifications"
                >
                  <IconBell size={18} strokeWidth={1.4} />
                </summary>
                <div className="absolute right-0 top-12 z-50 w-[300px] rounded-[22px] border border-[rgba(53,5,90,0.05)] bg-white p-6 shadow-[0_16px_48px_-16px_rgba(31,3,53,0.25)]">
                  <p className="text-[17px] font-extrabold tracking-[-0.01em] text-ink-900">
                    Notifications
                  </p>
                  <div className="flex flex-col items-center py-7 text-center">
                    <IconBell size={28} strokeWidth={1.2} className="text-ink-300" />
                    <p className="mt-3 text-[14px] font-bold text-ink-900">
                      You&rsquo;re all caught up
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-ink-500">
                      New activity will show up here.
                    </p>
                  </div>
                </div>
              </details>
              {availablePoisha !== undefined ? (
                <Link
                  href="/wallet"
                  className="flex h-10 items-center gap-1.5 rounded-full bg-[rgba(53,5,90,0.05)] pl-3 pr-3.5 transition-colors hover:bg-[rgba(53,5,90,0.09)]"
                  aria-label="Wallet balance"
                >
                  <IconWallet size={15} strokeWidth={1.5} className="text-violet-600" />
                  <span className="font-mono text-[13.5px] font-semibold text-ink-900 [font-variant-numeric:tabular-nums]">
                    {takaWithDecimals(availablePoisha)}
                  </span>
                </Link>
              ) : null}
              {cta ? (
                <Link
                  href={cta.href}
                  className="flex h-10 items-center rounded-full border border-[rgba(125,4,215,0.3)] bg-white px-5 text-[14px] font-bold text-violet-700 transition-colors hover:bg-[rgba(125,4,215,0.06)]"
                >
                  {cta.label}
                </Link>
              ) : null}
            </div>
          </header>

          <div className="app-canvas" data-lenis-prevent>
            <main className="mx-auto w-full max-w-[1220px] px-5 pb-[96px] pt-6 md:px-8 md:py-8">
              {children}
            </main>
          </div>
        </div>
      </div>

      {TABS[role].length > 0 ? <TabBar items={TABS[role]} /> : null}
    </div>
  );
}
