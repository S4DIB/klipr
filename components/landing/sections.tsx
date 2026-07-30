import { Reveal } from "@/components/motion/reveal";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { NextCue } from "@/components/landing/next-cue";
import { ArrowEast } from "@/components/ui/button";
import {
  IconSearch,
  IconUpload,
  IconWallet,
  IconUsers,
  IconVerified,
  IconBolt,
  IconFilter,
  IconLink,
  IconChart,
} from "@/components/icons";

/* Shared section header: display heading, centered. */
function Header({
  title,
  sub,
}: {
  title: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Reveal>
        <h2 className="display text-[clamp(2rem,4.4vw,3.2rem)] text-text-hi">
          {title}
        </h2>
      </Reveal>
      {sub && (
        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-[48ch] text-lg leading-relaxed text-text-mid">
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
      icon: <IconSearch size={20} strokeWidth={1.5} />,
    },
    {
      n: "02",
      t: "Post the clip",
      d: "Post it to your page. Then paste the link back into Klipr.",
      icon: <IconUpload size={20} strokeWidth={1.5} />,
    },
    {
      n: "03",
      t: "Get paid per view",
      d: "Views are verified automatically. ৳50 per 1,000 verified views, paid to your bKash.",
      icon: <IconWallet size={20} strokeWidth={1.5} />,
    },
  ];
  return (
    <section id="how" className="relative py-16 md:py-20">
      <div className="shell">
        <Header
          title="Three steps to your first payout."
          sub="No media kit. No brand deals. If your page is active, you can earn."
        />

        {/* journey line — numbered nodes on a flowing energy conveyor */}
        <Reveal delay={0.1}>
          <div className="relative mt-16 hidden gap-6 md:grid md:grid-cols-3">
            <div
              aria-hidden
              className="flow-line-violet absolute left-[16.67%] right-[16.67%] top-1/2 h-[3px] -translate-y-1/2 rounded-full"
            />
            {steps.map((s, i) => (
              <div key={s.n} className="relative flex justify-center">
                <span className="relative grid h-11 w-11 place-items-center rounded-full border border-volt-500/30 bg-volt-500 font-mono text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(125,4,215,0.5)]">
                  <span
                    aria-hidden
                    className="pulse-ring absolute inset-0 rounded-full border border-volt-500/50"
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
              <div className="glass glass-hover group relative h-full overflow-hidden p-8">
                {/* ghost numeral */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -bottom-6 right-2 select-none font-mono text-[110px] font-bold leading-none text-volt-500/[0.06] transition-colors duration-300 group-hover:text-volt-500/[0.12]"
                >
                  {s.n}
                </span>
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-volt-500/10 text-volt-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    {s.icon}
                  </span>
                  <span className="font-mono text-sm font-semibold text-volt-500">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl text-text-hi">{s.t}</h3>
                <p className="mt-2 text-text-mid">{s.d}</p>
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
/* Match the product's iconography: one consistent Royal-Violet accent on a soft
   violet tile for every feature tile (green/amber stay reserved for status, as
   in the app). Keyed the same way so the data below is untouched. */
const ACCENTS = {
  mint: { tile: "bg-volt-500/10 text-volt-600", hover: "hover:border-volt-400/50" },
  pink: { tile: "bg-volt-500/10 text-volt-600", hover: "hover:border-volt-400/50" },
  yellow: { tile: "bg-volt-500/10 text-volt-600", hover: "hover:border-volt-400/50" },
  aqua: { tile: "bg-volt-500/10 text-volt-600", hover: "hover:border-volt-400/50" },
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
      icon: <IconUsers size={20} strokeWidth={1.5} />,
    },
    {
      t: "Verified views only",
      d: "Every view is checked before it counts. Bots and bought views are flagged and never paid.",
      accent: "mint",
      icon: <IconVerified size={20} strokeWidth={1.5} />,
    },
    {
      t: "Fast payouts",
      d: "Campaign closes. Views lock. Money goes to your bKash. No invoices, no waiting.",
      accent: "yellow",
      icon: <IconBolt size={20} strokeWidth={1.5} />,
    },
    {
      t: "Campaigns that fit your page",
      d: "Filter by niche, platform and rate. Post the ones you'd post anyway.",
      accent: "aqua",
      icon: <IconFilter size={20} strokeWidth={1.5} />,
    },
    {
      t: "Three platforms, one place",
      d: "TikTok, Instagram Reels, YouTube Shorts. Run every page you own from one account.",
      accent: "pink",
      icon: <IconLink size={20} strokeWidth={1.5} />,
    },
    {
      t: "One honest dashboard",
      d: "Every clip. Every verified view. Every taka. You see exactly what you earned.",
      accent: "mint",
      icon: <IconChart size={20} strokeWidth={1.5} />,
    },
  ];

  return (
    <section id="features" className="shell py-16 md:py-24">
      <Header
        title="Built so every view pays."
        sub="No media kit, no gatekeepers, just the things that turn a view into money in your account."
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => {
          const a = ACCENTS[f.accent];
          return (
            <Reveal key={f.t} delay={(i % 3) * 0.08}>
              <div
                className={`group glass glass-hover h-full p-7 ${a.hover}`}
              >
                <span
                  className={`grid h-11 w-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${a.tile}`}
                >
                  {f.icon}
                </span>
                <h3 className="display mt-5 text-lg text-text-hi">{f.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-text-mid">{f.d}</p>
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
      d: "Real pages across our network post your clip to their own audiences, in their own voice, not as an ad.",
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
        title="Your content, distributed everywhere."
        sub="You have content. We get it posted by real pages, to their own audiences, all at once. One upload turns into dozens of posts, reaching people who've never heard of you."
      />

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.1}>
            <div className="group glass glass-hover h-full p-7 hover:border-volt-400/50">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-volt-500/10 font-mono text-sm font-semibold text-volt-600">
                {s.n}
              </span>
              <h3 className="display mt-5 text-lg text-text-hi">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-text-mid">{s.d}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.2}>
        <div className="mt-10 flex flex-col items-center gap-5 text-center">
          <p className="max-w-[42ch] text-lg text-text-mid">
            Your campaign ends with two things. Real views. And the clip that
            worked best.
          </p>
          <a
            href="#waitlist-brand"
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-volt-500 px-6 text-[14px] font-semibold tracking-tight text-white shadow-[0_3px_8px_-2px_rgba(125,4,215,0.35)] transition-all duration-200 hover:bg-violet-700 hover:shadow-[0_6px_16px_-4px_rgba(125,4,215,0.42)] active:scale-[0.98]"
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
          <h2 className="display mx-auto max-w-[16ch] text-[clamp(2.4rem,5.5vw,4.2rem)] text-text-hi pb-[0.1em]">
            Your next post could be{" "}
            <span className="text-volt-grad">your first payout.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-[44ch] text-lg text-text-mid">
            Klipr is launching soon. Waitlist members get in first.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="glass mx-auto mt-10 max-w-xl p-6 text-left sm:p-8">
            <WaitlistForm variant="light" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
