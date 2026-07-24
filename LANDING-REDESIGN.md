# LANDING-REDESIGN — bring the landing into Klipr Glass

> Self-contained, execute-whenever plan to redesign the shipped dark landing
> page so it matches the Klipr Glass product app defined in
> `KLIPR-BUILD-PLAN.md`. **Prerequisite: the app's Phase 1 (design system) must
> be merged first** — this plan reuses its tokens, recipes, and icon pipeline.
> Until this plan is executed, the current dark landing stays live untouched.

---

## 1. Objective & hard constraints

**Objective:** one visual language across landing and app — frosted ivory glass
over brand-color gradient fields — while keeping everything that already works.

**Hard constraints (do not break):**
- The waitlist/leads pipeline stays byte-compatible: `app/api/waitlist/route.ts`
  request/response shape, honeypot field name (`contact_time`), UTM capture,
  `components/site/waitlist-modal.tsx` open-by-anchor behavior
  (`a[href="#waitlist"]` / `#waitlist-brand`), `lib/leads/*`, CSV export, and
  the flow documented in `LEADS.md`.
- SEO/metadata unchanged: `app/layout.tsx` metadata block, `robots.ts`,
  `sitemap.ts`, OG copy.
- The landing stays at `app/page.tsx` (no new route).
- The honesty rule holds: **no fabricated views, earnings, testimonials, or
  logos anywhere.** The proof strip stays hidden until real payouts exist.
- Copy stays the approved landing copy (rates ৳50/৳60 per 1,000, bKash, four
  platforms) — this is a *visual* redesign; copy changes are listed explicitly
  in §5 and are the only ones allowed.
- **Flows v2 alignment:** once the product's gated access model ships
  (`Klipr Product Flows v2.pdf`), the landing's framing must match it — Klipr
  is *applied to*, not signed up for. The §5 copy changes implement this.

---

## 2. Key decision — surface strategy

**Chosen: Option A — "night → daylight" hybrid (recommended).**

Keep the dark amethyst hero (the shipped identity: `--abyss`/`--volt-600`
canvas, yellow logo, yellow CTAs) and transition into **light glass sections**
that match the app from "How it works" onward. The scroll story: you arrive at
night (attention, drama), and the product sections read in daylight (trust,
clarity) — ending on the waitlist form in the same light glass as the real app
the user will eventually enter.

- Transition mechanism: reuse the existing `PixelDissolve` strip
  (`components/ui/pixel-dissolve.tsx`) at the dark→light boundary, recolored to
  dissolve from amethyst into ivory.
- Logo variant map: **yellow** (`Primary 01`) on dark sections, **amethyst**
  (`Primary 02`) on light sections. `components/ui/logo.tsx` already uses
  currentColor — set per-section text color, done.
- Nav: keep the floating glass capsule, but it adapts — transparent-dark over
  the hero, `.glass-strong` (light) once scrolled past the boundary.

**Option B (documented alternative, not chosen):** full light-glass landing on
`.field-app` end-to-end. Cleaner consistency, but discards the shipped dark
identity and weakens hero contrast for the yellow logo/CTAs. Revisit only if
Option A's boundary feels gimmicky in the build.

---

## 3. Section-by-section mapping

