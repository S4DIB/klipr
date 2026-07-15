"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import {
  TikTokIcon,
  InstagramIcon,
  YouTubeIcon,
} from "@/components/ui/platform-icons";
import { ClipCard } from "@/components/ui/clip-card";
import { BoltMark } from "@/components/ui/logo";

const CPM = 50; // Taka per 1,000 verified views (clipper rate)
const BASE = 84200;

const NAV_TABS = [
  { label: "Home", active: false, icon: <path d="M3 11l9-7 9 7M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" /> },
  { label: "Browse", active: false, icon: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /> },
  { label: "Earnings", active: true, icon: <path d="M5 21V11M12 21V4M19 21v-8" /> },
  { label: "You", active: false, icon: <path d="M12 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 12 11ZM5 20c0-3.4 3.1-6 7-6s7 2.6 7 6" /> },
];

/* iOS status bar — time left, signal/wifi/battery right. */
function StatusBar() {
  return (
    <div className="flex h-[50px] items-center justify-between px-4 text-white">
      <span className="w-12 text-center font-sans text-[12px] font-semibold tracking-tight">
        9:41
      </span>
      <span className="flex items-center gap-1.5">
        {/* cellular */}
        <svg width="15" height="10" viewBox="0 0 16 11" fill="currentColor" aria-hidden="true">
          <rect x="0" y="7" width="3" height="4" rx="0.8" />
          <rect x="4.3" y="5" width="3" height="6" rx="0.8" />
          <rect x="8.6" y="2.5" width="3" height="8.5" rx="0.8" />
          <rect x="12.9" y="0" width="3" height="11" rx="0.8" />
        </svg>
        {/* wifi */}
        <svg width="14" height="10" viewBox="0 0 15 11" fill="currentColor" aria-hidden="true">
          <path d="M7.5 10.6 5.06 8.15a3.46 3.46 0 0 1 4.88 0L7.5 10.6ZM3.3 6.4a5.95 5.95 0 0 1 8.4 0l-1.42 1.42a3.95 3.95 0 0 0-5.56 0L3.3 6.4ZM.5 3.6a9.9 9.9 0 0 1 14 0l-1.41 1.41a7.9 7.9 0 0 0-11.18 0L.5 3.6Z" />
        </svg>
        {/* battery */}
        <svg width="22" height="11" viewBox="0 0 25 12" aria-hidden="true">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="currentColor" strokeOpacity="0.4" />
          <rect x="2" y="2" width="15" height="8" rx="1.6" fill="currentColor" />
          <path d="M23 4v4a2.2 2.2 0 0 0 0-4Z" fill="currentColor" fillOpacity="0.4" />
        </svg>
      </span>
    </div>
  );
}

/* Dynamic Island with the front camera lens. */
function DynamicIsland() {
  return (
    <div className="absolute left-1/2 top-[13px] z-20 flex h-[24px] w-[86px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-2 ring-1 ring-white/[0.06]">
      <span className="relative h-[11px] w-[11px] rounded-full bg-[#101018]">
        <span className="absolute left-[3px] top-[3px] h-[5px] w-[5px] rounded-full bg-[#1b2c4e]" />
        <span className="absolute left-[4px] top-[4px] h-[2px] w-[2px] rounded-full bg-[#3f6ab5]/80" />
      </span>
    </div>
  );
}

