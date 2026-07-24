"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/cn";
import { IconX } from "@/components/icons";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Klipr Glass dialog: bottom sheet on mobile, centered panel on desktop.
 * e3 elevation, RisePanel-style entrance, Escape + backdrop close,
 * scroll-locked while open. Content is real DOM (no portal needed.
 * fixed positioning + the app's stacking order).
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center">
          <motion.button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-[rgba(32,4,52,0.4)]"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "glass-strong relative w-full max-w-lg rounded-t-[--radius-panel] p-6 md:rounded-[--radius-panel]",
              "max-h-[88dvh] overflow-y-auto scroll-glass md:max-h-[82dvh]",
              className,
            )}
            initial={reduce ? false : { opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 32, scale: 0.98 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="title text-text-hi">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-mid transition-colors hover:bg-[rgba(53,5,90,0.06)] hover:text-text-hi"
              >
                <IconX size={16} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
