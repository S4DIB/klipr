"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  IconHome,
  IconMegaphone,
  IconGraph,
  IconWallet,
  IconTrophy,
  IconUsers,
  IconChart,
  IconAdd,
  IconBkash,
  IconGear,
  IconClock,
  IconFlag,
  IconSend,
  type IconProps,
} from "@/components/icons";

export interface RailItem {
  href: string;
  label: string;
  /** Icon key. Resolved client-side (component fns can't cross the RSC boundary). */
  icon:
    | "home"
    | "megaphone"
    | "graph"
    | "wallet"
    | "trophy"
    | "users"
    | "chart"
    | "add"
    | "bkash"
    | "gear"
    | "clock"
    | "flag"
    | "send";
}

const ICONS: Record<RailItem["icon"], (p: IconProps) => React.ReactNode> = {
  home: IconHome,
  megaphone: IconMegaphone,
  graph: IconGraph,
  wallet: IconWallet,
  trophy: IconTrophy,
  users: IconUsers,
  chart: IconChart,
  add: IconAdd,
  bkash: IconBkash,
  gear: IconGear,
  clock: IconClock,
  flag: IconFlag,
  send: IconSend,
};

/**
 * Sidebar rail nav (desktop). Active item = white pill + violet ink + soft
 * shadow, per the design's rail buttons.
 */
export function RailNav({ items }: { items: RailItem[] }) {
  const pathname = usePathname();
  // only the deepest matching route lights up (so "/admin" or "/brand" don't
  // stay active on every child page)
  const best = items.reduce<string | null>((acc, { href }) => {
    const match = pathname === href || pathname.startsWith(`${href}/`);
    return match && href.length > (acc?.length ?? 0) ? href : acc;
  }, null);

  return (
    <nav aria-label="Primary" className="flex flex-col gap-0.5">
      {items.map(({ href, label, icon }) => {
        const Icon = ICONS[icon];
        const active = href === best;
        return (
          <Link
            key={`${href}-${label}`}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-[12px] px-3 py-[9px] text-[13.5px] font-semibold transition-colors",
              active
                ? "bg-[#f1eff6] text-violet-700"
                : "text-ink-600 hover:bg-[rgba(53,5,90,0.045)] hover:text-ink-900",
            )}
          >
            <span className="inline-flex h-[18px] w-[18px] items-center justify-center">
              <Icon size={18} strokeWidth={active ? 1.5 : 1.25} />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
