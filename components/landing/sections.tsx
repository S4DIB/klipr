import { Reveal } from "@/components/motion/reveal";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { NextCue } from "@/components/landing/next-cue";
import { ArrowEast } from "@/components/ui/button";
import { BoltMark } from "@/components/ui/logo";

/* Shared section header — friendly eyebrow + display heading, centered. */
function Header({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Reveal>
        <p className="eyebrow mb-4" style={{ color: "var(--yellow)" }}>
          {kicker}
        </p>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="display text-[clamp(2rem,4.4vw,3.2rem)] text-ink-900">
          {title}
        </h2>
      </Reveal>
      {sub && (
        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-[48ch] text-lg leading-relaxed text-white/65">
            {sub}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/* Chapter 02 — the path. 3 steps on an animated journey line. */
export function HowItWorks() {
  const steps = [
    {
      n: "01",
      t: "Find a campaign",
      d: "Browse live campaigns. Filter by niche, platform and rate.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20.5 20.5-4.2-4.2" />
        </svg>
      ),
    },
    {
      n: "02",
      t: "Post the clip",
      d: "Post it to your page. Then paste the link back into Klipr.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M12 15V4m0 0L8 8m4-4 4 4" />
          <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </svg>
      ),
    },
    {
      n: "03",
      t: "Get paid per view",
      d: "Views are verified automatically. ৳50 per 1,000 verified views, paid to your bKash.",
      icon: <span className="text-lg font-bold leading-none">৳</span>,
    },
  ];
  return (
    <section id="how" className="relative py-16 md:py-20">
      <div className="shell">
        <Header
          kicker="02 · How it works"
          title="Three steps to your first payout."
          sub="No media kit. No brand deals. If your page is active, you can earn."
        />

        {/* journey line — numbered nodes on a flowing energy conveyor */}
        <Reveal delay={0.1}>
          <div className="relative mt-16 hidden gap-6 md:grid md:grid-cols-3">
            <div
              aria-hidden
              className="flow-line absolute left-[16.67%] right-[16.67%] top-1/2 h-[3px] -translate-y-1/2 rounded-full"
            />
            {steps.map((s, i) => (
              <div key={s.n} className="relative flex justify-center">
                <span className="relative grid h-11 w-11 place-items-center rounded-full border border-yellow/60 bg-volt-600 font-mono text-sm font-semibold text-yellow">
                  <span
                    aria-hidden
                    className="pulse-ring absolute inset-0 rounded-full border border-yellow/50"
                    style={{ animationDelay: `${i * 0.9}s` }}
                  />
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="mt-8 grid gap-6 md:mt-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12}>
              <div className="group relative h-full overflow-hidden rounded-[var(--radius)] border border-white/12 bg-white/[0.06] p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-yellow/40 hover:bg-white/[0.09] hover:shadow-[0_28px_64px_-28px_rgba(250,255,71,0.35)]">
                {/* ghost numeral */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -bottom-6 right-2 select-none font-mono text-[110px] font-bold leading-none text-white/[0.05] transition-colors duration-300 group-hover:text-yellow/[0.08]"
                >
                  {s.n}
                </span>
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-yellow/10 text-yellow transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    {s.icon}
                  </span>
                  <span className="font-mono text-sm font-semibold text-yellow">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl text-ink-900">{s.t}</h3>
                <p className="mt-2 text-white/65">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <NextCue href="#features" label="So what do you actually get?" />
      </div>
    </section>
  );
}

/* Chapter 03 — the value. Every card is a promise the product already keeps
 * (DESIGN.md §3): verification, thresholds, rollups, payout engine.
 * Each card carries one brand accent — the whole palette, one grid. */
const ACCENTS = {
  mint: { tile: "bg-mint/10 text-mint", hover: "hover:border-mint/40" },
  pink: { tile: "bg-pink/10 text-pink", hover: "hover:border-pink/40" },
  yellow: { tile: "bg-yellow/10 text-yellow", hover: "hover:border-yellow/40" },
  aqua: { tile: "bg-aqua/10 text-aqua", hover: "hover:border-aqua/40" },
} as const;

export function Features() {
  const features: {
    t: string;
    d: string;
    accent: keyof typeof ACCENTS;
    icon: React.ReactNode;
  }[] = [
    {
      t: "Active pages, not big ones",
      d: "You don't need a blue tick. You don't need a media kit. You need a page that posts and people who watch.",
      accent: "pink",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11ZM2.5 20c0-3.3 2.9-5.8 6.5-5.8s6.5 2.5 6.5 5.8" />
          <path d="M16 10.6a2.8 2.8 0 1 0-1.4-5.3M17.4 14.6c2.4.6 4.1 2.4 4.1 4.9" />
        </svg>
      ),
    },
    {
      t: "Verified views only",
      d: "Every view is checked before it counts. Bots and bought views are flagged and never paid.",
      accent: "mint",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M12 2 4 5.5v5.2c0 5 3.4 9.2 8 10.3 4.6-1.1 8-5.3 8-10.3V5.5L12 2Z" />
          <path d="m8.5 12 2.4 2.4L15.5 9.5" />
        </svg>
      ),
    },
    {
      t: "Fast payouts",
      d: "Campaign closes. Views lock. Money goes to your bKash. No invoices, no waiting.",
      accent: "yellow",
      icon: <BoltMark className="h-5" />,
    },
    {
      t: "Campaigns that fit your page",
      d: "Filter by niche, platform and rate. Post the ones you'd post anyway.",
      accent: "aqua",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M4 5h16M7 12h10M10 19h4" />
        </svg>
      ),
    },
    {
      t: "Three platforms, one place",
      d: "TikTok, Instagram Reels, YouTube Shorts. Run every page you own from one account.",
      accent: "pink",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 10.5 15.4 6.5M8.6 13.5l6.8 4" />
        </svg>
      ),
    },
    {
      t: "One honest dashboard",
      d: "Every clip. Every verified view. Every taka. You see exactly what you earned.",
      accent: "mint",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M5 21V11M12 21V4M19 21v-8" />
        </svg>
      ),
    },
  ];

  return (
    <section id="features" className="shell py-16 md:py-24">
      <Header
        kicker="03 · What you get"
        title="Built so every view pays."
        sub="No media kit, no gatekeepers — just the things that turn a view into money in your account."
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => {
          const a = ACCENTS[f.accent];
          return (
            <Reveal key={f.t} delay={(i % 3) * 0.08}>
              <div
                className={`group h-full rounded-[var(--radius)] border border-white/12 bg-white/[0.06] p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.09] ${a.hover}`}
              >
                <span
                  className={`grid h-11 w-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${a.tile}`}
                >
                  {f.icon}
                </span>
                <h3 className="display mt-5 text-lg text-ink-900">{f.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/65">{f.d}</p>
              </div>
            </Reveal>
          );
        })}
      </div>

      <NextCue href="#brands" label="Running a brand? This next part's for you." />
    </section>
  );
}

