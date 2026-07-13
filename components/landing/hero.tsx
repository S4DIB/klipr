"use client";

import { MaskReveal, Reveal } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/magnetic";
import { ArrowEast } from "@/components/ui/button";
import { HeroShowcase } from "@/components/landing/phone-mockup";
import {
  TikTokIcon,
  InstagramIcon,
  YouTubeIcon,
  FacebookIcon,
} from "@/components/ui/platform-icons";

/* The official 3D bolt, isolated from brand Pattern 02 (Klipr/Patterns/02).
 * "yellow" = Vibrant Yellow body / Royal Violet face; "violet" = tone-on-tone. */
function PatternBolt({
  variant = "yellow",
  className,
}: {
  variant?: "yellow" | "violet";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 121.71 236.39"
      aria-hidden="true"
      className={className}
      style={{ aspectRatio: "121.71 / 236.39" }}
    >
      <image
        href={variant === "yellow" ? "/brand/bolt-3d-yellow.svg" : "/brand/bolt-3d-violet.svg"}
        width="121.71"
        height="236.39"
      />
    </svg>
  );
}

/* Chapter 00 — the hook. One message, one primary action; everyone not ready
 * to convert is sent DOWN the page (to the demo), never away from it. */
export function Hero() {
  return (
    <section className="relative pt-36 pb-24">
      {/* background lives in the page-wide <Backdrop/>; scattered yellow bolts
          live in <BoltField/> — the hero's world continues through every
          section below */}

      <div className="shell grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
        {/* left — the hook */}
        <div className="relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left">
          <Reveal>
            <p className="mb-6 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-yellow">
              <PatternBolt className="h-4 w-auto" />
              Post · Earn · Repeat
              <PatternBolt className="h-4 w-auto -scale-x-100" />
            </p>
          </Reveal>

          <h1 className="display text-[clamp(2.8rem,5.8vw,5rem)] font-bold">
            <MaskReveal
              lines={["Stop posting", "for free."]}
              lineClassName="block pb-[0.08em]"
              lineClassNames={["text-ink-900", "text-yellow"]}
            />
          </h1>

          <Reveal delay={0.15}>
            <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-white/70">
              You post clips every day anyway. Now they pay. Pick a funded
              campaign, post to your own pages, and earn on every{" "}
              <span className="font-semibold text-yellow">view</span>{" "}
              you pull.
            </p>
          </Reveal>

          <Reveal delay={0.25}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Magnetic>
                <a
                  href="#waitlist"
                  className="group inline-flex h-[52px] items-center gap-2 rounded-full bg-yellow px-7 text-[15px] font-semibold tracking-tight text-volt-600 shadow-[0_10px_36px_-10px_rgba(250,255,71,0.55)] transition-all duration-200 hover:brightness-95 active:scale-[0.98]"
                >
                  Join the waitlist
                  <ArrowEast />
                </a>
              </Magnetic>
              <a
                href="#demo"
                className="inline-flex h-[52px] items-center gap-2.5 rounded-full border border-white/25 px-7 text-[15px] font-medium text-white transition-colors duration-200 hover:border-white/50 hover:bg-white/10"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15">
                  <svg width="9" height="11" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
                    <path d="M0 0l12 7-12 7V0Z" />
                  </svg>
                </span>
                Watch it work · 15 sec
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.35}>
            <div className="mt-7 flex items-center justify-center gap-4 text-white/50 lg:justify-start">
              <TikTokIcon className="h-4 w-4" />
              <InstagramIcon className="h-4 w-4" />
              <YouTubeIcon className="h-4 w-4" />
              <FacebookIcon className="h-4 w-4" />
            </div>
          </Reveal>
        </div>

        {/* right — animated phone */}
        <div className="relative z-10 flex justify-center">
          <HeroShowcase />
        </div>
      </div>
    </section>
  );
}
