import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * The standard list row for ledgers, submissions, applications and queues.
 * Blur-free by design (dense lists use wells, not glass). Renders as a link
 * when `href` is given.
 */
export function DataRow({
  leading,
  primary,
  secondary,
  trailing,
  href,
  className,
}: {
  /** Icon / avatar slot (20px grid). */
  leading?: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  /** Right-aligned slot. Amount, chip, chevron. */
  trailing?: ReactNode;
  href?: string;
  className?: string;
}) {
  const inner = (
    <>
      {leading ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(53,5,90,0.06)] text-text-hi">
          {leading}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-text-hi">{primary}</span>
        {secondary ? (
          <span className="mt-0.5 block truncate text-[12.5px] text-text-mid">{secondary}</span>
        ) : null}
      </span>
      {trailing ? <span className="flex shrink-0 items-center gap-2">{trailing}</span> : null}
    </>
  );

  const base = cn(
    "flex w-full items-center gap-3 rounded-[--radius-control] px-3.5 py-3 text-left",
    href && "transition-colors hover:bg-[rgba(53,5,90,0.045)]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={base}>
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
}
