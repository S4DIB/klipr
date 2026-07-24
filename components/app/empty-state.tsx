import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { BoltMark } from "@/components/ui/logo";

/**
 * The honest empty state: BoltMark + one true sentence + one action.
 * Never renders fabricated counts, sample rows, or fake activity.
 */
export function EmptyState({
  title,
  line,
  action,
  className,
}: {
  title: string;
  /** One sentence of truth about why this is empty. */
  line: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <BoltMark className="h-7 w-auto text-volt-500 opacity-70" />
      <h3 className="title mt-4 text-text-hi">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-text-mid">{line}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
