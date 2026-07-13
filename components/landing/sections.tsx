import { Reveal } from "@/components/motion/reveal";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { NextCue } from "@/components/landing/next-cue";
import { ArrowEast } from "@/components/ui/button";
import { BoltMark } from "@/components/ui/logo";
import {
  TikTokIcon,
  InstagramIcon,
  YouTubeIcon,
  FacebookIcon,
} from "@/components/ui/platform-icons";

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
      d: "Browse live campaigns from brands and creators. Filter by niche, platform and pay rate.",
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
      d: "Post the content to your page following the brief, then drop the link back in to start tracking.",
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
      d: "Views are verified automatically. The more your clip pulls, the more you earn. Paid out fast.",
      icon: <span className="text-lg font-bold leading-none">৳</span>,
    },
  ];
  return (
    <section id="how" className="relative py-24 md:py-28">
      <div className="shell">
        <Header
          kicker="02 · How it works"
          title="Three steps to your first payout."
          sub="No follower minimums. No watch hours. If you can post, you can earn."
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
      t: "Verified views only",
      d: "Every view is checked before it counts toward a payout. Bots and bought spikes are flagged and never paid.",
      accent: "mint",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M12 2 4 5.5v5.2c0 5 3.4 9.2 8 10.3 4.6-1.1 8-5.3 8-10.3V5.5L12 2Z" />
          <path d="m8.5 12 2.4 2.4L15.5 9.5" />
        </svg>
      ),
    },
    {
      t: "No follower minimum",
      d: "A page with 900 followers earns by the exact same rule as one with 900K: per verified view. Clout is optional.",
      accent: "pink",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11ZM2.5 20c0-3.3 2.9-5.8 6.5-5.8s6.5 2.5 6.5 5.8" />
          <path d="M16 10.6a2.8 2.8 0 1 0-1.4-5.3M17.4 14.6c2.4.6 4.1 2.4 4.1 4.9" />
        </svg>
      ),
    },
    {
      t: "Fast, clean payouts",
      d: "Campaign closes, views lock, money goes out — proportional to the views you pulled. No invoices, no net-30.",
      accent: "yellow",
      icon: <BoltMark className="h-5" />,
    },
    {
      t: "Briefs that fit your niche",
      d: "Campaigns are tagged by niche, platform and rate. Pick the ones you'd post anyway — memes to tech to sports.",
      accent: "aqua",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M4 5h16M7 12h10M10 19h4" />
        </svg>
      ),
    },
    {
      t: "Four platforms, one place",
      d: "Run the same campaign across every page you own — and agencies roll all their pages into a single payout.",
      accent: "pink",
      icon: (
        <span className="grid grid-cols-2 gap-[3px]">
          <TikTokIcon className="h-3 w-3" />
          <InstagramIcon className="h-3 w-3" />
          <YouTubeIcon className="h-3 w-3" />
          <FacebookIcon className="h-3 w-3" />
        </span>
      ),
    },
    {
      t: "One honest dashboard",
      d: "Every clip, every verified view, every taka — tracked from submission to payout. What you see is what you get paid.",
      accent: "mint",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M5 21V11M12 21V4M19 21v-8" />
        </svg>
      ),
    },
  ];

  return (
    <section id="features" className="shell py-24 md:py-32">
      <Header
        kicker="03 · What you get"
        title="Built so every view pays."
        sub="Not a gig board, not a brand-deal broker — a marketplace with verification and payouts built into the rails."
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

      {/* the other side of the marketplace — Pink Carnation colorway
          (brand guideline p14) so the one brand-facing line pops */}
      <Reveal delay={0.15}>
        <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-[var(--radius)] bg-pink px-8 py-7 text-center shadow-[0_28px_64px_-32px_rgba(255,123,192,0.4)] sm:flex-row sm:text-left">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-volt-600/70">
              Running a brand?
            </p>
            <p className="mt-1.5 max-w-[44ch] font-medium text-volt-600">
              Fund a budget, write a brief, and pay only for verified views.
              Dozens of pages posting your content at once.
            </p>
          </div>
          <a
            href="#waitlist"
            className="group inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-volt-600 px-6 text-[14px] font-semibold tracking-tight text-pink transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
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
    <section id="waitlist" className="relative py-24 md:py-32">
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
            Klipr is launching soon. Waitlist members get in first — and see
            the first funded campaigns before anyone else.
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