| Existing component | Action | Notes |
|---|---|---|
| `components/site/nav.tsx` | **Restyle** | Scroll-adaptive: dark-glass over hero → light `.glass-strong` after the boundary; amethyst logo + ink links on light |
| `components/landing/backdrop.tsx` | **Rebuild** | Hero keeps a dark amethyst field; below the boundary, swap to `.field-app` tokens (pink/violet/mint/yellow pools on ivory) |
| `components/landing/bolt-field.tsx` | **Restyle** | Keep in hero only (dark). Remove from light sections — patterns follow the app rules (§1.6 of the build plan) |
| `components/landing/hero.tsx` | **Restyle** | Keep copy + layout; CTAs become the app's pill Button styles; trust row uses `components/ui/platform-icons.tsx` unchanged |
| `components/landing/phone-mockup.tsx` | **Replace content** | The phone now shows the **real V2 clipper home screen** (glass wallet tile, tracking clip rows) instead of the invented iOS mockup — same bob/motion shell |
| `components/landing/demo-video.tsx` | **Restyle** | Keep the 4-scene scripted walkthrough; recolor scenes to Klipr Glass; scene 3 shows the real "views verify automatically" UI with the `Simulated`/live chip |
| `components/landing/sections.tsx` — HowItWorks | **Restyle + copy** | First light-glass section. Steps become the real pipeline: pick campaign → post & paste link → **views verify automatically** → money lands in bKash |
| `components/landing/sections.tsx` — Features | **Restyle** | Six cards → `.glass` cards with `Functional Icons` (generated `components/icons`), mono eyebrow indices |
| `components/landing/sections.tsx` — ForBrands | **Restyle** | `.glass-ink` statement panel (the one-per-screen amethyst surface) with the Ads-vs-Klipr comparison; "Get early access" still opens the **brand** form |
| `components/landing/sections.tsx` — FinalCta | **Restyle** | Light glass, Magnetic on the single primary CTA |
| Live campaign cards (if/when added) | **Rule** | Must render **real active campaigns from `@/lib/db`** — honest zero-state pre-launch ("No live campaigns yet — waitlist members see them first"), never fabricated cards |
| `components/landing/faq.tsx` | **Restyle + copy** | Light glass accordion; update the verification answer to describe the real mechanism (connected accounts + platform APIs + tracking window) |
| `components/landing/next-cue.tsx` | **Keep** | Recolor per section context |
| `components/landing/waitlist-form.tsx` | **Restyle only** | Keep all three theme variants working; glass variant aligns to `.glass-strong`; field logic, honeypot, UTM untouched |
| `components/site/waitlist-modal.tsx` | **Restyle only** | visionOS-style glass already — align blur/border values to the app recipes |
| `components/site/footer.tsx` | **Restyle** | Light ivory footer, amethyst logo, same links |
| `components/ui/clip-card.tsx` | **Keep** | Decorative only; recolor |
| `components/landing/earn-calculator.tsx`, `clip-marquee.tsx` | **Already deleted** | Removed in build-plan Phase 0 (dead code) |

---

## 4. New sections (small, both light glass)

1. **Rates trust panel** — after HowItWorks: three `.glass` tiles set in
   Martian Mono — `৳50 / 1,000 views` (what you earn) · `Verified
   automatically` (how it's counted) · `Paid to bKash` (where it lands) — each
   with its one-line honest mechanic underneath. No invented numbers; these are
   the three claims the whole product stands on.
2. **Platform row with honesty chips** — the four platform icons; any platform
   whose adapter is still simulated at the time of execution carries a small
   `Coming soon` chip (per the build plan's launch policy: real-money campaigns
   are YouTube-only until Meta/TikTok reviews pass).

---

## 5. Copy changes allowed (exhaustive list)

- **Primary clipper CTA becomes "Apply as a Clipper"** (flows v2: application,
  not an instant account — no "sign up free" / "join free" language anywhere).
  Pre-launch, "Join the waitlist" may remain; at product launch the CTA and the
  waitlist form's framing switch to the application language.
- HowItWorks gains the vetting truth: step 1 or its subline says pages are
  **reviewed by hand for real activity** before campaigns unlock ("Apply. We
  review every page. Then you earn."). This is a trust asset — lead with it,
  don't hide it.
- HowItWorks step 3 subline may say "Views are verified automatically —
  straight from the platform." (aligns with the shipped product truth).
- FAQ "How are views verified?" answer updated to mention connected accounts +
  the tracking window.
- FAQ "Do I need a big following?" answer updated to match the Clipper
  Standard: no follower minimum, but the page must be genuinely active —
  reviewed by a human, not an algorithm.
- Everything else: keep the approved landing copy verbatim.

---

## 6. Motion & perf budget

- **LCP rule:** the hero headline (LCP element) must not sit inside a
  `backdrop-filter` layer; no blur above the fold except the nav capsule.
- Blur budget: ≤ 4 backdrop-filter layers per viewport (same as the app).
- Survivors from the current CSS: `aurora-a/b` (hero only), `bob` (phone),
  `cue-down`, `pulse-ring`. Retire in light sections: `pixel-grid` full-bleed
  usage, marquee tracks (unless the clip wall returns with real clips).
- `prefers-reduced-motion` branch must remain a full kill-switch (already
  global in `app/globals.css`).
- Targets: Lighthouse mobile ≥ 90 perf / ≥ 95 a11y; no CLS from the
  dark→light boundary (reserve the dissolve strip's height).

---

## 7. Rollout & verification

1. Build on a branch (`landing-glass`); the landing is live — never redesign on
   `main` directly.
2. Per-section screenshot diff (before/after, mobile + desktop) — review each
   section against the mapping table above.
3. **Waitlist regression:** POST `/api/waitlist` with a clipper payload and a
   brand payload → both land in leads (stub file or Supabase); CSV export
   (`/api/waitlist/export?token=…`) unchanged; modal still opens from every
   `#waitlist` / `#waitlist-brand` anchor, including nav and footer.
4. iPhone-width walkthrough: hero → boundary → light sections → form submit →
   success state.
5. `npm test && npx tsc --noEmit && npm run lint && npm run build` before merge.
