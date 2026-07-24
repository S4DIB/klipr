"use client";

import { usePathname } from "next/navigation";

export interface PageTitle {
  href: string;
  label: string;
}

/**
 * Desktop header heading: Dhaka date eyebrow over the current page title.
 * The title is the longest-prefix match against the shell's nav items, so
 * detail routes (/campaigns/[id], /clips/[id]) inherit their section title.
 */
export function PageHeading({
  titles,
  dateLabel,
}: {
  titles: PageTitle[];
  dateLabel: string;
}) {
  const pathname = usePathname();
  const match = titles
    .filter(({ href }) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <div className="min-w-0">
      <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-violet-600">
        {dateLabel}
      </p>
      <h1 className="truncate text-[21px] font-extrabold leading-tight tracking-[-0.01em] text-ink-900">
        {match?.label ?? "Klipr"}
      </h1>
    </div>
  );
}
