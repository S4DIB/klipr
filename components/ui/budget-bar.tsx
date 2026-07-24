import { cn } from "@/lib/cn";

/**
 * Campaign budget bar. Spent vs remaining on a recessed track, mint→yellow
 * fill. Values are poisha (integer); the caller renders labels via taka().
 */
export function BudgetBar({
  spent,
  total,
  className,
}: {
  spent: number;
  total: number;
  className?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
  return (
    <div className={cn("w-full", className)}>
      <div
        className="glass-well h-2.5 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Budget spent"
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--mint),var(--yellow))]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="data-sm mt-1.5 text-text-mid">{pct}% of budget used</p>
    </div>
  );
}
