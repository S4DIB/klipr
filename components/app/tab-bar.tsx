"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  IconHome,
  IconCampaign,
  IconUpload,
  IconWallet,
  IconProfile,
  IconChart,
  IconBkash,
  IconGear,
  IconMegaphone,
  IconGraph,
  IconUsers,
  type IconProps,
} from "@/components/icons";

export interface TabItem {
  href: string;
  label: string;
  /** Icon key. Resolved client-side (component fns can't cross the RSC boundary). */
  icon:
    | "home"
    | "campaigns"
    | "upload"
    | "wallet"
    | "profile"
    | "chart"
    | "bkash"
    | "gear"
    | "megaphone"
    | "graph"
    | "users";
  /** The raised yellow center action. */
  center?: boolean;
}

const ICONS: Record<TabItem["icon"], (p: IconProps) => React.ReactNode> = {
  home: IconHome,
  campaigns: IconCampaign,
  upload: IconUpload,
  wallet: IconWallet,
  profile: IconProfile,
  chart: IconChart,
  bkash: IconBkash,
  gear: IconGear,
  megaphone: IconMegaphone,
  graph: IconGraph,
  users: IconUsers,
};

/**
 * Floating glass bottom tab bar (mobile only, `< md`). Active tab = violet
 * ink + a 5px yellow dot. The center slot is a raised 52px yellow circle
 * with an ivory ring that breaks the bar's top edge.
 */
export function TabBar({ items }: { items: TabItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="glass-strong fixed inset-x-[10px] bottom-[10px] z-[60] rounded-[26px] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex h-[66px] items-stretch justify-around px-2">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));

          if (item.center) {
            return (
              <li
                key={`${item.href}-${item.label}`}
                className="relative -mt-[20px] flex w-16 justify-center self-start"
              >
                <Link
                  href={item.href}
                  aria-label={item.label}
                  className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-[3px] border-ivory bg-yellow text-violet-900 shadow-[0_10px_20px_rgba(53,5,90,0.3)] transition-transform active:scale-95"
                >
                  <Icon size={22} strokeWidth={1.5} />
                </Link>
              </li>
            );
          }

          return (
            <li key={`${item.href}-${item.label}`} className="flex flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-[3px] pt-2 transition-colors",
                  active ? "text-violet-700" : "text-ink-400",
                )}
              >
                <Icon size={21} strokeWidth={active ? 1.5 : 1.25} />
                <span className="font-mono text-[9.5px] tracking-[0.03em]">{item.label}</span>
                <span
                  className={cn(
                    "h-[5px] w-[5px] rounded-full bg-yellow transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