/* Chapter 04 — for brands (spec §6). Clients are half the waitlist, so they get
 * a real section, not a strip. Pink Carnation accents; CTA opens the BRAND form. */
export function ForBrands() {
  const steps = [
    {
      n: "01",
      t: "Fund a campaign",
      d: "Set your budget. Write a short brief. Upload your content.",
    },
    {
      n: "02",
      t: "The network posts",
      d: "Real pages post your clip to their own audiences.",
    },
    {
      n: "03",
      t: "Pay per verified view",
      d: "৳60 per 1,000 verified views. No agency fee. No creative fee.",
    },
  ];
  return (
    <section id="brands" className="shell py-16 md:py-24">
      <Header
        kicker="04 · For brands"
        title="Pay for views. Not for hope."
        sub="Ads charge you when your video appears. We charge you when someone watches. Dozens of real pages post your content at once — you pay for the views they bring."
      />

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.1}>
            <div className="group h-full rounded-[var(--radius)] border border-white/12 bg-white/[0.06] p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-pink/40 hover:bg-white/[0.09]">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-pink/10 font-mono text-sm font-semibold text-pink">
                {s.n}
              </span>
              <h3 className="display mt-5 text-lg text-ink-900">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/65">{s.d}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* cost model — placeholder until the first real campaign-results card exists */}
      <Reveal delay={0.15}>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius)] border border-white/12 bg-white/[0.05] p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">
              Ads
            </p>
            <p className="mt-2 text-lg text-white/70">
              You pay when your video <span className="text-white">appears</span>.
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-pink/40 bg-pink/10 p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-pink">
              Klipr
            </p>
            <p className="mt-2 text-lg text-ink-900">
              You pay when someone <span className="text-pink">watches</span>.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="mt-10 flex flex-col items-center gap-5 text-center">
          <p className="max-w-[42ch] text-lg text-white/70">
            Your campaign ends with two things. Real views. And the clip that
            worked best.
          </p>
          <a
            href="#waitlist-brand"
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-pink px-6 text-[14px] font-semibold tracking-tight text-volt-600 transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
          >
            Get early access
            <ArrowEast />
          </a>
        </div>
      </Reveal>

      <NextCue href="#faq" label="Still have questions?" />
    </section>
  );
}

/* The close — the story ends where it began: same world, and now the form
 * is the hero. */
export function FinalCta() {
  return (
    <section id="waitlist" className="relative py-16 md:py-24">
      {/* scattered yellow bolts live in the page-wide <BoltField/> */}
      <div className="shell relative text-center">
        <Reveal>
          <p className="eyebrow mb-4" style={{ color: "var(--yellow)" }}>
            Last step
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="display mx-auto max-w-[16ch] text-[clamp(2.4rem,5.5vw,4.2rem)] text-ink-900 pb-[0.1em]">
            Your next post could be{" "}
            <span className="text-yellow">your first payout.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-[44ch] text-lg text-white/65">
            Klipr is launching soon. Waitlist members get in first.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mx-auto mt-10 max-w-xl text-left">
            <WaitlistForm variant="dark" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
