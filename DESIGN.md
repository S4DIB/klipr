# KLIPR — Design & Architecture (V2, as built)

The source of truth for how the Klipr product looks and works. Reflects the
V2 build (gated access, tiers & XP, automatic verification). For deployment
see **[PRODUCTION.md](./PRODUCTION.md)**; for the full build rationale see
**[KLIPR-BUILD-PLAN.md](./KLIPR-BUILD-PLAN.md)** and
**`Klipr Product Flows v2.pdf`** (the product source of truth).

---

## 1. What Klipr is

A content-rewards marketplace, Bangladesh-first. Brands escrow a budget;
**vetted** clippers post the brand's ready-made clip to their own pages and
earn **৳50 / 1,000 verified views** (brands pay **৳60 / 1,000**; the spread is
the margin). Views verify **automatically** against platform APIs; after a
7-day tracking window they lock and pay to **bKash**.

**The V2 pillars**
- **Gated access (the Upwork model):** apply → human vetting against the
  Clipper Standard (active 3 weeks · posting 3–5×/week · real engagement) →
  let in. No follower minimums; no instant accounts.
- **Tiers & XP:** Beginner → Hustler → Pro → Elite. XP from verified
  performance unlocks privileges (submission caps, early access) — **never a
  different rate**.
- **Automatic verification:** OAuth-connected accounts + direct platform APIs.
  YouTube live day one; TikTok/IG/FB run clearly-labeled **Simulated** until
  each platform's app review passes (`VERIFY_MODE_*` flips them live).
- **Exactly five human touchpoints:** application vetting · escrow funding
  confirmation · NID verification · fraud hold review · bKash payout
  execution. Everything else is the sweep.

---

## 2. Visual direction — "Klipr Glass"

Apple-like light glassmorphism on the official brand kit (`Klipr/` folder):
frosted ivory panels over soft brand-color gradient fields, Dark Amethyst ink,
Vibrant Yellow signal.

- **Tokens & recipes:** `app/globals.css` (`KLIPR GLASS` section) — radii
  rhythm 14/22/28, glass alphas via `color-mix`, amethyst-tinted elevation
  (e1–e3), `.field-app` gradient field, `.glass` / `.glass-strong` /
  `.glass-well` (no blur) / `.glass-ink` (max one per screen).
- **Type:** Stack Sans Headline (display) · Stack Sans Text (body) ·
  Martian Mono (every number, tabular). Mono eyebrows with section indices
  ("01 / HOME") are the signature.
- **Icons:** the curated brand set in repo-root `Functional Icons/`,
  code-generated to `components/icons/index.tsx` by `npm run icons`
  (currentColor, non-scaling-stroke). Fallback source: `Klipr/Icons/`.
- **Charts:** hand-rolled SVG only — `components/ui/sparkline.tsx`,
  `budget-bar.tsx`, the XP bar. No chart libs, no shadcn/radix.
- **Motion:** the existing system (Lenis, Reveal/MaskReveal, CountUp,
  Magnetic, RisePanel) with `lib/use-reduced-motion.ts` as a kill-switch.
- **Mobile:** floating glass bottom tab bar with a raised yellow Submit
  button (`components/app/tab-bar.tsx`).
- **Honesty rule (absolute):** no fabricated counts, earnings, testimonials
  or activity anywhere. Empty states state the truth; simulated verification
  always wears the `Simulated` chip.

The shipped dark landing (`app/page.tsx` + `components/landing/*`) is
untouched; its redesign plan lives in `LANDING-REDESIGN.md`.

---

## 3. Product architecture

### Routes
- `/` landing · `/login` (Google or 5 stub identities) · `/apply` + `/apply/status`
  (the application) · `/onboarding` (post-approval: connect vetted pages →
  bKash → tier welcome)
- `(app)/`: `/home`, `/campaigns`, `/campaigns/[id]`, `/clips`, `/clips/[id]`,
  `/wallet`, `/connections`, `/settings`, `/leaderboard` — clipper + agency
  (gated: role ∈ {clipper, agency} AND access === "active")
- `/brand`: overview, `campaigns/new` (wizard), `campaigns/[id]`, `billing`,
  `settings`
- `/admin`: ops home + sweep trigger, `applications` (vetting console),
  `campaigns` (funding), `payouts` (bKash run), `fraud`, `clippers`, `leads`
- API: `/api/cron/sweep` (CRON_SECRET) · `/api/connect/youtube[/callback]`
  (OAuth) · `/api/waitlist*` (landing, unchanged)
- Dev-only QA (404 in production): `/dev-login`, `/dev-submit`, `/dev-sweep`,
  `/styleguide`

### Data model (`lib/db/types.ts`)
Profile (role, **access**, tier, xpTotal, streakWeeks, bkashNumber,
nidStatus + encrypted NID) · Application + ApplicationPage (the vetting
queue) · ConnectedAccount (vetted-page provenance, oauth|simulated proof,
encrypted tokens) · Campaign (escrowed budget, fixed rate snapshots,
minQualifyViews 2–4k, per-clipper cap, submission cap, early access, 7d
window) · Submission (canonical URL + mediaId dedup, baseline→counted→locked
views) · ViewSnapshot · XpEvent · **LedgerEntry (zero-sum events, unique
(event_id, account) ⇒ idempotent)** · PayoutBatch (queued|blocked_nid|…|paid)
· FraudFlag.

**Money is integer poisha.** `lib/money.ts` (settlement math: escrow clamp +
cap clamp + qualification minimum) · `lib/ledger.ts` (zero-sum event
builders) · `lib/xp.ts` (XP_CONFIG — draft constants, structure locked) —
all unit-tested (`npm test`, 45+ assertions).

### The sweep (`lib/verify/sweep.ts`)
Every ~15 min: baseline pending → poll open windows (snapshot + fraud rules)
→ settle closed windows (ledger + XP + streak + tier recompute, idempotent)
→ campaign lifecycle (settling → refund → completed). Overlap-guarded.
Adapters: `lib/verify/youtube.ts` (live with `YOUTUBE_API_KEY`),
`lib/verify/others.ts` (simulated until platform approvals).

### Dual-mode persistence
`lib/db/index.ts` facade → Supabase (`supabase-impl.ts`, RLS + service-role
split) when configured, else the JSON store (`store.ts`, v3 seed with five
"Demo" identities). Migration: `supabase/migrations/0004_v2_schema.sql`
(includes the transactional `settle_submission` function).

---

## 4. Production readiness
- RLS on every table; token/NID columns service-role only; AES-256-GCM at
  rest (`lib/crypto.ts`, `TOKEN_KEY`).
- Guards in every server action (`lib/auth/guards.ts`) — Next 16 actions
  bypass the proxy matcher by design.
- Security headers (`next.config.ts`), env validation (`lib/env.ts` +
  `lib/env.server.ts`), `vercel.json` cron (Hobby needs an external pinger).
- Verified: `npm test` green · `tsc` clean · `eslint` 0 errors ·
  `next build` passes · full stub-mode E2E (apply → vet → submit → sweep →
  settle → payout) with a global ledger zero-sum of 0.

*⚡ Klipr — the platform for clipping content.*
