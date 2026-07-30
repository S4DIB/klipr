"use client";

import { useReducedMotion } from "@/lib/use-reduced-motion";
import {
  InstagramIcon,
  YouTubeIcon,
} from "@/components/ui/platform-icons";
import { ClipCard } from "@/components/ui/clip-card";

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

/** The hero phone — a real screenshot of the Klipr app (the campaigns
 *  marketplace, mobile) inside a titanium iPhone frame. Not a re-drawing: it's
 *  the actual product UI. Asset: public/brand/app-mockup.png — re-capture the
 *  /campaigns screen at a phone viewport if the app UI changes. */
export function HeroShowcase() {
  const reduce = useReducedMotion();
  const bob = (d: number, delay = 0) =>
    reduce ? undefined : { animation: `bob ${d}s ease-in-out ${delay}s infinite` };

  return (
    <div className="relative flex justify-center">
      {/* soft brand-color halo behind the phone — violet + pink pools on ivory */}
      <div aria-hidden className="pointer-events-none absolute inset-[-120px]">
        <div
          className="absolute left-1/2 top-[40%] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, rgba(125,4,215,0.22), transparent 62%)" }}
        />
        <div
          className="absolute left-1/2 top-[66%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
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
            className="relative h-[596px] w-[292px] rounded-[50px] p-[3px] shadow-[0_60px_120px_-32px_rgba(53,5,90,0.45),0_0_80px_-24px_rgba(125,4,215,0.3)]"
            style={{
              background:
                "linear-gradient(145deg, #6b6280 0%, #211c30 22%, #47405c 50%, #17121f 78%, #524a68 100%)",
            }}
          >
            {/* black bezel */}
            <div className="h-full w-full rounded-[47px] bg-black p-[7px]">
              {/* app screen — a full screenshot of the real Klipr app (status
                  bar + home indicator baked in, tab bar floated clear of the
                  screen's rounded corners), so there are no compositing seams.
                  The frame only overlays the dynamic island. */}
              <div className="relative h-full w-full overflow-hidden rounded-[40px] bg-[#fffff4]">
                <img
                  src="/brand/app-mockup.png"
                  alt="The Klipr app — browse live campaigns and earn per verified view"
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />

                <DynamicIsland />

                {/* glass reflection — a whisper of light on the top corner only,
                    kept faint so it never washes out the screen content */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[40px]"
                  style={{
                    background:
                      "linear-gradient(118deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 14%, transparent 26%)",
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
