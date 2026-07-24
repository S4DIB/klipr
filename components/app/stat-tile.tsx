import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CountUp } from "@/components/motion/count-up";

/**
 * Eyebrow label + big tabular-mono number (CountUp) + optional footnote.
 * Every money/view/XP figure in the app goes through this or `.data-sm`.
 */
export function StatTile({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  foot,
  onInk = false,
  className,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** Extra line under the number (delta, caption). Plain nodes, no fake data. */
  foot?: ReactNode;
  /** Set when rendered inside `.glass-ink` (ivory text). */
  onInk?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className={cn("eyebrow", onInk && "text-[rgba(255,255,244,0.55)]")}>{label}</p>
      <p className={cn("data-xl mt-2", onInk ? "text-ivory" : "text-text-hi")}>
        <CountUp to={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
      {foot ? (
        <div className={cn("mt-1.5 text-[12.5px]", onInk ? "text-[rgba(255,255,244,0.65)]" : "text-text-mid")}>
          {foot}
        </div>
      ) : null}
    </div>
  );
}
