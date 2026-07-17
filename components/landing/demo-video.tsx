"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Reveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { NextCue } from "@/components/landing/next-cue";
import { ArrowEast } from "@/components/ui/button";
import { BoltMark } from "@/components/ui/logo";
import { ClipCard } from "@/components/ui/clip-card";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import {
  TikTokIcon,
  InstagramIcon,
  YouTubeIcon,
} from "@/components/ui/platform-icons";

/* Chapter 01 — see it. A phone-shaped scripted demo on the continuous
 * hero-world: four scenes, story progress bars, CTA end-card.
 * Pre-launch we show the real product loop as a mockup — no fake footage, no
 * invented traction. When a real demo video ships, swap in a <video> here. */

const SCENE_MS = 3750; // 4 scenes ≈ 15s, matching the "15 sec" promise
const EASE = [0.16, 1, 0.3, 1] as const;

const SCENES = [
  {
    label: "Pick a campaign",
    still: "Browse funded campaigns and pick one that fits your niche and platform.",
  },
  {
    label: "Post & drop the link",
    still: "Post the clip to your own page, then paste the link back to start tracking.",
  },
  {
    label: "Views verify",
    still: "Every view is checked before it counts — bots and bought spikes never pay.",
  },
  {
    label: "Money lands",
    still: "The campaign closes, views lock, and your payout goes straight to your bKash.",
  },
];

/* ── Scene 1 — two live campaign cards, the second one gets picked ── */
function SceneBrowse() {
  const rows = [
    { tag: "KL", name: "Klipr · Meme Drop", niche: "Memes", rate: "৳50 / 1K", picked: false },
    { tag: "KL", name: "Klipr · Sports Reels", niche: "Sports", rate: "৳50 / 1K", picked: true },
  ];
  return (
    <div className="w-[min(400px,86%)] space-y-3">
      {rows.map((r, i) => (
        <motion.div
          key={r.tag}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.2 + i * 0.25 }}
          className="relative rounded-2xl border border-white/12 bg-white/[0.07] p-4 backdrop-blur-sm"
        >
          {r.picked && (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-2xl border-2 border-yellow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7, duration: 0.3 }}
            />
          )}
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/90 text-[11px] font-bold text-volt-600">
              {r.tag}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-semibold text-white">{r.name}</p>
              <p className="text-[11px] text-white/55">
                {r.niche} · <TikTokIcon className="inline h-3 w-3" />{" "}
                <InstagramIcon className="inline h-3 w-3" />
              </p>
            </div>
            <span className="font-mono text-[12px] font-semibold text-yellow">{r.rate}</span>
          </div>
          {r.picked && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ delay: 2.1, duration: 0.35, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="mt-3 grid h-9 place-items-center rounded-lg bg-yellow text-[12px] font-semibold tracking-tight text-volt-600">
                Join campaign
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/* ── Scene 2 — the link gets pasted, tracking starts ── */
function ScenePost() {
  return (
    <div className="w-[min(400px,86%)]">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
        className="rounded-2xl border border-white/12 bg-white/[0.07] p-5 backdrop-blur-sm"
      >
        <p className="text-left text-[11px] font-medium uppercase tracking-wider text-white/55">
          Your post link
        </p>
        <div className="mt-2 flex h-11 items-center overflow-hidden rounded-xl border border-white/15 bg-black/25 px-3.5">
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: "auto" }}
            transition={{ delay: 0.7, duration: 1.3, ease: "linear" }}
            className="overflow-hidden whitespace-nowrap font-mono text-[12px] text-white/85"
          >
            tiktok.com/@yourpage/video/7291…
          </motion.span>
          <motion.span
            aria-hidden
            className="ml-0.5 h-4 w-[2px] shrink-0 bg-yellow"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
          />
        </div>
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: [1, 0.96, 1] }}
          transition={{ delay: 2.3, duration: 0.3 }}
          className="mt-3 grid h-10 place-items-center rounded-xl bg-yellow text-[13px] font-semibold tracking-tight text-volt-600"
        >
          Submit clip
        </motion.div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.8, duration: 0.35 }}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-[11px] font-medium text-mint"
      >
        <BoltMark className="h-2.5" />
        Tracking started
      </motion.p>
    </div>
  );
}

/* ── Scene 3 — views tick up and get verified ── */
function SceneVerify() {
  return (
    <div className="text-center">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/55"
      >
        Verified views
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
        className="mt-2 font-mono text-[clamp(2.6rem,7vw,4rem)] font-semibold tracking-tight text-white"
      >
        <CountUp to={48200} duration={2.2} />
      </motion.p>
      <motion.p
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.5, duration: 0.3 }}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-3.5 py-1.5 text-[12px] font-medium text-mint"
      >
        <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M2.5 7.5 6 11l5.5-7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Human-checked · bots don&rsquo;t count
      </motion.p>
    </div>
  );
}