/** The hero phone — live, continuously-ticking view + earnings counters. */
export function HeroShowcase() {
  const reduce = useReducedMotion();
  const [views, setViews] = useState(BASE);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setViews((v) => (v > 760000 ? BASE : v + Math.floor(60 + Math.random() * 220)));
    }, 90);
    return () => clearInterval(id);
  }, [reduce]);

  const earned = (views / 1000) * CPM;
  const bob = (d: number, delay = 0) =>
    reduce ? undefined : { animation: `bob ${d}s ease-in-out ${delay}s infinite` };

  return (
    <div className="relative flex justify-center">
      {/* pixelated color pool behind the phone */}
      <div aria-hidden className="pixel-cells pointer-events-none absolute inset-[-120px]">
        <div
          className="absolute left-1/2 top-[40%] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(250,255,71,0.2), transparent 62%)" }}
        />
        <div
          className="absolute left-1/2 top-[66%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,123,192,0.24), transparent 66%)" }}
        />
      </div>

      {/* phone anchor (no transform — cards position relative to this) */}
      <div className="relative">
        {/* clips peeking from behind the phone */}
        <div
          className="absolute -right-16 -top-5 z-0 hidden rotate-[12deg] xl:block"
          style={bob(7.5)}
        >
          <ClipCard clip={{ grad: "from-[#9a2ee8] to-[#35055a]", Icon: YouTubeIcon, views: "3.4M", handle: "@cutsdaily" }} />
        </div>
        <div
          className="absolute -left-16 bottom-3 z-0 hidden -rotate-[12deg] xl:block"
          style={bob(8.5, -1)}
        >
          <ClipCard clip={{ grad: "from-[#14f9c5] to-[#7d04d7]", Icon: InstagramIcon, views: "840K", handle: "@dailyhoops" }} />
        </div>

        {/* ── the phone — titanium rail, black bezel, OLED screen ── */}
        <div className="relative z-10" style={bob(6)}>
          {/* side buttons on the rail */}
          <div aria-hidden>
            <span className="absolute -left-[2px] top-[104px] h-[22px] w-[3px] rounded-l-sm bg-gradient-to-b from-[#57506b] via-[#241f33] to-[#57506b]" />
            <span className="absolute -left-[2px] top-[148px] h-[38px] w-[3px] rounded-l-sm bg-gradient-to-b from-[#57506b] via-[#241f33] to-[#57506b]" />
            <span className="absolute -left-[2px] top-[196px] h-[38px] w-[3px] rounded-l-sm bg-gradient-to-b from-[#57506b] via-[#241f33] to-[#57506b]" />
            <span className="absolute -right-[2px] top-[168px] h-[58px] w-[3px] rounded-r-sm bg-gradient-to-b from-[#57506b] via-[#241f33] to-[#57506b]" />
          </div>

          {/* titanium frame */}
          <div
            className="relative h-[596px] w-[292px] rounded-[50px] p-[3px] shadow-[0_60px_120px_-32px_rgba(0,0,0,0.7),0_0_80px_-24px_rgba(250,255,71,0.25)]"
            style={{
              background:
                "linear-gradient(145deg, #6b6280 0%, #211c30 22%, #47405c 50%, #17121f 78%, #524a68 100%)",
            }}
          >
            {/* black bezel */}
            <div className="h-full w-full rounded-[47px] bg-black p-[7px]">
              {/* OLED screen */}
              <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[40px] bg-[#1b0433]">
                <DynamicIsland />
                <StatusBar />

                {/* app bar */}
                <div className="flex items-center justify-between px-5 pb-2.5 pt-3">
                  <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold lowercase tracking-tight text-yellow">
                    <BoltMark className="h-[0.9em]" />
                    klipr
                  </span>
                  <span className="relative grid h-7 w-7 place-items-center rounded-full bg-white/[0.07]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-white/80">
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M10.3 21a1.9 1.9 0 0 0 3.4 0" />
                    </svg>
                    <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-yellow" />
                  </span>
                </div>

                {/* section header */}
                <div className="flex items-baseline justify-between px-4 pb-2">
                  <span className="text-[13px] font-semibold text-white">Live campaigns</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-yellow">
                    12 open
                  </span>
                </div>

                {/* campaign card — image-backed */}
                <div className="relative mx-3 flex flex-1 flex-col justify-end overflow-hidden rounded-2xl ring-1 ring-white/10">
                  <img
                    src="/brand/campaign-creator.jpg"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-[50%_28%]"
                  />
                  {/* brand tint + legibility gradient */}
                  <div className="absolute inset-0 bg-[#35055a]/25 mix-blend-multiply" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14022a] via-[#14022a]/30 to-[#14022a]/45" />

                  {/* top chips */}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2 py-1 text-[9px] font-medium text-white backdrop-blur-sm">
                      <TikTokIcon className="h-3 w-3" /> TikTok
                    </span>
                  </div>

                  {/* bottom: title + meta + CTA */}
                  <div className="relative space-y-2 p-3">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-yellow text-[10px] font-bold text-volt-600">
                        <BoltMark className="h-3" />
                      </span>
                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-[12px] font-semibold text-white">
                          Klipr · Meme Drop
                        </p>
                        <p className="text-[9px] text-white/60">by Klipr</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="rounded-md bg-white/12 px-1.5 py-0.5 text-[8.5px] text-white/85 backdrop-blur-sm">
                        Ends 27 Sept
                      </span>
                      <span className="rounded-md bg-white/12 px-1.5 py-0.5 text-[8.5px] text-white/85 backdrop-blur-sm">
                        312 clippers in
                      </span>
                      <span className="rounded-md bg-white/12 px-1.5 py-0.5 font-mono text-[8.5px] text-yellow backdrop-blur-sm tabular-nums">
                        ৳{(earned / 1000).toFixed(1)}k paid
                      </span>
                    </div>
                    <div className="grid h-9 place-items-center rounded-lg bg-yellow text-[12px] font-semibold tracking-tight text-volt-600">
                      Join campaign
                    </div>
                  </div>
                </div>

                <div className="h-3" />

                {/* bottom tab bar */}
                <nav className="flex items-center justify-around border-t border-white/10 px-2 pb-2 pt-3">
                  {NAV_TABS.map((t) => (
                    <span
                      key={t.label}
                      className={`flex flex-col items-center gap-1 ${
                        t.active ? "text-yellow" : "text-white/35"
                      }`}
                    >
                      <svg
                        width="21"
                        height="21"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        {t.icon}
                      </svg>
                      <span className="text-[9px] font-medium">{t.label}</span>
                    </span>
                  ))}
                </nav>

                {/* home indicator */}
                <div className="mx-auto mb-2 h-1 w-28 rounded-full bg-white/30" />

                {/* glass reflection */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[40px]"
                  style={{
                    background:
                      "linear-gradient(118deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 26%, transparent 42%)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
