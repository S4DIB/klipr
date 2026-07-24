# KLIPR — Full Product Build Plan (V2.1)

> The executable plan for building the complete Klipr product: gated clipper
> access (apply → vet → let in), tiers & XP, brand console, agency ("Network
> Manager") support, admin ops, automatic view verification, and the money
> engine. Aligned to **`Klipr Product Flows v2.pdf`** (the product source of
> truth — it supersedes the v1 flows).
>
> Repo: this repo · Next.js 16.2.9 · React 19.2.4 · Tailwind v4 · Zod v4
> Everything must run in **stub mode with zero config** (`npm run dev`, local
> JSON store) AND in **Supabase mode** (env set). The shipped dark landing page
> (`app/page.tsx` + `components/landing/*` + waitlist/leads pipeline) is
> **untouched** by this plan — its redesign lives in `LANDING-REDESIGN.md`.

---

## 0. Locked product decisions (do not relitigate)

- **What Klipr is:** brands escrow a budget; vetted clippers download the
  brand's ready-made clip, post it to their **own** pages, paste the post URL
  back; views verify **automatically** via direct platform APIs (Meta Graph
  API, TikTok API, YouTube Data API — never scraping); after the tracking
  window views lock and earnings pay to **bKash**.
- **Access model (v2 — the Upwork model):** there is **no instant marketplace
  account**. Every applicant lands on a **waitlist**. The team manually reviews
  each declared page against the **Clipper Standard** — active in the last 3
  weeks, posting 3–5×/week, real engagement (not follower count alone) — then
  grants access. No automated follower gate; the form collects information for
  the reviewer, not a threshold. Approved → `ACTIVE`; rejected → `DECLINED`
  with a reason, may reapply once the page is more active. Agencies apply the
  same way; **every page in an agency roster is vetted individually**.
- **Rates fixed platform-wide:** clipper earns **৳50 / 1,000** verified views —
  **identical at every tier, forever**; brand pays **৳60 / 1,000**; the spread
  is the margin. (Future: client-side tiered rates — ৳72 Pro-sourced / ৳90
  Elite — change what Klipr *charges brands*, never what a clipper earns. The
  data model must not preclude this; campaigns already snapshot their brand
  rate.) Budget = ceiling — campaign stops when spent or end date hit.
- **Tiers & XP (v2 — core flow, not a side feature):**
  **Beginner → Hustler → Pro → Elite.** XP is earned from verified performance
  and unlocks **access and privileges only** — never a different payout rate.
  XP formula (structure locked, constants TBD by founders):
  `XP = (verified views ÷ 100) + flat on-time campaign-completion bonus +
  consecutive-active-week streak bonus`. Fraud-flagged submissions earn zero XP
  and can reset a streak. Tier unlocks: Beginner = standard marketplace access
  + standard per-campaign submission cap · Hustler = higher submission cap +
  badge · Pro = early-access window on new campaigns + priority in Network
  Manager recruiting (requires clean fraud record) · Elite = first access to
  premium/high-budget campaigns + eligibility for future tiered-client-rate
  campaigns + top-of-leaderboard visibility.
- **Qualification minimum:** a submission must clear a **2,000–4,000 view
  minimum (set per campaign, default 2,000)** to qualify for payout.
  Tracking window: **7 days** (default).
- **Platforms:** TikTok, YouTube Shorts, Instagram Reels, Facebook Reels.
  **TikTok + YouTube are the default recommendation** (verification runs
  cleanest); Facebook Reels available but flagged secondary until Meta's review
  process matures. Engineering reality at launch: YouTube live day one (API
  key); TikTok next (Display API approval); Meta last (app review) — adapters
  make each flip a config change.
- **Payout compliance:** bKash number at setup; **NID verification is required
  before the first payout releases** — not before browsing or submitting.
- **Payout execution:** the system computes earnings automatically (ledger);
  an **admin executes the bKash transfer manually** and records it. bKash
  Payout API is a later drop-in behind the same PayoutBatch model.
- **Where humans sit (exactly five places — everything else is AUTO):**
  application vetting · escrow funding confirmation · NID verification · fraud
  hold release/uphold · bKash payout execution. **View verification is never
  manual.**
- **Design:** Apple-like **light glassmorphic** UI on the official brand kit
  (`Klipr/` folder). Icons from the repo-root **`Functional Icons/`** set. Must
  not read as AI-generated or shadcn-default. Mobile-first.
- **Honesty rule (absolute):** never fabricate proof — no invented view counts,
  earnings, testimonials, or activity. Empty states say the truth. Simulated
  verification is always labeled `Simulated`.

---

## 1. Design system — "Klipr Glass"

Light glass: frosted ivory panels floating over soft brand-color gradient
fields, Dark Amethyst ink, Vibrant Yellow signal accents. Everything **extends
`app/globals.css`** — the existing token block (`--ink-*`, `--text-*`,
`--volt-*`, `--yellow/--pink/--aqua/--mint`, `@theme inline` mappings,
`.shell`, `.eyebrow`, `.hairline`, the reduced-motion branch) stays. Append a
`/* ===== KLIPR GLASS ===== */` section; do not restart the file.

### 1.1 New tokens (append to `:root` + mirror in `@theme inline`)

```css
:root {
  /* Radii rhythm — deliberately off the shadcn 6/8px grid */
  --radius-panel: 28px;   /* hero panels, sheets, modals */
  --radius-card: 22px;    /* standard glass cards */
  --radius-control: 14px; /* inputs, selects, list rows (matches legacy --radius) */
  --radius-chip: 999px;   /* pills, badges, buttons */

  /* Glass surface alphas */
  --glass-bg: color-mix(in srgb, #fffff4 62%, transparent);
  --glass-bg-strong: color-mix(in srgb, #fffff4 78%, transparent);
  --glass-edge: rgba(255, 255, 255, 0.65);
  --glass-ink-bg: color-mix(in srgb, #35055a 88%, transparent);

  /* Elevation shadows — amethyst-tinted, never gray */
  --e1: 0 1px 2px rgba(53,5,90,.05), 0 16px 32px -20px rgba(53,5,90,.14);
  --e2: 0 1px 2px rgba(53,5,90,.06), 0 24px 48px -24px rgba(53,5,90,.18);
  --e3: 0 2px 4px rgba(53,5,90,.08), 0 40px 80px -32px rgba(53,5,90,.28);
}
```

### 1.2 Glass recipes (exact values)

```css
/* The gradient field — the ONLY page background inside the app shell. */
.field-app {
  background:
    radial-gradient(52rem 36rem at 12% -6%,  color-mix(in srgb, var(--pink) 26%, transparent), transparent 62%),
    radial-gradient(44rem 30rem at 88% 4%,   color-mix(in srgb, var(--volt-500) 13%, transparent), transparent 60%),
    radial-gradient(42rem 34rem at 76% 98%,  color-mix(in srgb, var(--mint) 22%, transparent), transparent 58%),
    radial-gradient(30rem 24rem at 4% 88%,   color-mix(in srgb, var(--yellow) 16%, transparent), transparent 55%),
    var(--ink-900);
}

/* e1 — standard card */
.glass {
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(20px) saturate(1.7);
  backdrop-filter: blur(20px) saturate(1.7);
  border: 1px solid var(--glass-edge);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.85), var(--e1);
  border-radius: var(--radius-card);
}

/* e2 — chrome: sticky header, bottom tab bar, drawers, popovers */
.glass-strong {
  background: var(--glass-bg-strong);
  -webkit-backdrop-filter: blur(24px) saturate(1.8);
  backdrop-filter: blur(24px) saturate(1.8);
  border: 1px solid rgba(255,255,255,.72);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.9), var(--e2);
}

/* Recessed well — inputs, URL fields, table zebra. NO blur (perf + hierarchy). */
.glass-well {
  background: rgba(53,5,90,.045);
  border: 1px solid rgba(53,5,90,.08);
  border-radius: var(--radius-control);
}

/* Amethyst ink glass — ONE per screen max: wallet hero, campaign money header */
.glass-ink {
  background: var(--glass-ink-bg);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid rgba(250,255,71,.18);
  color: #fffff4;
  box-shadow: var(--e3);
  border-radius: var(--radius-card);
}
```

**Hard rules:** max ~4 `backdrop-filter` layers per viewport; dense lists use
`.glass-well` or plain ivory; never nest blur inside blur. Interactive `.glass`
cards get a CSS-only hover: `translateY(-1px)` + shadow e1→e2.

### 1.3 Elevation scale

| Level | Use | Recipe |
|---|---|---|
| e0 | page field | `.field-app`, no shadow |
| e1 | cards, list panels | `.glass` |
| e2 | sticky chrome, popovers | `.glass-strong` |
| e3 | modals/sheets, `.glass-ink` heroes | `--e3` + `RisePanel` entrance |

### 1.4 Typography scale (fonts already wired in `app/layout.tsx`)

| Class | Font | Spec | Use |
|---|---|---|---|
| `.display-1` | Stack Sans Headline 600 | `clamp(2.1rem, 5vw, 3.25rem)`, tracking −0.02em | page hero, one per page |
| `.title` | Headline 600 | 22px | card/section titles |
| body | Stack Sans Text 400/500 | 15px / 1.6 | default |
| `.data-xl` | Martian Mono 600 | `clamp(1.6rem, 4vw, 2.25rem)`, tabular | wallet balance, big view counts — always `CountUp` |
| `.data-sm` | Martian Mono 400 | 12.5px tabular | table cells, ledger rows |
| `.eyebrow` | existing class | mono 11px uppercase | **section indices** ("01 / ACTIVE CAMPAIGNS") on every page — signature move |

### 1.5 Icon pipeline — build-time codegen

Source: `Functional Icons/` at repo root — 15 curated SVGs, uniform format
(`viewBox="0 0 14 14"`, `fill="none"`, hard-coded `stroke="#35055A"`, round
caps/joins, some `<clipPath>` wrappers).

- **New: `scripts/gen-icons.mjs`** (plain Node, zero deps): read every
  `Functional Icons/*/*.svg` → strip clipPath wrappers/defs →
  `stroke="#35055A"` → `currentColor` → kebab→camelCase attributes → add
  `vectorEffect="non-scaling-stroke"` → emit **one file**
  `components/icons/index.tsx` with named exports.
- **Contract:** `IconWallet({ size = 16, strokeWidth = 1.25, className })` —
  non-scaling-stroke + 1.25 default = crisp hairline icons at 16/20/24px.
- **Naming map:** `IconHome, IconCampaign, IconUpload, IconWallet, IconChart,
  IconBolt, IconCheck, IconClock, IconFlag, IconTrophy, IconBell, IconProfile,
  IconX, IconGear, IconBkash`. `IconTrophy` is the tier/leaderboard glyph;
  `IconClock` the waitlist/pending glyph; `IconFlag` fraud.
- `package.json`: `"icons": "node scripts/gen-icons.mjs"`. Commit output.
- **Fallback:** copy any missing icon from `Klipr/Icons/` (1001 Streamline
  Core, same format) into `Functional Icons/<Name>/` and re-run. Never mix a
  second icon style.

### 1.6 Pattern & logo usage rules

- `public/brand/pattern-01.svg`: only inside `.glass-ink` surfaces, masked
  corner accent, ≤ 8% opacity, `background-size ≥ 480px`. Max one per screen.
- `pattern-02*.svg` (3D): empty-state illustrations only.
- `Logo` / `BoltMark` (`components/ui/logo.tsx`, currentColor): amethyst on
  light, yellow on `.glass-ink`/dark. `BoltMark` replaces spinners/emoji:
  pulsing loader, active-tab dot, empty-state glyph.

### 1.7 Motion vocabulary (reuse only — no new deps)

`Reveal` (section entrances, stagger `i * 0.06`) · `MaskReveal` (one hero
headline per page) · `CountUp` (every money/view/XP number) · `RisePanel`
(sheets/modals; also the tier-upgrade celebration card) · `Magnetic` (exactly
one primary CTA per screen) · `SmoothScroll` stays global ·
`lib/use-reduced-motion.ts` governs everything new.

### 1.8 Mobile navigation — bottom tab bar

`components/app/tab-bar.tsx` (client): fixed bottom, floating
(`left/right/bottom: 10px`), `.glass-strong`, `border-radius:
var(--radius-panel)`, 64px + `env(safe-area-inset-bottom)`. 5 role-aware slots
(§2.2), icon 20px + mono 10px label. Active = amethyst text + 4px yellow
`BoltMark` dot. Clipper/agency center slot = **Submit**: raised 48px yellow
circle breaking the bar's top edge. Shown `< md`; content gets
`pb-[96px] md:pb-10`; `aria-current="page"`.

### 1.9 Anti-AI-generic principles (enforceable)

**Do:** ivory `#FFFFF4` base (never `#FFF`/gray-50) · amethyst-tinted shadows
only · mono eyebrows with section indices · tabular mono numbers · radii from
the 14/22/28 scale only · one `.glass-ink` per screen · honest empty states ·
hand-rolled SVG charts · `৳` always in mono via `lib/format.ts`.

**Don't:** gray cards on white · default `rounded-lg`/`shadow-md` · 3-column
icon-title-blurb grids · skeleton shimmer (pulsing `BoltMark` instead) · emoji
in UI · lorem/placeholder stats · **shadcn/radix imports** · stock illustration
packs.

**Charts:** hand-rolled, zero deps — `components/ui/sparkline.tsx` (SVG
polyline + gradient area from snapshot arrays) and
`components/ui/budget-bar.tsx` (spent/remaining, mint→yellow). The **XP bar**
is the same visual system (yellow fill on `.glass-well` track).

### 1.10 New shared components

In `components/app/` unless noted: `glass-panel.tsx` (e1/e2/ink variants) ·
`app-shell.tsx` (header + desktop nav + TabBar + `.field-app`) · `tab-bar.tsx`
· `stat-tile.tsx` · `empty-state.tsx` · `status-chip.tsx` (all §3 machine
statuses, mono 11px, color-coded dot) · **`tier-badge.tsx`** (Beginner/Hustler/
Pro/Elite chip — amethyst/violet/pink/yellow accents, `IconTrophy` at Pro+) ·
**`xp-bar.tsx`** (progress to next tier, `CountUp` on the number) ·
`data-row.tsx` · `sheet.tsx` (RisePanel bottom-sheet mobile / modal desktop) ·
`field.tsx` (label + `.glass-well` input + `useActionState` error) ·
`components/ui/sparkline.tsx` · `components/ui/budget-bar.tsx` ·
`components/icons/index.tsx` (generated).

---

## 2. Information architecture

### 2.1 Route map

```
app/
  page.tsx                          # dark landing — UNTOUCHED (redesign: LANDING-REDESIGN.md)
  login/                            # restyled; stub mode: 5 demo identities (§5 Phase 3)
  apply/                            # NEW — application flow (replaces open onboarding)
    page.tsx                        #   role select + application form (declare pages)
    status/page.tsx                 #   WAITLISTED / DECLINED status screen
    actions.ts
  onboarding/                       # POST-APPROVAL setup: connect vetted pages → payout → tier welcome
  auth/callback/route.ts            # keep
  api/waitlist/…  admin/leads/…     # keep (marketing leads pipeline, untouched)

  (app)/                            # CLIPPER + AGENCY · glass shell · role ∈ {clipper, agency} · access === "active"
    layout.tsx                      # rewrite: AppShell, .field-app, TabBar, access gate
    home/page.tsx                   # wallet snapshot, tier badge + XP bar, live tracking clips, activity
    campaigns/page.tsx              # marketplace: tier-aware (early-access labels), platform labels
    campaigns/[id]/page.tsx         # brief, rates, qualification minimum, budget bar, submit sheet
    campaigns/[id]/actions.ts
    clips/page.tsx                  # my submissions (agency: per-page attribution)
    clips/[id]/page.tsx             # snapshot sparkline, status timeline, window countdown
    wallet/page.tsx + actions.ts    # balance, ledger, request payout, NID banner until verified
    leaderboard/page.tsx            # top clippers by verified views · tier badges · opt-out honored
    connections/page.tsx + actions.ts   # vetted pages: OAuth-link, status, per-page XP (agency)
    settings/page.tsx + actions.ts  # profile, bKash number, NID submission, leaderboard opt-out

  brand/                            # BRAND CONSOLE · role === "brand"
    layout.tsx
    page.tsx                        # overview: campaigns, total escrowed/spent
    campaigns/new/page.tsx + actions.ts   # wizard (incl. early-access + qualification minimum)
    campaigns/[id]/page.tsx         # performance, budget bar, aggregate submissions feed
    billing/page.tsx                # escrow/funding ledger view
    settings/page.tsx

  admin/                            # ADMIN OPS
    layout.tsx
    page.tsx                        # ops home: applications due, funding queue, holds, payouts due
    applications/page.tsx + [id]/page.tsx + actions.ts   # NEW — the vetting console (§2.4)
    campaigns/page.tsx + [id]/page.tsx + actions.ts      # confirm funding, cancel, close
    payouts/page.tsx + actions.ts   # payout queue → NID check → mark paid (txn ref)
    fraud/page.tsx + actions.ts     # held submissions → release / uphold
    clippers/page.tsx + actions.ts  # directory: tier/XP, NID verify, block
    leads/…                         # keep as-is

  api/cron/sweep/route.ts           # verification + settlement + XP sweep (§4)
  api/connect/youtube/route.ts      # OAuth start
  api/connect/youtube/callback/route.ts
```

**Removals (Phase 0):** `app/(app)/marketplace/`, `app/(app)/dashboard/`,
`app/(app)/campaign/` (replaced), the manual verify queue in
`app/admin/page.tsx` + `recordVerification`/`rejectSubmission`/`closeCampaign`
in `app/admin/actions.ts`, `components/app/onboarding-form.tsx`,
`components/app/submit-form.tsx`, `components/app/status-badge.tsx`,
`lib/payout.ts`, `lib/payout.test.ts`,
`components/landing/{earn-calculator,clip-marquee}.tsx` (dead code).

**`proxy.ts` matcher update:**
`["/apply/:path*","/home/:path*","/campaigns/:path*","/clips/:path*","/wallet/:path*","/leaderboard/:path*","/connections/:path*","/settings/:path*","/brand/:path*","/admin/:path*","/onboarding/:path*"]`.
Proxy only checks "signed in" (optimistic). **Access + role gates live in the
layouts** (`(app)` requires `access === "active"`, else redirect to
`/apply/status`), and every server action re-checks via `lib/auth/guards.ts`
(`requireUser()`, `requireActiveClipper()`, `requireRole("brand")`,
`requireAdmin()`) — Next 16 server actions bypass the proxy matcher, so
per-action guards are mandatory.

### 2.2 Navigation

- **Desktop:** top `.glass-strong` sticky header — amethyst `Logo`, inline nav,
  tier badge next to avatar (clipper/agency), avatar menu. Brand + admin add a
  left rail at `≥lg`.
- **Mobile tab bars:**
  - Clipper/Agency: Home · Campaigns · **Submit (center, yellow)** · Wallet · Profile
  - Brand: Overview · Campaigns · **New (center)** · Billing · Settings
  - Admin: no tab bar (desktop-first ops; pages stay responsive).

### 2.3 Access & onboarding flows (v2 — the gated model)

**Application (`/apply`)** — for clippers and agencies; brands skip this and go
straight to the brand console after signup:

1. **Create account** — Google OAuth or phone OTP. Creates a login only; **no
   marketplace access yet**. CTA language everywhere is "Apply", never
   "sign up free".
2. **Application form** — role (clipper/agency), then declared pages: platform,
   handle/page link, self-reported follower count, niche, and a short
   posting-habits note. **No follower minimum enforced** — the form is
   information for the reviewer, not a gate. Agencies declare their whole
   roster. Submit → `access = "waitlisted"`.
3. **Status screen (`/apply/status`)** — honest copy: *"Application submitted.
   You're on the waitlist — we review every page by hand."* Shows per-page
   review state once decided. `DECLINED` shows the reason + a reapply CTA
   (enabled after the reviewer's stated condition, e.g. "page active again").
4. **Vetting happens in the admin console (§2.4).** Approved → `access =
   "active"`, notified, and routed into onboarding.

**Onboarding (post-approval, `/onboarding`)** — `Profile.onboardingStep`
persists progress:

1. **Connect accounts** — only pages that **passed vetting** can be
   OAuth-linked (YouTube live via §4.6; others per platform mode). This link is
   what proves ownership at submit time. Tokens stored encrypted.
2. **Payout setup** — bKash number (Zod `/^01[3-9]\d{8}$/`). NID is **not**
   collected here — it's requested from the wallet before the first payout
   releases (lower friction, per flows v2).
3. **Tier welcome** — every approved clipper starts at **Beginner**: welcome
   card with tier badge, XP bar at 0, and a one-line explainer of what the next
   tier unlocks. → `/home` (clipper/agency).

**Brand signup** — name, email, phone, company, role → brand console. No
vetting queue (brands are qualified by funding, not by audience).

### 2.4 Admin vetting console (`admin/applications/`) — NEW, core surface

The manual step that fixes what killed the failed campaign (inactive pages
getting through):

- **Queue:** applications ordered oldest-first, with age badge (SLA target:
  reviewed within 48h — show breaches in amber).
- **Detail (`[id]`):** applicant info + each declared page as a card — platform
  icon, handle **as an outbound link** (reviewer opens the real page), declared
  followers, niche, note. Per-page **Clipper Standard checklist** (three
  explicit toggles: *active in last 3 weeks* · *posting 3–5×/week* · *real
  engagement*) and per-page approve/decline.
- **Decision:** overall approve (≥1 approved page) → profile `access =
  "active"`, approved pages become connectable; decline-all → `access =
  "declined"` + required reason (shown verbatim to the applicant).
- Reviewer identity + timestamps recorded on the application (audit trail).

### 2.5 Empty states (the trust bar — all honest)

- `/apply/status` waitlisted: "We review every page by hand. Most reviews
  finish within 2 days." (only if that SLA is actually being met — otherwise
  state the real current time)
- Marketplace, none: BoltMark + "No live campaigns right now. New drops are
  announced here first."
- Marketplace, early-access lock: "Early Access — opens to all tiers
  {date}. Reach Pro to see campaigns first." (real date, real rule)
- Wallet, zero: "You haven't earned yet. Post a clip from a live campaign —
  views verify automatically."
- Leaderboard, pre-launch: "No settled clips yet. The first verified earners
  will appear here."
- Admin queues, empty: "Nothing needs you."

---

## 3. Data model V2.1

### 3.1 Types — full rewrite of `lib/db/types.ts`

```ts
export type Role = "clipper" | "brand" | "agency" | "admin";
export type Platform = "facebook" | "tiktok" | "instagram" | "youtube"; // canonical lowercase
export type Access = "none" | "waitlisted" | "active" | "declined";     // marketplace access (clipper/agency)
export type Tier = "beginner" | "hustler" | "pro" | "elite";

// ALL money is integer poisha (৳ × 100). Per-view: clipper 5, brand 6 poisha — exact, no floats.
export const RATE_CLIPPER_PER_1K = 5000; // ৳50 — identical at every tier, forever
export const RATE_BRAND_PER_1K  = 6000;  // ৳60 (future tiered client rates snapshot per campaign)

export interface Profile {
  id: string; email: string; displayName: string; avatarUrl?: string;
  role: Role;
  access: Access;                    // "active" gates the (app) shell for clipper/agency
  tier: Tier; xpTotal: number;       // tier derived from XP thresholds; denormalized for reads
  streakWeeks: number;               // consecutive active weeks (≥1 qualifying settle/week)
  bkashNumber?: string;
  nidStatus: "none" | "submitted" | "verified";  // gate on FIRST payout release
  nidNumberEnc?: string;             // AES-GCM; service-role read only; minimal PII
  orgName?: string;                  // brand / agency
  leaderboardOptOut: boolean;
  accountStatus: "active" | "blocked";
  profileCompleted: boolean; onboardingStep: number;
  createdAt: string;
}

export interface Application {
  id: string; profileId: string; role: "clipper" | "agency";
  note: string;                      // posting-habits note
  status: "submitted" | "approved" | "declined";
  declineReason?: string;            // shown verbatim to the applicant
  reviewedBy?: string; reviewedAt?: string;
  createdAt: string;                 // multiple rows per profile = reapplications
}

export interface ApplicationPage {
  id: string; applicationId: string;
  platform: Platform; handle: string; url: string;
  selfReportedFollowers: number; niche: string;
  vetStatus: "pending" | "approved" | "declined";
  vetChecklist?: { activeRecently: boolean; postingCadence: boolean; realEngagement: boolean };
  vetNote?: string;
}

export interface ConnectedAccount {
  id: string; profileId: string; platform: Platform;
  applicationPageId: string;         // provenance: only VETTED pages get connected
  externalId: string;                // YT channelId / FB pageId / IG userId / TT openId
  handle: string; displayName?: string; avatarUrl?: string; followerCount?: number;
  proof: "oauth" | "simulated";
  accessTokenEnc?: string; refreshTokenEnc?: string; tokenExpiresAt?: string;
  status: "active" | "revoked";
  createdAt: string;
}

export type CampaignStatus =
  | "draft" | "pending_funding" | "active" | "settling" | "completed" | "cancelled";

export interface Campaign {
  id: string; brandProfileId: string;
  name: string; brandName: string; brief: string; guidelines: string; niche: string;
  allowedPlatforms: Platform[]; sourceUrl: string; coverUrl?: string;
  budgetPoisha: number; spentPoisha: number;
  rateClipperPer1k: number; rateBrandPer1k: number;  // snapshots (support future tiered client rates)
  minQualifyViews: number;           // 2,000–4,000 per flows v2 (default 2,000); below ⇒ ৳0 + no XP
  maxPayoutPerClipperPoisha: number;
  submissionCapBase: number;         // Beginner cap; effective cap = base × TIER_CONFIG multiplier
  earlyAccessTier?: "pro" | "elite"; // visible only to ≥ tier until earlyAccessEndsAt
  earlyAccessEndsAt?: string;        // then opens to everyone
  trackingWindowDays: number;        // default 7
  startDate: string; endDate: string;
  status: CampaignStatus; fundedAt?: string; createdAt: string;
}

export type SubmissionStatus = "pending" | "tracking" | "held" | "settled" | "rejected";

export interface Submission {
  id: string; campaignId: string; profileId: string; connectedAccountId: string;
  platform: Platform;
  postUrl: string;                   // canonical, globally unique
  mediaId: string;                   // unique per campaign
  baselineViews: number; latestViews: number;
  countedViews: number;              // max(latest − baseline, 0) after fraud strips
  lockedViews?: number; earnedPoisha?: number; xpAwarded?: number;  // set at settlement
  status: SubmissionStatus; holdReason?: string; rejectReason?: string;
  submittedAt: string; windowEndsAt: string; settledAt?: string;
}

export interface ViewSnapshot {
  id: string; submissionId: string; views: number;
  source: "live" | "simulated"; capturedAt: string;
}

export interface XpEvent {
  id: string; profileId: string;
  connectedAccountId?: string;       // enables per-page XP in the agency portfolio
  submissionId?: string; campaignId?: string;
  amount: number;                    // XP integer; zero-XP events are never written
  reason: "views" | "completion_bonus" | "streak_bonus" | "adjustment";
  createdAt: string;
}

export type LedgerAccount = string;
// "external" | `escrow:${campaignId}` | `clipper:${profileId}` | "margin"
export type LedgerEventType =
  | "escrow_funding" | "settlement" | "payout" | "escrow_refund" | "adjustment";

export interface LedgerEntry {
  id: string;
  eventId: string;                   // entries of one event sum to 0; unique ⇒ idempotent
  eventType: LedgerEventType;
  account: LedgerAccount;
  amountPoisha: number;              // signed
  campaignId?: string; profileId?: string; submissionId?: string; payoutBatchId?: string;
  memo?: string; createdAt: string;
}

export interface PayoutBatch {
  id: string; profileId: string; amountPoisha: number;
  bkashNumber: string;               // snapshot at queue time
  status: "queued" | "blocked_nid" | "processing" | "paid" | "failed";
  txnRef?: string; paidBy?: string; paidAt?: string; createdAt: string;
}

export interface FraudFlag {
  id: string; submissionId: string;
  rule: "velocity" | "follower_ratio" | "duplicate_media" | "manual";
  detail: string;
  status: "open" | "released" | "upheld";
  resolvedBy?: string; resolvedAt?: string; createdAt: string;
}

export interface DB {
  profiles: Profile[]; applications: Application[]; applicationPages: ApplicationPage[];
  connectedAccounts: ConnectedAccount[]; campaigns: Campaign[];
  submissions: Submission[]; viewSnapshots: ViewSnapshot[]; xpEvents: XpEvent[];
  ledgerEntries: LedgerEntry[]; payoutBatches: PayoutBatch[]; fraudFlags: FraudFlag[];
  version: 3;                        // stub-store reseed trigger
}
```

### 3.2 Tier & XP engine — new `lib/xp.ts` (pure, unit-tested)

All constants live in one exported `XP_CONFIG` object, **clearly marked
"working draft — founders to finalize"** (flows v2 locks the structure, not
the numbers):

```ts
export const XP_CONFIG = {
  perViews: 1 / 100,                     // XP = verified views ÷ 100
  completionBonus: 50,                   // per campaign submitted on time
  streakBonusPerWeek: 25,                // consecutive active weeks
  thresholds: { hustler: 1_000, pro: 5_000, elite: 20_000 },  // DRAFT
  // Pro additionally requires zero upheld fraud flags; Elite requires streakWeeks ≥ 8. DRAFT
  submissionCapMultiplier: { beginner: 1, hustler: 2, pro: 3, elite: 5 },  // DRAFT
} as const;
```

- `xpForSettlement(lockedViews, onTime, streakWeeks)` → breakdown of events.
- `tierFor(xpTotal, { cleanRecord, streakWeeks })` → Tier (Pro/Elite carry the
  extra conditions above).
- Awarded **only** for qualifying settlements (`lockedViews ≥ minQualifyViews`,
  not fraud-upheld). Fraud-upheld ⇒ zero XP **and** streak reset.
- Tier changes happen in the sweep right after XP is written; a tier upgrade
  creates an activity item and the UI shows a `RisePanel` celebration card on
  next visit. **Tier never changes any rate.**

### 3.3 State machines

**Access (profile):** `none` →(application submitted)→ `waitlisted`
→(reviewer approves ≥1 page)→ `active` | →(declined)→ `declined`
→(reapply with a new Application)→ `waitlisted`.

**Campaign:** `draft` → `pending_funding` →(admin records escrow;
`escrow_funding` event)→ `active` →(endDate OR budget exhausted)→ `settling`
(no new submissions; open windows drain) →(last settle; `escrow_refund`
remainder)→ `completed`. `cancelled` from draft/pending_funding, or from
active by admin (drain then refund).

**Submission:** `pending` →(baseline ok)→ `tracking` →(fraud rule)→ `held`
→(release)→ `tracking` | (uphold)→ `rejected`; `tracking` →(window end)→
`settled`. `rejected` from any pre-settled state (URL dead, private, not owned).

### 3.4 Ledger design (zero-sum per event — unchanged from V2)

| Event | Entries (signed poisha) |
|---|---|
| `escrow_funding` | `external −B` · `escrow:{cmp} +B` |
| `settlement` (eventId `settle:{submissionId}` — unique ⇒ idempotent) | `escrow:{cmp} −brandCost` · `clipper:{profileId} +clipperEarn` · `margin +(brandCost−clipperEarn)` |
| `payout` (eventId `payout:{batchId}`) | `clipper:{profileId} −A` · `external +A` |
| `escrow_refund` | `escrow:{cmp} −R` · `external +R` |

```
payableViews = min(lockedViews, floor(remainingEscrowPoisha / 6), capRemainingViews)
clipperEarn  = payableViews × 5
brandCost    = payableViews × 6
if lockedViews < campaign.minQualifyViews → payableViews = 0 (settles at ৳0, no XP, shown honestly)
```

Pure functions in `lib/ledger.ts` (`buildFundingEvent`, `buildSettlementEvent`,
`balance`, `assertZeroSum`) + `lib/money.ts` — unit-tested via `node --test`.
Wallet **available** = `balance("clipper:{id}")` − Σ `queued|blocked_nid|processing`
PayoutBatches.

### 3.5 Supabase migration — `supabase/migrations/0004_v2_schema.sql`

- `profiles`: role check → `('clipper','brand','agency','admin')` (migrate
  `individual`→`clipper`); rename `payout_number`→`bkash_number`; add `access`,
  `tier`, `xp_total`, `streak_weeks`, `nid_status`, `nid_number_enc`,
  `org_name`, `onboarding_step`, `leaderboard_opt_out`; drop
  `page_url/handle/platform/follower_count` (superseded by applications +
  connected_accounts).
- New tables: `applications`, `application_pages`, `connected_accounts`,
  `view_snapshots`, `xp_events`, `ledger_entries` (**append-only**: no
  update/delete policies; unique `(event_id, account)`), `payout_batches`,
  `fraud_flags`. Drop & recreate `campaigns`, `submissions`; drop `payouts`.
- Indexes: `submissions(status, window_ends_at)` · `ledger_entries(account)` ·
  unique `(campaign_id, media_id)` · unique canonical `post_url` ·
  `applications(status, created_at)` for the vetting queue ·
  `xp_events(profile_id)`, `xp_events(connected_account_id)`.
- RLS: applicants read their own applications/pages; clippers read own rows +
  active campaigns **filtered by early-access tier** (enforce in queries, not
  RLS); brands read own campaigns + aggregate stats via a
  `campaign_public_stats` view; leaderboard via a dedicated view exposing only
  displayName/tier/settled views for non-opted-out actives. Money/verification/
  vetting writes go through the service-role client. Keep `is_admin()` and the
  `handle_new_user` trigger. `*_enc` columns (tokens, NID) excluded from
  user-facing selects.
- `settle_submission(submission_id, locked_views)` SECURITY DEFINER: lock
  campaign row → compute payable → insert 3 ledger rows → update submission +
  `campaigns.spent_poisha` → insert XP events → update profile
  `xp_total/tier/streak_weeks` — one transaction.

### 3.6 Stub store mirror

`lib/db/store.ts`: extend `DB`, reseed when `version !== 3`. Seed: demo admin ·
demo brand · **demo waitlisted applicant** (to demo the vetting console) ·
demo active clipper (Beginner, some XP) · demo agency (2 vetted pages, one per
platform mode); 3 funded campaigns (one `earlyAccessTier: "pro"`) + 1
`pending_funding`; 2 tracking submissions with 6h-spaced snapshots. All seed
names prefixed **"Demo"**.

`lib/db/index.ts` facade grows (mirrored in `supabase-impl.ts`): application
CRUD + `listApplications(status)` · applicationPage vet updates ·
connected-account CRUD · `listSubmissionsDue(now)` · snapshots · XP
(`appendXpEvents`, `xpTotals(profileId)`, `xpByAccount(profileId)`) · ledger
(`appendLedgerEvent`, `listLedger`, `ledgerBalance`) · payout-batch CRUD ·
fraud-flag CRUD · `listCampaignsByBrand` · `leaderboard(limit)`.

---

## 4. Verification engine

### 4.1 Adapter interface — new `lib/verify/types.ts` (unchanged from V2)

```ts
import type { Platform, ConnectedAccount } from "@/lib/db/types";

export interface ParsedPost { platform: Platform; mediaId: string; canonicalUrl: string; }

export type StatsResult =
  | { ok: true; mediaId: string; views: number; source: "live" | "simulated"; fetchedAt: string }
  | { ok: false; mediaId: string; error: "not_found" | "private" | "api_error" | "quota" };

export interface PlatformAdapter {
  platform: Platform;
  mode(): "live" | "simulated";
  parsePostUrl(url: string): ParsedPost | null;
  fetchStats(mediaIds: string[]): Promise<StatsResult[]>;
  verifyOwnership(account: ConnectedAccount, post: ParsedPost): Promise<"owned" | "not_owned" | "unknown">;
}
```

Registry `lib/verify/index.ts`: `getAdapter(platform)`. The flows-v2 principle
in code: **a submission is only trusted because the account was already
OAuth-connected and the page was already vetted** — the submit action enforces
both before any stats call.

### 4.2 YouTube adapter — live day one (`lib/verify/youtube.ts`)

- **URL → videoId** (pure; tested): `youtube.com/shorts/{id}`, `youtu.be/{id}`,
  `watch?v={id}`, `m.youtube.com/…`, `/live/{id}`; id `[A-Za-z0-9_-]{11}`;
  canonical `https://www.youtube.com/shorts/{id}`.
- **fetchStats:** `videos.list?part=statistics,snippet,status` batch ≤50 ids,
  1 quota unit/call. Missing id ⇒ `not_found`; non-public ⇒ `private` — both
  auto-reject with the honest reason. `snippet.channelId` cached for ownership.
- **Quota:** 10k units/day default ⇒ 500k checks/day; 5,000 tracking clips on
  15-min sweeps ≈ 9,600 units/day. `quota` errors ⇒ skip + retry next run.
- **verifyOwnership:** `snippet.channelId === account.externalId` at submit
  time.

### 4.3 TikTok / Instagram / Facebook adapters

Thin wrappers over the shared **simulated core** (`lib/verify/simulated.ts`)
until each platform's app review passes, then flip `VERIFY_MODE_*` to `live`
and implement `fetchStats`/`verifyOwnership` against the real API (TikTok
Display API `video.query`; IG Graph media insights; FB Graph video_insights).
Expected go-live order per flows v2: **TikTok → Instagram → Facebook** (Meta
flagged secondary "until Meta's review process matures").

Simulated behavior: deterministic — seed = FNV-1a of `submissionId`; logistic
curve `cap·1/(1+e^{−k(h−h₀)})`, `cap ∈ [2k, 80k]`, `k ∈ [0.15,0.5]`,
`h₀ ∈ [12,48]`, ±3% per-hour deterministic jitter. Every result
`source: "simulated"`; UI shows a persistent `Simulated` chip with honest copy
(*"TikTok verification is pending platform approval — counts shown are
simulated."*). Defaults: YouTube `live` when `YOUTUBE_API_KEY` set, else
`simulated`; others `simulated`. Zero-config dev ⇒ all simulated, all working.

### 4.4 The sweep — poll, settle, XP, close (idempotent)

- **`app/api/cron/sweep/route.ts`** (GET, Node): 401 unless
  `Bearer ${CRON_SECRET}`. Runs `runSweep()` from `lib/verify/sweep.ts`;
  returns JSON report (polled/settled/held/xpAwarded/tierUpgrades).
- **Scheduling:** `vercel.json` cron `*/15 * * * *` (Vercel Hobby = daily only —
  use GitHub Actions schedule or cron-job.org hitting the URL with the secret
  until on Pro). Dev: **"Run sweep now"** button on `/admin`.
- **`runSweep(now)` steps:**
  1. **Baseline:** `pending` → fetch stats → set `baselineViews` → `tracking`
     (retry next run on failure; auto-reject after 24h `not_found`).
  2. **Poll:** `tracking` with `windowEndsAt > now`, per-platform batches;
     append `ViewSnapshot`; update `latestViews/countedViews`; fraud rules →
     possibly `held` + `FraudFlag`.
  3. **Settle:** `tracking` with `windowEndsAt <= now` → final fetch →
     `lockedViews` → `settle_submission` (unique `settle:{id}` event ⇒
     re-runs are no-ops) → **XP events + tier recompute** (§3.2) → `settled`.
     Escrow hits 0 ⇒ campaign → `settling`.
  4. **Streaks:** once per Dhaka-week boundary, recompute `streakWeeks`
     (+ streak XP bonus for qualifying weeks; reset on inactive week or upheld
     fraud).
  5. **Campaign close:** `active` past `endDate` → `settling`; `settling` with
     no open submissions → `escrow_refund` → `completed`.
  6. **Overlap guard:** unique `sweep:{floor(now/5min)}` flag row.
- **Baseline + delta:** `countedViews = max(latest − baseline, 0)` — views
  count from submission onward.

### 4.5 Fraud rules v1 (`lib/verify/fraud.ts`, pure + tested)

1. **Velocity:** hourly delta > 50,000 or > 8× the submission's rolling
   6-snapshot median (≥3 snapshots) ⇒ `held`.
2. **Views ≫ followers:** `countedViews > 10,000` AND `> 30 × followerCount`
   ⇒ `held`.
3. **Dedup:** canonical `postUrl` globally unique; `mediaId` unique per
   campaign — enforced at submit.
4. **Per-clipper cap:** settlement clamps cumulative campaign earnings at
   `maxPayoutPerClipperPoisha`. **Submission cap:** per-campaign submissions
   limited to `submissionCapBase × XP_CONFIG.submissionCapMultiplier[tier]`.
5. **Qualification minimum:** `lockedViews < minQualifyViews` ⇒ ৳0 + no XP.

Held submissions keep polling but never settle until admin release (→
`tracking`) or uphold (→ `rejected`, zero XP, streak reset). Blocked profiles
cannot submit.

### 4.6 Ownership proof

**Two layers, per flows v2:** (1) the page was **vetted by a human** at
application time; (2) the account is **OAuth-connected** so the platform API
itself proves ownership at submit time.

- YouTube (live): `app/api/connect/youtube/route.ts` → Google OAuth
  (`youtube.readonly`, `access_type=offline`, signed `state` nonce) →
  callback exchanges code → `channels?mine=true` → store
  `ConnectedAccount{ externalId: channelId, proof: "oauth" }`, tokens encrypted
  (§6). The channelId is the durable proof; polling uses the API key, so token
  expiry never breaks verification. Separate OAuth client from Supabase
  sign-in. A connection is only offered for **vetted** `ApplicationPage`s of
  matching platform.
- Simulated platforms: handle-entry connect (labeled `Simulated`), still bound
  to a vetted page. Live YouTube submissions require `proof: "oauth"`.

**Submit action** (`app/(app)/campaigns/[id]/actions.ts`): guard
`requireActiveClipper()` → tier vs `earlyAccessTier` check → submission-cap
check → parse URL via adapter → dedup → require matching-platform, **vetted**,
owned `ConnectedAccount` → `verifyOwnership` → baseline snapshot → create
submission (`windowEndsAt = submittedAt + trackingWindowDays`, clamped to
`endDate + trackingWindowDays`). Discloses at submit: *"Budget is a ceiling —
earnings settle first-come, first-served."*

---

## 5. Build phases

Design system first (every later screen lands styled); data model second
(features build on final types once); **the access loop third** — nothing else
in the product makes sense until apply → vet → let-in works end to end.
Total ≈ 4.5–5 solo working weeks.

### Phase 0 — Clean slate & foundations (½ day)
- Delete: `lib/payout.ts`, `lib/payout.test.ts`,
  `components/app/{onboarding-form,submit-form,status-badge}.tsx`,
  `components/landing/{earn-calculator,clip-marquee}.tsx`, old admin verify
  actions (stub the admin page temporarily).
- **Scrub `.env.example` to placeholders**; add `YOUTUBE_API_KEY`,
  `GOOGLE_OAUTH_CLIENT_ID/SECRET`, `TOKEN_KEY`, `CRON_SECRET`,
  `VERIFY_MODE_*`. **Rotate any real Supabase keys that were committed.**
- New `lib/env.server.ts` (server-only Zod schema).
- `next.config.ts`: `images.remotePatterns` for `lh3.googleusercontent.com`,
  `yt3.ggpht.com`, `i.ytimg.com`.
- **Verify:** `npx tsc --noEmit` clean; `npm run build`.

### Phase 1 — Klipr Glass design system (2–3 days)
- `app/globals.css` glass section · `scripts/gen-icons.mjs` + generated
  `components/icons/index.tsx` · shared components (§1.10, incl.
  **`tier-badge.tsx` + `xp-bar.tsx`**) · dev-only `app/styleguide/page.tsx`
  (`notFound()` outside development).
- **Verify:** `/styleguide` shows glass over `.field-app`, 15 icons at 3 sizes,
  tab bar, stat tiles, tier badges ×4, XP bar, sparkline, empty state; mobile
  viewport + safe-area; reduced-motion; Lighthouse a11y ≥ 95.

### Phase 2 — Data model V2.1 + money & XP cores (2–3 days)
- Rewrite `lib/db/types.ts` (§3.1) · new `lib/money.ts`, `lib/ledger.ts`,
  **`lib/xp.ts`**, `lib/platforms.ts`, `lib/crypto.ts` (AES-256-GCM) · extend
  `lib/db/store.ts` (v3 seed), `lib/db/index.ts`, `lib/db/supabase-impl.ts` ·
  `supabase/migrations/0004_v2_schema.sql` · extend `lib/format.ts`
  (poisha-aware `taka()`, `dhakaDate()`/`dhakaWeek()` with `Asia/Dhaka`).
- **Verify:** `npm test` green — ledger zero-sum, settlement math (caps,
  qualification minimum, escrow clamp), **XP formula + tier thresholds + streak
  reset**, money conversions, crypto round-trip; fresh `.data/db.json` reseeds
  v3; migration applies on a scratch Supabase project.

### Phase 3 — Auth + the access loop: apply → vet → let in (3 days)
- `lib/auth/guards.ts` (`requireUser/requireActiveClipper/requireRole/requireAdmin`)
  · `app/apply/*` (application form with repeatable declared-page rows, status
  screen, reapply) · **`app/admin/applications/*` vetting console** (§2.4) ·
  post-approval `app/onboarding/*` (connect placeholder, bKash, tier welcome) ·
  restyle `app/login` with **5 stub identities** (waitlisted applicant, active
  clipper, agency, brand, admin) · `proxy.ts` matcher · three layouts with
  access + role gates · `auth/callback` routing by role/access.
- **Verify (stub, end-to-end):** fresh user → apply (2 pages) → status shows
  waitlisted → admin opens vetting console, ticks the Clipper-Standard
  checklist, approves one page & declines the other with a note → applicant is
  active, onboarding runs, lands on `/home` at Beginner/0 XP; declined-all path
  shows reason + reapply; wrong-role and non-active URLs redirect correctly.

### Phase 4 — Clipper app core (3–4 days)
- `(app)/home` (tier badge, XP bar, wallet snapshot, tracking clips, activity)
  · `campaigns` (marketplace: niche/platform filters, **early-access labels +
  tier gating**, platform recommendation labels) · `campaigns/[id]` (brief,
  rates, **qualification minimum shown**, budget bar, submit sheet + action) ·
  `clips` + `clips/[id]` (sparkline, countdown, timeline) · `wallet` (balance,
  ledger, request payout → PayoutBatch, **NID banner + submission form**) ·
  `connections` (vetted pages, OAuth/simulated connect) · `settings` (profile,
  bKash, leaderboard opt-out) · `leaderboard` (honest zero-state).
- **Verify:** stub clipper browses a funded campaign, submits a simulated URL,
  sees `pending→tracking`; duplicate URL, wrong platform, un-vetted page, and
  over-cap submissions all rejected with honest errors; early-access campaign
  hidden from Beginner demo; wallet shows ৳0 truthfully.

### Phase 5 — Verification engine + settlement + XP (3–4 days)
- `lib/verify/{types,index,youtube,simulated,facebook,instagram,tiktok,fraud,sweep}.ts`
  · `app/api/cron/sweep/route.ts` · `vercel.json` · YouTube OAuth connect
  routes · `settle_submission` SQL function · admin "Run sweep now".
- **Verify:** `npm test` (URL parsing, curve determinism, fraud rules, settle +
  XP idempotency via repeated `runSweep`); stub demo — shrink
  `trackingWindowDays` to 0.01, sweep twice: wallet credited once, XP awarded
  once, tier upgrade fires at threshold, budget exhaustion flips campaign to
  `settling`, velocity rule holds a hot submission and holding blocks XP; with
  a real `YOUTUBE_API_KEY`, a real Shorts URL tracks live.

### Phase 6 — Brand console (2–3 days)
- `app/brand/*`: overview · wizard (fixed ৳60/1k display, budget, platforms
  with TikTok/YouTube recommended + Facebook-secondary flag, dates,
  brief/guidelines/asset, **minQualifyViews 2,000–4,000 selector,
  early-access toggle**) → `pending_funding` + escrow instructions · campaign
  detail (budget bar, verified views, spend, cost/view, top clips) · billing.
  Admin `campaigns`: confirm funding, cancel.
- **Verify:** brand creates (early-access Pro) → admin funds → visible to Pro
  demo but not Beginner → opens to all after `earlyAccessEndsAt` → spend
  accrues as clips settle.

### Phase 7 — Agency ("Network Manager") + admin ops (2–3 days)
- Agency: roster application already vetted per page (Phase 3); multi-account
  `connections` with **per-page XP/tier** display; per-page attribution on
  `clips`; single rolled-up `wallet`. Admin: `payouts` queue (**NID gate:**
  `blocked_nid` until verified; mark paid + txnRef ⇒ `payout` ledger event) ·
  `fraud` (release/uphold with XP/streak consequences) · `clippers` directory
  (tier, XP, NID verify action, block) · ops-home tiles (applications due,
  holds, payouts due).
- **Verify:** payout lifecycle queued→blocked_nid→(admin verifies NID)→
  processing→paid with zero-sum ledger; released hold resumes tracking; agency
  wallet rolls up two pages into one payout.

### Phase 8 — Polish, mobile QA, docs (2 days)
- Tab-bar behaviors, empty states everywhere, `loading.tsx` per group (pulsing
  BoltMark), error states, `/home` activity feed (ledger + status transitions +
  tier upgrades), a11y pass, copy pass (plain English, ৳ formatting,
  application-not-signup language), update `DESIGN.md`/`PRODUCTION.md`, CI
  stays test → typecheck → lint → build.
- **Verify:** `npm test && npx tsc --noEmit && npm run lint && npm run build`;
  iPhone-width walkthrough of all roles **including the waitlisted state**.

---

## 6. Risks & gotchas

- **Vetting throughput is the funnel bottleneck.** Manual review is the
  product's quality moat *and* its rate limiter. The console must make a review
  take <2 minutes (outbound links + three-toggle checklist), the queue shows
  SLA breaches, and `/apply/status` copy must reflect the *actual* current
  review time — never promise "48 hours" while the queue says otherwise.
- **XP constants are a draft.** Structure is locked (per-views + completion +
  streak; thresholds; cap multipliers) but every number in `XP_CONFIG` needs
  founder sign-off before launch. Keep all of them in the one config object so
  tuning is a one-file change; log config values into XP events' memo at award
  time for auditability.
- **NID is sensitive PII.** Store the minimum (encrypted number, status);
  never render it back fully in UI (mask to last 4); service-role-only column;
  it gates **payout release only** — never browsing/submitting.
- **Next 16 traps:** async `params`/`searchParams`/`cookies()` everywhere;
  **server actions bypass the proxy matcher** — guard every action; stick to
  `revalidatePath`; `fetch` uncached by default (correct for adapters);
  `images.remotePatterns` before remote avatars; flat ESLint via `npm run lint`.
- **YouTube quota:** ample (§4.2); `quota` errors degrade to skip-and-retry;
  absence of an id in `videos.list` = deleted, not transport error.
- **Token encryption:** AES-256-GCM via `lib/crypto.ts`, key `TOKEN_KEY`
  (32-byte base64); same code path writes ciphertext in stub mode (fixed dev
  key + console warning). Durable proof is `externalId` — token loss never
  breaks verification.
- **Tracking window vs budget exhaustion:** settlement is FCFS at window end;
  late-settling clips clamp to remaining escrow — possibly ৳0. Locked policy;
  disclosed at submit and shown live on the campaign page (remaining budget).
- **Campaign close:** `endDate` stops new submissions, not open windows;
  `settling` drains them; refund fires only after the last window closes.
- **Early-access fairness:** the gate is by **tier at submission time**;
  `earlyAccessEndsAt` must be shown on the card so Beginners see a real date,
  not a velvet rope.
- **Timezone:** store UTC ISO; display + end-of-day + **streak week
  boundaries** in `Asia/Dhaka` (`dhakaWeek()` in `lib/format.ts`).
- **Vercel Hobby cron = daily** — external pinger until Pro; sweep is
  idempotent so duplicates are harmless.
- **Simulated-mode honesty:** launch policy — **real-money campaigns are
  YouTube-only** until TikTok/Meta approvals land; simulated platforms visible
  but marked "pending platform approval" for real budgets. Flip per platform
  via `VERIFY_MODE_*`.
- **Migration order:** `0004` touches `profiles` while the live waitlist
  runs — leads tables untouched, but migrate in a maintenance window and
  re-verify `/admin/leads`.
- **`node --test` + TS:** keep test files free of TS-only runtime features.
- **backdrop-filter perf on low-end Android:** cap blur layers (§1.2);
  `.glass-well` default for dense lists.

---

## 7. Environment variables (final set)

| Var | Mode | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional | enables Supabase mode |
| `SUPABASE_SERVICE_ROLE_KEY` | server | sweep + admin + vetting writes |
| `NEXT_PUBLIC_SITE_URL` | optional | OAuth redirects, metadata |
| `YOUTUBE_API_KEY` | server | live YouTube stats (adapter → live) |
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` | server | YouTube connect flow (separate from Supabase sign-in) |
| `TOKEN_KEY` | server | 32-byte base64 AES-256-GCM key (OAuth tokens, NID) |
| `CRON_SECRET` | server | bearer token for `/api/cron/sweep` |
| `VERIFY_MODE_YOUTUBE/TIKTOK/INSTAGRAM/FACEBOOK` | server | `live` \| `simulated` per platform |
| `WAITLIST_EXPORT_TOKEN`, `LEADS_WEBHOOK_URL` | existing | marketing leads pipeline (unchanged) |

---

## 8. Critical files

| File | Why |
|---|---|
| `lib/db/types.ts` | the V2.1 domain model everything compiles against (Phase 2 first) |
| `app/globals.css` | Klipr Glass tokens/recipes extend this file (Phase 1) |
| `lib/db/index.ts` (+ `store.ts` / `supabase-impl.ts`) | the dual-mode facade every feature calls |
| `app/admin/applications/` + `app/apply/` | the access loop — the v2 model's defining feature |
| `lib/xp.ts` | tier/XP engine; all draft constants in one `XP_CONFIG` |
| `lib/verify/sweep.ts` (+ `lib/verify/youtube.ts`, `lib/ledger.ts`) | the idempotent poll/settle/XP/close engine |
| `supabase/migrations/0004_v2_schema.sql` | schema, RLS, `settle_submission` transaction |

*Sources & companions: `Klipr Product Flows v2.pdf` (product source of truth),
`LANDING-REDESIGN.md` (execute anytime), `WHOP-RESEARCH.md` (competitive
mechanics).*