/* ── Scene 4 — the payout receipt (48,200 views × ৳50/1K = ৳2,410) ── */
function ScenePaid() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: EASE, delay: 0.25 }}
      className="w-[min(340px,86%)] rounded-2xl bg-ink-900 p-6 text-left shadow-[0_32px_80px_-24px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center gap-3">
        <motion.span
          className="grid h-10 w-10 place-items-center rounded-full bg-ok/15"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.7, duration: 0.35, ease: EASE }}
        >
          <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2.5 7.5 6 11l5.5-7" stroke="#0a8f4f" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
        <div>
          <p className="text-sm font-semibold text-text-hi">Payout sent</p>
          <p className="text-xs text-text-low">Klipr · campaign closed</p>
        </div>
      </div>
      <p className="mt-4 font-mono text-4xl font-semibold tracking-tight text-volt-600">
        ৳2,410
      </p>
      <p className="mt-2 text-xs text-text-mid">
        48,200 verified views × ৳50 per 1K, straight to bKash.
      </p>
    </motion.div>
  );
}

const SCENE_VIEWS = [SceneBrowse, ScenePost, SceneVerify, ScenePaid];

type Phase = "poster" | "playing" | "done";

/* The poster reads like a paused vertical video: dimmed frames from the story
 * behind a pulsing play button, DEMO + duration chips on top. */
function Poster({ onPlay }: { onPlay: () => void }) {
  return (
    <>
      {/* top chips — video player affordance */}
      <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm">
          <BoltMark className="h-2.5 text-yellow" />
          Demo
        </span>
        <span className="rounded-full bg-black/30 px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-white/80 backdrop-blur-sm">
          0:15
        </span>
      </div>

      {/* dimmed story frames peeking through */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-45">
        <div className="absolute left-1/2 top-[13%] w-[80%] -translate-x-1/2 -rotate-3 rounded-2xl border border-white/12 bg-white/[0.07] p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/90 text-[11px] font-bold text-volt-600">
              KL
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-semibold text-white">
                Klipr · Meme Drop
              </p>
              <p className="text-[11px] text-white/55">Memes</p>
            </div>
            <span className="font-mono text-[12px] font-semibold text-yellow">৳50 / 1K</span>
          </div>
        </div>
        <div className="absolute bottom-[14%] left-1/2 w-[64%] -translate-x-1/2 rotate-2 rounded-2xl bg-ink-900/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-text-hi">Payout sent</span>
            <span className="font-mono text-[13px] font-semibold text-volt-600">৳2,410</span>
          </div>
        </div>
      </div>

      {/* the invitation */}
      <div className="absolute inset-0 z-10 grid place-items-center">
        <div className="text-center">
          <span className="relative mx-auto block h-20 w-20">
            <span
              aria-hidden
              className="pulse-ring absolute inset-0 rounded-full border-2 border-yellow/50"
            />
            <motion.button
              type="button"
              onClick={onPlay}
              aria-label="Play the 15-second demo"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              className="grid h-20 w-20 place-items-center rounded-full bg-yellow shadow-[0_18px_56px_-12px_rgba(250,255,71,0.6)]"
            >
              <svg width="22" height="26" viewBox="0 0 12 14" fill="var(--volt-600)" aria-hidden="true" className="ml-1">
                <path d="M0 0l12 7-12 7V0Z" />
              </svg>
            </motion.button>
          </span>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.24em] text-white/70">
            Press play · 15 seconds
          </p>
        </div>
      </div>
    </>
  );
}

