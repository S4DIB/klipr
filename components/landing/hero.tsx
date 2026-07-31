"use client";

import { MaskReveal, Reveal } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/magnetic";
import { ArrowEast } from "@/components/ui/button";
import { HeroShowcase } from "@/components/landing/phone-mockup";
import {
  TikTokIcon,
  InstagramIcon,
  YouTubeIcon,
} from "@/components/ui/platform-icons";

/* The flat brand bolt (Klipr/Bolt), matched to the scattered <BoltField/>.
 * "violet" = Royal Violet (#7d04d7, --volt-500); "yellow" = Vibrant Yellow. */
function PatternBolt({
  variant = "yellow",
  className,
}: {
  variant?: "yellow" | "violet";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 133.26 265.91"
      aria-hidden="true"
      className={className}
      style={{ aspectRatio: "133.26 / 265.91" }}
    >
      <image
        href={variant === "yellow" ? "/brand/bolt-flat-yellow.svg" : "/brand/bolt-flat-royal-violet.svg"}
        width="133.26"
        height="265.91"
      />
    </svg>
  );
}

/* Chapter 00 — the hook. One message, one primary action; everyone not ready
 * to convert is sent DOWN the page (to the demo), never away from it. */
export function Hero() {
  return (
    <section className="relative pt-36 pb-16">
      {/* background lives in the page-wide <Backdrop/>; scattered yellow bolts
          live in <BoltField/> — the hero's world continues through every
          section below */}

      <div className="shell grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
        {/* left — the hook */}
        <div className="relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left">
          <Reveal>
            <p className="mb-6 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-volt-500">
              <PatternBolt variant="violet" className="h-4 w-auto" />
              Post · Earn · Repeat
              <PatternBolt variant="violet" className="h-4 w-auto -scale-x-100" />
            </p>
          </Reveal>

          <h1 className="display text-[clamp(2.8rem,5.8vw,5rem)] font-bold">
            <MaskReveal
              lines={["Stop posting", "for free."]}
              lineClassName="block pb-[0.08em]"
              lineClassNames={["text-text-hi", "text-volt-grad"]}
            />
          </h1>

          <Reveal delay={0.15}>
            <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-text-mid">
              You already post clips every day. Now they pay. Pick a campaign,
              post to your page, earn on every{" "}
              <span className="font-semibold text-volt-500">view</span>.
            </p>
          </Reveal>

          <Reveal delay={0.25}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Magnetic>
                <a
                  href="#waitlist"
                  className="group inline-flex h-[52px] items-center gap-2 rounded-full bg-volt-500 px-7 text-[15px] font-semibold tracking-tight text-white shadow-[0_3px_8px_-2px_rgba(125,4,215,0.35)] transition-all duration-200 hover:bg-violet-700 hover:shadow-[0_6px_16px_-4px_rgba(125,4,215,0.42)] active:scale-[0.98]"
                >
                  Join the waitlist
                  <ArrowEast />
                </a>
              </Magnetic>
              <a
                href="#demo"
                className="inline-flex h-[52px] items-center gap-2.5 rounded-full border border-line bg-white/50 px-7 text-[15px] font-medium text-text-hi backdrop-blur-sm transition-colors duration-200 hover:border-volt-400 hover:text-volt-600"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-volt-500/10 text-volt-600">
                  <svg width="9" height="11" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
                    <path d="M0 0l12 7-12 7V0Z" />
                  </svg>
                </span>
                Watch it work · 15 sec
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.35}>
            <div className="mt-7 flex items-center justify-center gap-4 text-text-low lg:justify-start">
              <TikTokIcon className="h-4 w-4" />
              <InstagramIcon className="h-4 w-4" />
              <YouTubeIcon className="h-4 w-4" />
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
