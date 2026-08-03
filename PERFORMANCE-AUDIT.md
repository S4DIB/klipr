# Klipr performance audit

*Audited 2 Aug 2026 · code at `2a09238` · measurements against live joinklipr.com*

## TL;DR

The site is **not slow for anonymous visitors** — measured TTFB for the landing/login pages is
150–250 ms warm, static assets ~150 ms, gzip is on, immutable caching is on.

The slowness is in the **logged-in app**, and the root cause is architectural:
**every authenticated page fires 6–10+ sequential network round-trips to Supabase before it
can send a single byte of HTML.** Most of those round-trips are *duplicates of each other*.
If the Coolify server and the Supabase project are in different regions, each round-trip
costs 100–250 ms and a page lands at 1–2.5 s TTFB — which matches "feels slow."

Two small code changes (P0 below) remove roughly half of those round-trips. The region
check (P0-3) decides whether the rest of the latency is 5 ms or 200 ms per query.

---

## Measured numbers (from Dhaka, warm connections)

| Probe | TTFB | Notes |
|---|---|---|
| `GET /brand/pattern-01.svg` (static) | **154 ms** | network + origin baseline — healthy |
| `GET /login` (SSR, anonymous) | **166 ms** | render cost negligible for anonymous |
| `GET /` (SSR, anonymous) | **246 ms** (452 ms cold) | fine |
| Supabase edge (`/auth/v1/health`) | **~40 ms warm** | Cloudflare POP is in Dhaka (`cf-ray …-DAC`) |
| HTML compression | gzip ✓ (22.6 KB → 8.8 KB) | working |
| JS chunk caching | `max-age=31536000, immutable` ✓ | working |

Anonymous requests can't exercise the auth chain, so the logged-in cost below is
established by reading the code paths, not by curl. The chain is deterministic.

---

## The main bottleneck: the per-request auth chain

For one authenticated navigation, e.g. **`/brand/campaigns`**:

```
1. proxy.ts            supabase.auth.getUser()      → network RTT to Supabase Auth
2. brand/layout.tsx    currentUser()
                         └ auth.getUser()           → RTT (duplicate of #1)
                         └ getProfile(id)           → RTT (DB query)
                       listNotifications(user.id)   → RTT
3. campaigns/page.tsx  requireRole("brand")
                         └ currentUser() AGAIN
                             └ auth.getUser()       → RTT (3rd time!)
                             └ getProfile(id)       → RTT (2nd time!)
4. page data           listCampaignsByBrand()       → RTT
                       (+ any N+1 loops, see P1)    → RTT × N
```

**All of these are serial.** Nothing streams until they finish. That's 7+ round-trips
minimum — before the page's own data. Three separate `auth.getUser()` calls per
navigation, each an HTTPS request to Supabase Auth (`@supabase/ssr` validates the JWT
server-side on every call). Two identical `getProfile` queries.

Why the duplication exists:
- [lib/auth/session.ts](lib/auth/session.ts) — `currentUser()` is a plain async function.
  It is **not wrapped in React `cache()`**, so the layout's call and the page's call each
  redo the full Auth + profile fetch. (Confirmed: zero `cache()` usage in the repo.)
- [proxy.ts](proxy.ts) — runs `auth.getUser()` on every matched request purely to decide
  "logged in or not."

Server actions pay the same tax: every action starts with `requireX()` → `auth.getUser()`
+ `getProfile`, so every button click (approve, save, delete) carries 2 extra RTTs
before its real work.

---

## Findings, ranked

### P0-1 · Wrap `currentUser()` in React `cache()` — halves the chain

One-line change in [lib/auth/session.ts](lib/auth/session.ts):

```ts
import { cache } from "react";
export const currentUser = cache(async (): Promise<Profile | null> => { … });
```

React deduplicates it across layout + page + any component within a single request.
The layout and page then share **one** `auth.getUser()` + **one** `getProfile` instead
of two of each. Zero behavior change. This is the single highest-value fix.