function Player() {
  const [phase, setPhase] = useState<Phase>("poster");
  const [scene, setScene] = useState(0);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = setTimeout(() => {
      if (scene < SCENES.length - 1) setScene(scene + 1);
      else setPhase("done");
    }, SCENE_MS);
    return () => clearTimeout(id);
  }, [phase, scene]);

  const play = () => {
    setScene(0);
    setPhase("playing");
  };

  const ActiveScene = SCENE_VIEWS[scene];

  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[400px] overflow-hidden rounded-[28px] border border-white/12 bg-[#1b0433] shadow-[0_44px_90px_-32px_rgba(0,0,0,0.65)]">
      {/* electric texture + corner glows, same voice as the hero */}
      <div
        aria-hidden
        className="pixel-grid pointer-events-none absolute inset-0"
        style={{
          maskImage: "radial-gradient(85% 85% at 50% 20%, #000 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(85% 85% at 50% 20%, #000 0%, transparent 80%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(250,255,71,0.16), transparent 65%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,123,192,0.15), transparent 65%)" }}
      />

      {/* story-style segmented progress */}
      {phase !== "poster" && (
        <div className="absolute inset-x-4 top-4 z-20 flex gap-1.5">
          {SCENES.map((s, i) => (
            <span key={s.label} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
              {(phase === "done" || i < scene) && <span className="block h-full w-full bg-yellow" />}
              {phase === "playing" && i === scene && (
                <motion.span
                  key={scene}
                  className="block h-full w-full origin-left bg-yellow"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: SCENE_MS / 1000, ease: "linear" }}
                />
              )}
            </span>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "poster" && (
          <motion.div
            key="poster"
            className="absolute inset-0"
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
          >
            <Poster onPlay={play} />
          </motion.div>
        )}

        {phase === "playing" && (
          <motion.div
            key={`scene-${scene}`}
            className="absolute inset-0 z-10 grid place-items-center p-6 pt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
          >
            <ActiveScene />
          </motion.div>
        )}

        {/* end-card — the conversion moment inside the video */}
        {phase === "done" && (
          <motion.div
            key="done"
            className="absolute inset-0 z-10 grid place-items-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/55">
                That&rsquo;s the whole loop
              </p>
              <p className="display mt-3 text-[clamp(1.6rem,3.6vw,2.4rem)] text-ink-900">
                Post. Verify. <span className="text-yellow">Get paid.</span>
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#waitlist"
                  className="group inline-flex h-12 items-center gap-2 rounded-full bg-yellow px-6 text-[14px] font-semibold tracking-tight text-volt-600 transition-all duration-200 hover:brightness-95 active:scale-[0.98]"
                >
                  Join the waitlist
                  <ArrowEast />
                </a>
                <button
                  type="button"
                  onClick={play}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 px-6 text-[14px] font-medium text-white transition-colors hover:border-white/50 hover:bg-white/10"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Replay
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* scene caption */}
      {phase === "playing" && (
        <p className="absolute bottom-4 left-5 z-20 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
          {`0${scene + 1}`} · {SCENES[scene].label}
        </p>
      )}
    </div>
  );
}

/** Static storyboard for reduced-motion users — same story, no autoplay. */
function Storyboard() {
  return (
    <div className="mx-auto grid max-w-[400px] gap-3 rounded-[28px] border border-white/12 bg-[#1b0433] p-5 shadow-[0_44px_90px_-32px_rgba(0,0,0,0.65)]">
      {SCENES.map((s, i) => (
        <div key={s.label} className="rounded-2xl border border-white/12 bg-white/[0.06] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-yellow">
            {`0${i + 1}`} · {s.label}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{s.still}</p>
        </div>
      ))}
    </div>
  );
}

export function DemoVideo() {
  const reduce = useReducedMotion();
  const bob = (d: number, delay = 0) =>
    reduce ? undefined : { animation: `bob ${d}s ease-in-out ${delay}s infinite` };

  return (
    <section id="demo" className="relative py-16 md:py-20">
      <div className="shell">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="eyebrow mb-4" style={{ color: "var(--yellow)" }}>
              01 · Watch
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="display text-[clamp(2rem,4.4vw,3.2rem)] text-ink-900">
              Klipr in 15 seconds.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-[48ch] text-lg leading-relaxed text-white/70">
              No deck. No demo call. This is the whole product — from picking
              a campaign to money landing.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="relative mt-14">
            {/* clips floating around the phone, like the hero */}
            <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
              <div
                className="absolute left-[10%] top-[16%] -rotate-[10deg] xl:left-[16%]"
                style={bob(8, -1)}
              >
                <ClipCard clip={{ grad: "from-[#ff7bc0] to-[#7d04d7]", Icon: InstagramIcon, views: "1.2M", handle: "@meme.factory" }} />
              </div>
              <div
                className="absolute right-[10%] bottom-[14%] rotate-[10deg] xl:right-[16%]"
                style={bob(9, -2.5)}
              >
                <ClipCard clip={{ grad: "from-[#14f9c5] to-[#35055a]", Icon: YouTubeIcon, views: "486K", handle: "@hoopsdaily" }} />
              </div>
            </div>

            {reduce ? <Storyboard /> : <Player />}
          </div>
        </Reveal>

        <NextCue href="#how" label="See how it works" />
      </div>
    </section>
  );
}
