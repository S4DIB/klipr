import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "e1" | "e2" | "ink" | "well";

const variants: Record<Variant, string> = {
  e1: "glass",
  e2: "glass-strong rounded-[--radius-card]",
  ink: "glass-ink",
  well: "glass-well",
};

/**
 * The Klipr Glass surface. Server-safe.
 * - `e1` . Standard frosted card (default)
 * - `e2` . Stronger chrome glass (popovers, prominent panels)
 * - `ink`. The amethyst statement surface (max ONE per screen)
 * - `well`— recessed, blur-free well (inputs, dense lists)
 * `interactive` adds the CSS-only hover lift (e1 → e2 shadow).
 */
export function GlassPanel({
  children,
  variant = "e1",
  interactive = false,
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  interactive?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(variants[variant], interactive && "glass-hover", className)}>
      {children}
    </div>
  );
}
