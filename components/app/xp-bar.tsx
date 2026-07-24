import { CountUp } from "@/components/motion/count-up";

/**
 * XP progress toward the next tier. Yellow fill on a recessed well track.
 * At Elite (no next tier) it renders a full bar with the total only.
 */
export function XpBar({
  xp,
  nextThreshold,
  nextTierLabel,
  className,
}: {
  xp: number;
  /** XP needed for the next tier; omit at Elite. */
  nextThreshold?: number;
  nextTierLabel?: string;
  className?: string;
}) {
  const pct =
    nextThreshold && nextThreshold > 0
      ? Math.min(100, Math.round((xp / nextThreshold) * 100))
      : 100;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow">XP</p>
        <p className="data-sm text-text-mid">
          <CountUp to={xp} className="text-text-hi" />
          {nextThreshold ? <> / {nextThreshold.toLocaleString("en-US")}</> : null}
        </p>
      </div>
      <div
        className="glass-well mt-2 h-2.5 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={xp}
        aria-valuemin={0}
        aria-valuemax={nextThreshold ?? xp}
        aria-label={nextTierLabel ? `XP progress to ${nextTierLabel}` : "XP"}
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--mint),var(--yellow))]"
          style={{ width: `${pct}%` }}
        />
      </div>
      {nextTierLabel && nextThreshold ? (
        <p className="mt-1.5 text-[12px] text-text-low">
          {Math.max(0, nextThreshold - xp).toLocaleString("en-US")} XP to {nextTierLabel}
        </p>
      ) : null}
    </div>
  );
}
