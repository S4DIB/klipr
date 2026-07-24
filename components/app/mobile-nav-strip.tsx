"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * Mobile-only horizontal scroll nav — for shells with no TabBar (admin ops).
 * Same pill language as the rail; only the deepest matching route is active.
 */
export function MobileNavStrip({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const best = items.reduce<string | null>((acc, { href }) => {
    const match = pathname === href || pathname.startsWith(`${href}/`);
    return match && href.length > (acc?.length ?? 0) ? href : acc;
  }, null);

  return (
    <nav aria-label="Primary" className="flex gap-1 overflow-x-auto px-4 pb-2.5 md:hidden">
      {items.map(({ href, label }) => {
        const active = href === best;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
              active
                ? "bg-[rgba(53,5,90,0.08)] text-text-hi"
                : "text-text-mid hover:text-text-hi",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
