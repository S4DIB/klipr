import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Form controls tuned for the Royal Violet onboarding card: white labels,
 * translucent-white inputs, yellow error text. Presentational — used inside the
 * client step forms.
 */
const control =
  "w-full rounded-[14px] border border-white/25 bg-white/12 px-3.5 py-2.5 text-[14.5px] text-white placeholder:text-white/45 outline-none transition-colors focus:border-white/60 focus:bg-white/18";

function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-[13px] font-medium text-white">{children}</label>;
}

function Err({ error }: { error?: string }) {
  return error ? (
    <p className="mt-1.5 text-[12.5px] font-semibold text-yellow" role="alert">
      {error}
    </p>
  ) : null;
}

export function VField({
  label,
  error,
  className,
  ...rest
}: { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label>{label}</Label>
      <input className={cn(control, className)} {...rest} />
      <Err error={error} />
    </div>
  );
}

export function VSelect({
  label,
  error,
  className,
  children,
  ...rest
}: { label: string; error?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <Label>{label}</Label>
      <select className={cn(control, "appearance-none text-white [&>option]:text-[#1c0a2e]", className)} {...rest}>
        {children}
      </select>
      <Err error={error} />
    </div>
  );
}

/** Read-only, visibly locked field (waitlist-drawn mobile / email). */
export function VLocked({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-[14px] border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[14.5px]",
          muted ? "text-white/45" : "text-white",
        )}
      >
        <span className="truncate">{value}</span>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-white/45" aria-hidden="true">
          <rect x="3.5" y="7" width="9" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </div>
    </div>
  );
}
