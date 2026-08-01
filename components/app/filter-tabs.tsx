import Link from "next/link";
import { cn } from "@/lib/cn";

export type FilterKey = "pending" | "approved" | "rejected";

export function normalizeFilter(value?: string): FilterKey {
  return value === "approved" || value === "rejected" ? value : "pending";
}

const TABS: { key: FilterKey; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

/** Pending · Approved · Rejected tabs — the shared admin approval filter. */
export function FilterTabs({
  basePath,
  current,
  counts,
}: {
  basePath: string;
  current: FilterKey;
  counts?: Record<FilterKey, number>;
}) {
  return (
    <div className="flex gap-2" role="tablist">
      {TABS.map((t) => {
        const active = t.key === current;
        return (
          <Link
            key={t.key}
            href={`${basePath}?status=${t.key}`}
            role="tab"
            aria-selected={active}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-[14px] px-4 py-2.5 text-center text-[13.5px] font-semibold transition-colors",
              active
                ? "bg-violet-900 text-white"
                : "bg-white text-ink-600 shadow-[var(--shadow-xs)] hover:text-ink-900",
            )}
          >
            {t.label}
            {counts ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  active ? "bg-white/20 text-white" : "bg-[rgba(53,5,90,0.06)] text-ink-500",
                )}
              >
                {counts[t.key]}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
