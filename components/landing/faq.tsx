"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Reveal } from "@/components/motion/reveal";
import { BoltMark } from "@/components/ui/logo";

/* Chapter 04 — objections, handled. Ordered the way doubt actually arrives:
 * "can I?" → "is it real?" → "when's the money?" → "what's the catch?" */
const ITEMS = [
  {
    q: "Do I need a big following?",
    a: "No. There is no follower target. But your page has to be active — you post often and real people watch. A page that sits idle will not earn, because nobody sees the clip.",
  },
  {
    q: "How are views verified?",
    a: "We check views directly with the platform. Only real views count. Bots and bought views are flagged.",
  },
  {
    q: "When do I get paid?",
    a: "When the campaign closes and views are verified. Money goes straight to your bKash.",
  },
  {
    q: "Is this a scam?",
    a: "Fair question. You pay nothing to join, and nothing to post. If your clip gets no views you earn nothing — but you lose nothing either. Once campaigns start paying out, we'll show the real receipts right here.",
  },
  {
    q: "Do I have to edit the video?",
    a: "No. We give you the clip. You post it.",
  },
  {
    q: "I'm a brand. How does it work?",
    a: "You fund a campaign and pay only for verified views — ৳60 per 1,000.",
  },
];

function Row({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/12">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center justify-between gap-4 py-6 text-left"
        aria-expanded={open}
      >
        <span className="font-display text-lg text-white transition-colors group-hover:text-yellow">
          {q}
        </span>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/20 text-white/60 transition-colors group-hover:border-yellow/50 group-hover:text-yellow">
          <motion.svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          >
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </motion.svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-[60ch] pb-6 text-white/65">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  return (
    <section id="faq" className="shell relative isolate py-24 md:py-32">
      {/* soft pink ambience so the quiet chapter still glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-8 -z-10 h-[440px] w-[760px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,123,192,0.09), transparent 65%)" }}
      />
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <p className="eyebrow mb-4" style={{ color: "var(--yellow)" }}>
            04 · Fair questions
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="display text-[clamp(2rem,4.4vw,3.2rem)] text-ink-900">
            Still on the fence?
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-[46ch] text-lg leading-relaxed text-white/65">
            Fair. Here&rsquo;s everything people ask before they join.
          </p>
        </Reveal>
      </div>

      <Reveal delay={0.12}>
        <div className="mx-auto mt-12 max-w-2xl">
          {ITEMS.map((it) => (
            <Row key={it.q} {...it} />
          ))}
        </div>
      </Reveal>

      {/* every objection handled — hand them straight to the close */}
      <Reveal delay={0.15}>
        <p className="mt-14 text-center text-white/65">
          That&rsquo;s every question we get. Only one thing left —{" "}
          <a
            href="#waitlist"
            className="inline-flex items-baseline gap-1.5 font-semibold text-yellow underline decoration-yellow/40 underline-offset-4 transition-colors hover:text-yellow/80"
          >
            <BoltMark className="h-[0.8em] self-center" />
            claim your spot
          </a>
          .
        </p>
      </Reveal>
    </section>
  );
}
