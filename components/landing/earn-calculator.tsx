"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useSpring,
  useTransform,
} from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { ArrowEast } from "@/components/ui/button";
import { BoltMark } from "@/components/ui/logo";

/* Example CPM range (৳ per 1K verified views) — illustrative only; every
 * campaign sets its own rate at launch. Keep the honest footnote in sync. */
const RATE_LOW = 45;
const RATE_HIGH = 70;

const VIEWS = [
  10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_000_000,
];

const fmtViews = (v: number) =>
  v >= 1_000_000 ? `${v / 1_000_000}M` : `${v / 1000}K`;

function tierLabel(lowMonthly: number) {
  if (lowMonthly < 10_000) return "Real side income";
  if (lowMonthly < 40_000) return "Serious side income";
  if (lowMonthly < 100_000) return "Salary territory";
  return "Top-clipper league";
}

/** Taka amount that springs to each new value instead of snapping. */
function AnimatedTaka({ value, reduce }: { value: number; reduce: boolean }) {
  const spring = useSpring(value, {
    stiffness: reduce ? 2000 : 90,
    damping: reduce ? 200 : 22,
  });
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);
  const text = useTransform(
    spring,
    (v) => `৳${Math.round(v).toLocaleString("en-US")}`,
  );
  return <motion.span>{text}</motion.span>;
}

/** Interactive "do the math" card — sells the outcome with the visitor's own
 *  numbers instead of fabricated live activity. */
export function EarnCalculator() {
  const [vi, setVi] = useState(2); // index into VIEWS → 50K default
  const [clips, setClips] = useState(12);
  const reduce = useReducedMotion();

  const views = VIEWS[vi];
  const low = (views / 1000) * RATE_LOW * clips;
  const high = (views / 1000) * RATE_HIGH * clips;
  const label = tierLabel(low);

  const viewsPct = `${(vi / (VIEWS.length - 1)) * 100}%`;
  const clipsPct = `${((clips - 4) / (60 - 4)) * 100}%`;

  return (
    <div className="relative mx-auto mt-14 max-w-3xl overflow-hidden rounded-[24px] border border-white/10 bg-volt-600 p-7 shadow-[0_44px_90px_-32px_rgba(53,5,90,0.6)] sm:p-10 md:p-12">
      {/* electric texture + corner glows */}
      <div
        aria-hidden
        className="pixel-grid pointer-events-none absolute inset-0"
        style={{
          maskImage:
            "radial-gradient(85% 85% at 50% 15%, #000 0%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(85% 85% at 50% 15%, #000 0%, transparent 80%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(250,255,71,0.16), transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,123,192,0.15), transparent 65%)",
        }}
      />
      {/* floating brand bolt */}
      <img
        src="/brand/bolt-3d-yellow.svg"
        alt=""
        aria-hidden
        className="absolute right-7 top-7 hidden h-10 w-auto sm:block"
        style={reduce ? undefined : { animation: "bob 7s ease-in-out infinite" }}
      />

      <div className="relative">
        {/* the two dials */}
        <div className="grid gap-9 md:grid-cols-2 md:gap-12">
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <label
                htmlFor="calc-views"
                className="text-sm font-medium text-white/80"
              >
                Average views per clip
              </label>
              <span className="font-mono text-xl font-semibold text-yellow">
                {fmtViews(views)}
              </span>
            </div>
            <input
              id="calc-views"
              type="range"
              min={0}
              max={VIEWS.length - 1}
              step={1}
              value={vi}
              onChange={(e) => setVi(Number(e.target.value))}
              className="range-volt mt-5 w-full"
              style={{ "--fill": viewsPct } as React.CSSProperties}
            />
            <div className="mt-2.5 flex justify-between font-mono text-[10px] uppercase tracking-wider text-white/40">
              <span>10K</span>
              <span>2M</span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-4">
              <label
                htmlFor="calc-clips"
                className="text-sm font-medium text-white/80"
              >
                Clips you post per month
              </label>
              <span className="font-mono text-xl font-semibold text-yellow">
                {clips}
              </span>
            </div>
            <input
              id="calc-clips"
              type="range"
              min={4}
              max={60}
              step={2}
              value={clips}
              onChange={(e) => setClips(Number(e.target.value))}
              className="range-volt mt-5 w-full"
              style={{ "--fill": clipsPct } as React.CSSProperties}
            />
            <div className="mt-2.5 flex justify-between font-mono text-[10px] uppercase tracking-wider text-white/40">
              <span>4</span>
              <span>60</span>
            </div>
          </div>
        </div>

        {/* the payoff */}
        <div className="mt-10 border-t border-white/10 pt-9 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">
            Your monthly potential
          </p>
          <p className="display mt-3 text-[clamp(2rem,5.5vw,3.4rem)] font-bold tracking-tight text-yellow">
            <AnimatedTaka value={low} reduce={reduce} />
            <span className="px-2 text-white/35">–</span>
            <AnimatedTaka value={high} reduce={reduce} />
          </p>

          <div className="mt-4 h-9">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={label}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-4 py-1.5 text-[13px] font-medium text-mint"
              >
                <BoltMark className="h-3" />
                {label}
              </motion.span>
            </AnimatePresence>
          </div>

          <p className="mx-auto mt-4 max-w-[52ch] text-xs leading-relaxed text-white/45">
            Example rates: ৳{RATE_LOW}–৳{RATE_HIGH} per 1K verified views.
            Every brand sets its own campaign rate at launch — this is the
            math, not a promise.
          </p>

          <a
            href="#waitlist"
            className="group mt-7 inline-flex h-[52px] items-center gap-2 rounded-full bg-yellow px-8 text-[15px] font-semibold tracking-tight text-volt-600 shadow-[0_10px_36px_-10px_rgba(250,255,71,0.55)] transition-all duration-200 hover:brightness-95 active:scale-[0.98]"
          >
            Claim your spot
            <ArrowEast />
          </a>
        </div>
      </div>
    </div>
  );
}
