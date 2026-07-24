import { cn } from "@/lib/cn";
import { IconTrophy } from "@/components/icons";

export type TierName = "beginner" | "hustler" | "pro" | "elite";

/**
 * Tier pill. Beginner → Hustler → Pro → Elite. Pro+ carries the trophy.
 * Tiers unlock access and privileges only; they NEVER change the rate, so
 * the badge stays quiet: a chip, not a medal ceremony.
 */
const TIERS: Record<TierName, { label: string; chip: string; trophy: boolean }> = {
  beginner: {
    label: "Beginner",
    chip: "bg-ink-150 text-ink-600",
    trophy: false,
  },
  hustler: {
    label: "Hustler",
    chip: "bg-ink-150 text-ink-600",
    trophy: false,
  },
  pro: {
    label: "Pro",
    chip: "bg-violet-100 text-violet-700",
    trophy: true,
  },
  elite: {
    label: "Elite",
    chip: "bg-[rgba(250,255,71,0.55)] text-violet-900",
    trophy: true,
  },
};

export function TierBadge({
  tier,
  size = "md",
  className,
}: {
  tier: TierName;
  size?: "sm" | "md";
  className?: string;
}) {
  const t = TIERS[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] whitespace-nowrap rounded-full font-bold",
        size === "md" ? "px-[9px] py-1 text-[11px]" : "px-2 py-0.5 text-[10px]",
        t.chip,
        className,
      )}
    >
      {t.trophy && <IconTrophy size={size === "md" ? 12 : 10} strokeWidth={1.4} />}
      {t.label}
    </span>
  );
}
