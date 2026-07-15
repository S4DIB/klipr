"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { BoltMark } from "@/components/ui/logo";
import { WaitlistForm } from "@/components/landing/waitlist-form";

/** Apple-style frosted-glass waitlist dialog.
 *  Opens from ANY `<a href="#waitlist">` (clipper) or `<a href="#waitlist-brand">`
 *  (brand, pre-selects the brand form) on the page via event delegation, so
 *  triggers in server components need no wiring. */
export function WaitlistModal() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"clipper" | "brand">("clipper");
  const reduce = useReducedMotion();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.(
        'a[href="#waitlist"], a[href="#waitlist-brand"]',
      );
      if (a) {
        e.preventDefault();
        setRole(a.getAttribute("href") === "#waitlist-brand" ? "brand" : "clipper");
        setOpen(true);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const spring = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 30 };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center p-4"
          data-lenis-prevent
        >
          {/* dimmed, blurred backdrop — neutral so the glass reads grey, not purple */}
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-md"
            initial={{ opacity: reduce ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />

          {/* glass panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Join the Klipr waitlist"
            className="scroll-glass relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-[36px] border border-white/25 bg-[#7a7a85]/35 p-8 shadow-[0_40px_120px_-24px_rgba(0,0,0,0.65)] backdrop-blur-3xl backdrop-brightness-110 backdrop-saturate-[.55] sm:p-10"
            initial={reduce ? false : { opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={spring}
          >
            {/* glass sheen — light catching the top edge */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-[36px] bg-gradient-to-b from-white/20 to-transparent"
            />

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white/85 transition-colors hover:bg-white/25 hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M2 2l10 10M12 2 2 12" />
              </svg>
            </button>

            <span className="relative mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-yellow">
              <BoltMark className="h-5 text-volt-600" />
            </span>

            <h2 className="display relative mt-5 text-center text-[1.7rem] text-white">
              Join the waitlist
            </h2>

            <div className="relative mt-7">
              <WaitlistForm autoFocusFirst variant="glass" initialRole={role} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
