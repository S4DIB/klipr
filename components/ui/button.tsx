import { type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "secondary" | "highlight" | "inverse";

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-full px-6 h-12 text-[15px] font-medium tracking-tight transition-[color,background-color,border-color,box-shadow,transform] duration-200 focus-visible:outline-2 active:scale-[0.99]";

const variants: Record<Variant, string> = {
  primary:
    "bg-volt-500 text-white hover:bg-violet-700 shadow-[0_8px_24px_-8px_rgba(125,4,215,0.5)] hover:shadow-[0_10px_30px_-8px_rgba(125,4,215,0.6)]",
  ghost:
    "text-text-hi border border-line hover:border-volt-400 hover:text-volt-600 bg-transparent",
  /* white pill on the ivory field. The design's quiet second action */
  secondary:
    "bg-white text-ink-700 shadow-[var(--shadow-xs)] hover:bg-ink-50 hover:text-text-hi",
  /* Vibrant Yellow. The one "spark" action on ink surfaces */
  highlight: "bg-yellow text-violet-900 font-bold hover:bg-[#ecf230]",
  /* ivory on .glass-ink decision bars */
  inverse: "bg-ivory text-violet-900 font-bold hover:bg-white",
};

export function Button({
  children,
  href,
  variant = "primary",
  className,
  type,
  ...rest
}: {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  className?: string;
  type?: "button" | "submit";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = cn(base, variants[variant], className);

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type ?? "button"} className={cls} {...rest}>
      {children}
    </button>
  );
}

/** Arrow that nudges on hover. A small repeated luxury detail. */
export function ArrowEast() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="translate-x-0 transition-transform duration-200 group-hover:translate-x-0.5"
      aria-hidden="true"
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
