"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, animate } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * Count-up that animates a number on first in-view, writing to textContent via
 * rAF (no per-frame React re-render). The true final value is rendered in the
 * DOM on the server, so no-JS / reduced-motion users see the real number.
 */
export function CountUp({
  to,
  prefix = "",
  suffix = "",
  duration = 1.6,
  decimals = 0,
  className,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const mv = useMotionValue(0);
  const reduce = useReducedMotion();

  const fmt = (n: number) =>
    `${prefix}${n.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`;

  useEffect(() => {
    if (reduce || !inView) return;
    const controls = animate(mv, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = fmt(v);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, to, reduce]);

  return (
    <span ref={ref} className={className}>
      {fmt(reduce ? to : 0)}
    </span>
  );
}
