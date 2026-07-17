import { cn } from "@/lib/cn";

/** The bolt logomark alone. Uses currentColor. */
export function BoltMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 552 624"
      fill="currentColor"
      aria-hidden="true"
      className={cn("h-[0.95em] w-auto shrink-0", className)}
    >
      <path d="M374.755 30.0808C374.755 4.35945 344.521 -9.45308 325.078 7.38552L10.4279 279.882C-10.5843 298.079 2.28616 332.599 30.083 332.599H146.515C163.095 332.599 176.537 346.04 176.537 362.621V593.576C176.537 619.297 206.77 633.11 226.214 616.271L540.864 343.775C561.876 325.578 549.006 291.058 521.209 291.058H404.777C388.196 291.058 374.755 277.616 374.755 261.036V30.0808Z" />
    </svg>
  );
}

/** Official Klipr logo — bolt logomark + lowercase wordmark. Uses currentColor,
 *  so set `text-yellow` on a dark surface or leave default (Dark Amethyst). */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-logotype text-[19px] font-bold lowercase tracking-tight text-text-hi",
        className,
      )}
    >
      <BoltMark />
      klipr
    </span>
  );
}
