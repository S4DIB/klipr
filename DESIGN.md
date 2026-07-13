# KLIPR — Design & Architecture (as built)

The source of truth for how Klipr looks and works. Reflects what shipped. For
deployment see **[PRODUCTION.md](./PRODUCTION.md)**.

---

## 1. What Klipr is

A **content-rewards marketplace**: brands fund a campaign with a budget;
**clippers** (individuals) and **agencies** post the content to their own pages
and earn **per verified view**, paid out of the budget proportionally. Generic
`৳`/`$` currency, global framing (the earlier bKash/Bangladesh specificity was
removed).

Three sides: **Clients/brands** (fund), **Clippers/Agencies** (post & earn),
**Admins** (verify, close, pay). V1 verifies views **manually** (a human records
the count) — no platform-API tracking yet.

---

## 2. Visual direction — "daylight, electric"

Landing benchmarked against the genre leaders (Vyro, Whop, contentrewards,
clipaffiliates): money-forward headline, dual-audience CTA, proof numbers,
3-step how-it-works, live campaign cards, an earnings-proof mockup, FAQ.

**Mood:** clean white, soft rounded type, electric-blue identity, real motion.

### Color (`app/globals.css` tokens)
- Base: white page `#fbfcff`, cool near-white surfaces (`--ink-850/800/700`), hairlines `--line`.
- Text: deep ink `--text-hi #0c1633`, blue-grey `--text-mid`, captions `--text-low`.
- **Electric blue "signal":** `--volt-500 #2e5bff` (primary), `--volt-600 #1a3ad8`
  (deep — AA on white for small text), `--volt-400` hover. Headlines use the
  `.text-volt-grad` blue gradient.
- Accent: `--ok` (verified/paid green). One blurred-glow budget; no neon spam.

### Type
- **Display:** Plus Jakarta Sans (soft, rounded, friendly — replaced the sharp Space Grotesk).
- **Body:** Hanken Grotesk. **Data/mono:** Martian Mono (tabular figures so live counters never jitter).
- Self-hosted via `next/font` (no CLS, no runtime fetch).

### Motion (`components/motion/*`, `globals.css`)
- Lenis smooth-scroll on one GSAP RAF loop; Motion for reveals, magnetic CTA,
  count-ups; CSS for the aurora, clip-wall marquee, and phone bob.
- **Reduced-motion + low-power are a first-class branch** (`lib/use-reduced-motion.ts`):
  counters freeze, marquee/aurora/bob stop, smooth-scroll off.

### Landing structure (`app/page.tsx`)
Hero (two columns: blue-gradient headline + dual CTA on the left; an **animated
phone mockup** with live-ticking view/earnings counters, a bottom tab-bar, and
floating payout/clip cards on the right) → live clip-wall marquee → 3-step
how-it-works → live campaign cards → earnings-proof dashboard →
for-clippers / for-brands → FAQ → CTA → footer.

---

## 3. Product architecture (V1, built)

### Routes
- `/` landing · `/login` (Google) · `/onboarding` (gated form)
- `/marketplace`, `/campaign/[id]` (+ submit), `/dashboard` — clipper app (`(app)` group)
- `/admin` — verify queue, close campaign, payout batch
- `/auth/callback` — OAuth code exchange

### Auth & the forced onboarding gate
- **Dual-mode** (`lib/auth/session.ts`): Supabase Google OAuth when configured, else a cookie stub.
- `proxy.ts` (Next 16's renamed Middleware): refreshes the Supabase session +
  optimistic redirect of logged-out users. **Real gates in layouts:**
  `app/(app)/layout.tsx` enforces signed-in **and** `profileCompleted` →
  `/onboarding`; `app/admin/layout.tsx` enforces `role === 'admin'`.
- Onboarding (`app/onboarding`): **Individual / Agency** choice + payout number +
  page/handle/platform/followers, **Zod-validated**, flips `profileCompleted`.

### Data model (`lib/db/types.ts`)
`profile` (role individual|agency|admin, payoutNumber, profileCompleted) ·
`campaign` (budget, minViewThreshold, allowedPlatforms, status) ·
`submission` (postUrl unique, platform, postingHandle, status, verifiedViews) ·
`payout` (viewsUsed, amount, status, txnRef — snapshotted at close).

**Dual-mode persistence** (`lib/db/index.ts`): async facade → Supabase
(`supabase-impl.ts`, RLS-enforced) when configured, else the local JSON store
(`store.ts`). Call sites only import `@/lib/db`.

### Payout engine (`lib/payout.ts` — unit-tested, 8 cases)
`earnings = floor((account_views / total_qualifying_views) × budget)`, where
qualifying = `verified` **and** ≥ `minViewThreshold`. **Agency rollup**: an
account's many clips are summed and paid once. Floor rounding means the total
**never exceeds budget**; divide-by-zero guarded.

### Submission integrity (built-in)
Unique post URL (no duplicate submissions), platform must match the campaign's
allowed platforms, individuals submit once / agencies many, manual verification
records the view count, rejected/below-threshold excluded from payout.

---

## 4. Production readiness
- **RLS** on all tables, `is_admin()` SECURITY DEFINER, service-role key server-only.
- Security headers (`next.config.ts`), typed **env validation** (`lib/env.ts`).
- `error.tsx`, `not-found.tsx`, route `loading.tsx`, `robots.ts`, `sitemap.ts`, OG metadata.
- **CI** (`.github/workflows/ci.yml`): test → typecheck → lint → build.
- Verified: `npm test` (8/8), `tsc` clean, `next build` passes.

## 5. Stubbed / next
- Supabase + Google need **your** project + credentials (drop-in — see PRODUCTION.md);
  the integration is wired and type-safe but runtime-tested by you with creds.
- Manual view verification is by design for V1.
- Follow-ups: Storage for clips/proof, transactional notifications, agency
  sub-clipper view, client self-serve campaign creation, CSP.

*⚡ Klipr — get paid per view.*