### P0-2 · Stop paying a network RTT for JWT validation in the proxy

[proxy.ts](proxy.ts) calls `auth.getUser()` (network) only to route logged-out users to
`/login`. Options, in increasing rigor:

- **Cheapest:** check that the Supabase auth cookies simply *exist* (local, 0 ms) and let
  the layouts do the real validation (they already redirect on bad sessions). A forged
  cookie gets you a redirect loop into `/login`, nothing more — layouts remain the boundary
  (the file's own comment already says exactly this).
- **Rigorous:** use `supabase.auth.getClaims()` with asymmetric JWT signing keys (verifies
  the JWT locally against cached JWKS — no per-request Auth round-trip). Requires enabling
  the JWT signing-keys migration in the Supabase dashboard.

Either removes one guaranteed RTT from **every** authenticated request.

### P0-3 · Confirm the region triangle (this decides everything else)

User (Dhaka) ↔ Coolify server ↔ Supabase. The user↔origin leg measures fine (~45 ms
connect). The unknown is **server ↔ Supabase** — every one of the round-trips above pays
it. Run this **on the Coolify server**:

```sh
# warm it, then read the numbers (run twice)
curl -so /dev/null -w 'ttfb=%{time_starttransfer}s\n' https://pznpitlqjhawwakswgbc.supabase.co/auth/v1/health
curl -so /dev/null -w 'ttfb=%{time_starttransfer}s\n' https://pznpitlqjhawwakswgbc.supabase.co/auth/v1/health
```

- Warm TTFB **< 20 ms** → server and Supabase are co-located; the fixes in this doc are
  enough.
- Warm TTFB **> 100 ms** → cross-region. Every query pays it. Fix by moving one of them:
  check the Supabase project region (Dashboard → Settings → General) and host the Coolify
  server in the same region — for Bangladesh users, **Singapore (ap-southeast-1)** for
  both is the sweet spot.

### P1-1 · N+1 serial query loops on hot pages

Each iteration is a full round-trip, serially:

| Where | Loop | Cost at N campaigns/rows |
|---|---|---|
| [app/brand/page.tsx:34](app/brand/page.tsx#L34) | `for (const c of campaigns) await listSubmissions({campaignId})` | N serial queries on the brand's **Overview** |
| [app/admin/campaigns/page.tsx:41](app/admin/campaigns/page.tsx#L41) | `await getProfile()` per brand | N serial queries |
| [app/(app)/clips/page.tsx:25](app/(app)/clips/page.tsx#L25) | `for (const s of subs)` with awaits | N serial |
| [app/admin/payouts/page.tsx:20](app/admin/payouts/page.tsx#L20) | per-batch loop | N serial |
| [app/admin/clippers/actions.ts:19](app/admin/clippers/actions.ts#L19) | per-blocked loop | N serial |

Fixes (pick per site):
- Wrap in `Promise.all` (parallel — one RTT of wall-clock instead of N). Several pages
  already do this correctly (`home`, `wallet`, `billing`, `fraud`, `clips` admin) — copy
  that pattern.
- Better: single batched query — `listSubmissions` already accepts filters; add an
  `IN (…ids)` variant (`.in("campaign_id", ids)`) and a `getProfiles(ids)` helper. One
  round-trip total, any N.

### P1-2 · Brand layout work on every brand page

[app/brand/layout.tsx](app/brand/layout.tsx) awaits `currentUser()` + `listNotifications()`
before anything renders. After P0-1, `currentUser()` is shared; run `listNotifications`
in `Promise.all` with it, or fetch only the unread **count** for the bell and lazy-load the
list when the bell opens.

### P2-1 · `ledgerBalance` scans the whole ledger in JS

[lib/db/supabase-impl.ts](lib/db/supabase-impl.ts) `ledgerBalance()` selects **every**
`amount_poisha` row for an account and sums in Node. It runs in the clipper layout (header
wallet pill) — on every clipper navigation. Fine at 100 rows; a real cost at 100k. Replace
with a SQL aggregate (Postgres `sum()` via a view or RPC) before launch-scale traffic.

### P2-2 · Everything renders dynamically; nothing is cached

All 40+ routes are `ƒ (Dynamic)` — including `/` (because it calls `currentUser()` to
redirect logged-in users). Every hit re-renders on the server.

- Anonymous landing traffic: currently fine (246 ms), but a cookie-presence check before
  `currentUser()` would make the redirect probe free for anonymous visitors.
- Semi-static data (`listCampaigns("active")` for the clipper marketplace, leaderboard)
  re-queries per request per user. `unstable_cache`/`revalidateTag` with a 30–60 s window
  would absorb most of it. Optional at current traffic; cheap insurance for launch.

### P2-3 · No CDN in front of the origin

joinklipr.com serves everything (HTML, JS, fonts, images) directly from the Coolify box —
no `cf-ray`/`via` headers on origin responses. Fine while the audience is near the server;
putting free Cloudflare in front would cache `/_next/static/*` at edge POPs (including
Dhaka) and absorb load spikes. Low effort, do whenever convenient.

### P3 · Smaller frictions

- **Three animation runtimes ship to the landing page:** `gsap`, `motion`, *and* `lenis`
  ([package.json](package.json)); largest client chunk is 224 KB. Consolidate to one
  library someday — cosmetic, since landing TTFB is fine and chunks are cached.
- **Zero `next/image` usage** — every image is a raw `<img>` (avatars, brand logos,
  campaign covers, app mockup at 696 KB). No resizing/lazy-loading/AVIF. Matters most for
  campaign covers as real uploads arrive.
- **Font fallback metrics missing** — build warns `Failed to find font override values for
  "Stack Sans Headline"/"Stack Sans Text"`. Not a network cost, but text renders with an
  unmatched fallback → layout shift → *perceived* jank while fonts load. Add
  `adjustFontFallback`/explicit fallbacks in [app/layout.tsx](app/layout.tsx).
- **Judging speed on `npm run dev`** — dev compiles routes on demand and is always
  slow. Only prod (joinklipr.com) numbers are meaningful.

---

## What's already healthy

- gzip on HTML + JS ✓ · immutable caching on `/_next/static` ✓
- `loading.tsx` skeletons exist for all three shells (clipper/brand/admin) ✓
- Several pages already parallelize with `Promise.all` ✓
- Public assets are small (no giant hero media; biggest file 696 KB mockup) ✓
- Sweeps run only via cron/manual button — never inline in page loads ✓
- Security headers, no `X-Powered-By` ✓

---

## Recommended order of work

| # | Fix | Effort | Expected effect (logged-in pages) |
|---|---|---|---|
| 1 | `cache()` around `currentUser()` (P0-1) | 5 min | −2 RTTs on every page, −2 on every action |
| 2 | Proxy: cookie-presence check or `getClaims()` (P0-2) | 15–30 min | −1 RTT on every request |
| 3 | Measure server↔Supabase RTT (P0-3) | 5 min | decides if a region move is needed |
| 4 | Batch the 5 N+1 loops (P1-1) | ~1 h | Overview/admin lists stop scaling with N |
| 5 | Brand layout: parallel notifications (P1-2) | 10 min | −1 serial RTT on brand pages |
| 6 | SQL-side `ledgerBalance` (P2-1) | 30 min | future-proofs the wallet pill |
| 7 | Cloudflare in front + `next/image` + font fallbacks (P2/P3) | as convenient | edge static + less jank |

Items 1, 2, 4, 5, 6 are pure code changes in this repo — say the word and I'll implement
them. Item 3 is a command you run on the Coolify box; if it shows >100 ms, prioritize
co-locating the server with the Supabase region over everything else.
