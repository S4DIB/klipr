"use client";

import { type ReactNode } from "react";
import { motion, type Variants } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const; // expo-ish out

/**
 * In-view reveal — transform/opacity only, fires once.
 * Real content stays in the DOM (SSR/SEO safe); under reduced-motion it
 * renders in final state with no animation.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "span" | "li" | "section";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Line-mask reveal for headlines. Each line slides up from an overflow-hidden
 * mask with a stagger. Pass an array of strings (one per line).
 */
export function MaskReveal({
  lines,
  className,
  lineClassName,
  lineClassNames,
  delay = 0,
}: {
  lines: string[];
  className?: string;
  lineClassName?: string;
  /** Per-line class overrides, indexed to `lines`. */
  lineClassNames?: string[];
  delay?: number;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <span className={className}>
        {lines.map((l, i) => (
          <span key={i} className={cn("block", lineClassName, lineClassNames?.[i])}>
            {l}
          </span>
        ))}
      </span>
    );
  }

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: delay } },
  };
  const line: Variants = {
    hidden: { y: "110%" },
    show: { y: "0%", transition: { duration: 0.9, ease: EASE } },
  };

  return (
    <motion.span
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >
      {lines.map((l, i) => (
        <span key={i} className="mask-line">
          <motion.span
            className={cn("block", lineClassName, lineClassNames?.[i])}
            variants={line}
          >
            {l}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
