# Klipr performance fix playbook

*Companion to [PERFORMANCE-AUDIT.md](PERFORMANCE-AUDIT.md) · code refs at `2a09238`*

> **Implementation status (code changes shipped):**
> - ✅ **Fix 1** `cache(currentUser)` — done.
> - ⏸️ **Fix 2** proxy cookie-check — **deliberately NOT shipped.** Removing the proxy's
>   `auth.getUser()` also removes Supabase-SSR token *refresh*; with refresh-token rotation
>   a read-only Server Component can't persist a rotated token → users logged out ~1h after
>   sign-in. Safe path = enable **asymmetric JWT signing keys** in the Supabase dashboard,
>   then switch the proxy to `getClaims()` (local verify). Do the dashboard step and ping me
>   to wire it.
> - ✅ **Fix 4** batched helpers (`listSubmissionsForCampaigns`, `getProfilesByIds`,
>   `getCampaignsByIds`) + all 5 N+1 sites — done.
> - ✅ **Fix 5** `listUnreadNotifications` in brand layout + overview — done.
> - ✅ **Fix 6** `ledger_balance` RPC — done, made **resilient**: falls back to the row-sum
>   until migration `0012` is applied, so a deploy-before-migration can't break the app.
> - ✅ **Fix 7** landing cookie short-circuit — done.
> - 🔲 **Fix 3** (region) & **Fix 8** (CDN) — infra, your call. **Fix 9–11** — polish, later.
>
> **Requires a manual prod migration:** run `supabase/migrations/0012_ledger_balance_fn.sql`
> (fast path activates once applied; app works either way in the meantime).

Every fix below is concrete and scoped to this codebase: exact file, exact change,
copy-ready code, and what it buys. Ordered so the biggest wins land first. Fixes 1–6
are pure code changes in this repo; 7–8 are infra; 9–11 are polish.

---

## Fix 1 · Deduplicate `currentUser()` with React `cache()`  — **do this first**

**Problem:** `currentUser()` in [lib/auth/session.ts](lib/auth/session.ts) runs the full
`auth.getUser()` (network) + `getProfile` (query) chain every time it's called — and it's
called by the layout **and** the page **and** every server action on the same request.

**Change** in `lib/auth/session.ts`:

```ts
import { cache } from "react";                      // ← add

// was: export async function currentUser(): Promise<Profile | null> { … }
export const currentUser = cache(async (): Promise<Profile | null> => {
  if (hasSupabase) {
    const sb = await createSupabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return null;
    return (await getProfile(user.id)) ?? null;
  }
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;
  return (await getProfile(id)) ?? null;
});
```

Nothing else changes — `requireUser`/`requireRole`/`requireAdmin` in
[lib/auth/guards.ts](lib/auth/guards.ts) all funnel through this one function, so the
whole app dedupes at once. React `cache()` scopes to a single request, so there is no
staleness risk: the next request re-fetches.

**Wins:** −1 Auth round-trip and −1 profile query on *every* authenticated page
(layout + page now share), same again inside every server action that checks auth more
than once. Roughly **30–40% of the per-page round-trips gone with one edit.**

---

## Fix 2 · Make the proxy free (no network JWT validation per request)

**Problem:** [proxy.ts](proxy.ts) calls `supabase.auth.getUser()` — an HTTPS round-trip
to Supabase Auth — on **every matched request**, only to answer "logged in?". The file's
own comment says the real gates live in the layouts.

**Change** — replace the Supabase branch of `proxy()` with a local cookie-presence check:

```ts
export async function proxy(req: NextRequest) {
  if (hasSupabase) {
    // Optimistic gate: does a Supabase auth cookie exist at all? (local, 0ms)
    // Bad/expired sessions still bounce — currentUser() in every layout returns
    // null for them and the layout redirects to /login. The layouts remain the
    // security boundary (server actions all call requireX themselves).
    const hasAuthCookie = req.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
    return hasAuthCookie ? NextResponse.next() : toLogin(req);
  }
  // stub mode (unchanged)
  return req.cookies.get(COOKIE)?.value ? NextResponse.next() : toLogin(req);
}
```

**One trade-off to know:** `@supabase/ssr`'s middleware pattern also *refreshes* expiring
tokens. With this change, refresh happens instead when a layout/action calls
`createSupabaseServer()` → `auth.getUser()` (which auto-refreshes and writes cookies via
the `setAll` handler — already wired in [lib/supabase/server.ts](lib/supabase/server.ts);
Server-Component writes are caught and retried by the next action). If you'd rather keep
proxy-side refresh with zero network cost, the rigorous alternative is:

1. Supabase Dashboard → Project Settings → API → **enable asymmetric JWT signing keys**
2. In the proxy use `supabase.auth.getClaims()` — verifies the JWT **locally** against a
   cached JWKS (no per-request Auth call)

Either way: **−1 network round-trip on every single authenticated request.**

---

## Fix 3 · Co-locate the server and Supabase (the multiplier)

Every remaining round-trip costs the **Coolify-server ↔ Supabase** RTT. This is the
single number that decides whether pages feel instant or sluggish.

**Step 1 — measure, on the Coolify box** (SSH in, run twice, read the second):

```sh
curl -so /dev/null -w 'ttfb=%{time_starttransfer}s\n' https://pznpitlqjhawwakswgbc.supabase.co/auth/v1/health
curl -so /dev/null -w 'ttfb=%{time_starttransfer}s\n' https://pznpitlqjhawwakswgbc.supabase.co/auth/v1/health
```

**Step 2 — read the result:**

| Warm TTFB | Meaning | Action |
|---|---|---|
| < 20 ms | co-located | nothing to do — code fixes carry the day |
| 20–100 ms | same continent | acceptable; code fixes matter more |
| > 100 ms | cross-region | **fix this before anything else below** |

**Step 3 — if cross-region:** find the Supabase project's region (Dashboard → Project
Settings → General → Region), then move the **Coolify server** to the same provider region
— that's a redeploy, vs. migrating a database. For a Bangladesh audience the ideal end
state is **both in Singapore (`ap-southeast-1`)**: ~35–60 ms from Dhaka users, ~1–3 ms
server↔DB. (Moving a Supabase project's region requires creating a new project in the
target region and restoring a backup into it — doable, but move the app server first
since it's 10× easier.)

---

## Fix 4 · Kill the N+1 query loops

### 4a. Add three batched helpers to the DB layer

**[lib/db/supabase-impl.ts](lib/db/supabase-impl.ts):**

```ts
export async function listSubmissionsForCampaigns(campaignIds: string[]): Promise<Submission[]> {
  if (!campaignIds.length) return [];
  const { data } = await admin()
    .from("submissions").select("*").in("campaign_id", campaignIds);
  return (data ?? []).map(toSubmission);
}

export async function getProfilesByIds(ids: string[]): Promise<Profile[]> {
  if (!ids.length) return [];
  const { data } = await admin().from("profiles").select("*").in("id", ids);
  return (data ?? []).map(toProfile);
}

export async function getCampaignsByIds(ids: string[]): Promise<Campaign[]> {
  if (!ids.length) return [];
  const { data } = await (await sb()).from("campaigns").select("*").in("id", ids);
  return (data ?? []).map(toCampaign);
}
```

**[lib/db/store.ts](lib/db/store.ts)** (stub parity):

```ts
export function listSubmissionsForCampaigns(campaignIds: string[]): Submission[] {
  const set = new Set(campaignIds);
  return load().submissions.filter((s) => set.has(s.campaignId));
}
export function getProfilesByIds(ids: string[]): Profile[] {
  const set = new Set(ids);
  return load().profiles.filter((p) => set.has(p.id));
}
export function getCampaignsByIds(ids: string[]): Campaign[] {
  const set = new Set(ids);
  return load().campaigns.filter((c) => set.has(c.id));
}
```

**[lib/db/index.ts](lib/db/index.ts)** (facade, same `hasSupabase ? remote : local`
pattern as the neighbors).

### 4b. Use them at the five hot sites

**[app/brand/page.tsx:34](app/brand/page.tsx#L34)** — brand Overview (N campaigns → N
serial queries becomes **one**):

```ts
const subsAll = await listSubmissionsForCampaigns(campaigns.map((c) => c.id));
const viewsByCampaign = new Map<string, number>();
for (const s of subsAll) {
  const add =
    s.status === "settled" ? (s.lockedViews ?? 0)
    : s.status === "tracking" || s.status === "held" ? s.countedViews
    : 0;
  viewsByCampaign.set(s.campaignId, (viewsByCampaign.get(s.campaignId) ?? 0) + add);
}
```

**[app/admin/campaigns/page.tsx:41](app/admin/campaigns/page.tsx#L41)** — brand names:

```ts
const ids = [...new Set([...deletionRequests, ...list].map((c) => c.brandProfileId))];
const profiles = await getProfilesByIds(ids);
const brandNames = new Map(
  profiles.map((p) => [p.id, p.orgName ?? p.displayName ?? p.id]),
);
```

**[app/admin/payouts/page.tsx:20](app/admin/payouts/page.tsx#L20)** — same
`getProfilesByIds` pattern for the payout rows.

**[app/(app)/clips/page.tsx:25](app/(app)/clips/page.tsx#L25)** — campaign names:

```ts
const campaignRows = await getCampaignsByIds([...new Set(subs.map((s) => s.campaignId))]);
const campaignNames = new Map(campaignRows.map((c) => [c.id, c.name]));
```

**[app/admin/clippers/actions.ts:19](app/admin/clippers/actions.ts#L19)** — unblocking
payout batches after NID verify (writes, so parallelize):

```ts
await Promise.all(blocked.map((b) => updatePayoutBatch(b.id, { status: "queued" })));
```

**Wins:** pages stop scaling with data size. Brand Overview with 20 campaigns:
20 round-trips → 1. Admin payouts with 50 clippers: 50 → 1.

---

## Fix 5 · Lighten the brand layout's notification fetch

[app/brand/layout.tsx](app/brand/layout.tsx) awaits the **full** notification list on
every brand page render just to power the bell. Two options:

**Cheap (recommended now):** the bell dropdown only renders *unread* items and the dot
only needs a count — fetch only unread rows:

```ts
// lib/db/supabase-impl.ts
export async function listUnreadNotifications(profileId: string): Promise<Notification[]> {
  const { data } = await admin()
    .from("notifications").select("*").eq("profile_id", profileId)
    .is("read_at", null).order("created_at", { ascending: false }).limit(20);
  return (data ?? []).map(toNotification);
}
```

Layout uses this instead of `listNotifications`. Same round-trip count but a
constant-size payload with a hot partial index behind it
(`notifications_unread_idx` from migration 0011 already covers exactly this query).

**Later:** move the list into the bell as a lazy client fetch (route handler +
`onToggle`), so navigations don't pay for it at all.

---

## Fix 6 · Sum the ledger in SQL, not JavaScript

[lib/db/supabase-impl.ts](lib/db/supabase-impl.ts) `ledgerBalance()` downloads **every**
ledger row for an account and reduces in Node — and it runs in the clipper layout header
on every clipper navigation. O(all-time transactions) per page view.

**Migration `supabase/migrations/0012_ledger_balance_fn.sql`:**

```sql
-- Server-side ledger sum: O(index scan) instead of shipping every row to Node.
create or replace function public.ledger_balance(p_account text)
returns bigint
language sql
stable
as $$
  select coalesce(sum(amount_poisha), 0)::bigint
  from public.ledger_entries
  where account = p_account;
$$;

-- The account column is already indexed (ledger_entries_account_idx).
```

**Code change:**

```ts
export async function ledgerBalance(account: string): Promise<number> {
  const { data, error } = await admin().rpc("ledger_balance", { p_account: account });
  if (error) throw error;
  return Number(data ?? 0);
}
```

(Stub `store.ts` version stays as-is — dev data is tiny.) Run 0012 on prod like the
previous migrations.

---

## Fix 7 · Make the landing page free for anonymous visitors

[app/page.tsx:22](app/page.tsx#L22) calls `currentUser()` on every hit to bounce
logged-in users to their console. For **anonymous** visitors (most landing traffic,
especially at launch) that machinery is wasted. Short-circuit on cookie presence:

```ts
import { cookies } from "next/headers";

export default async function LandingPage() {
  const jar = await cookies();
  const mightBeLoggedIn = jar
    .getAll()
    .some((c) => (c.name.startsWith("sb-") && c.name.includes("-auth-token")) || c.name === "klipr_uid");
  if (mightBeLoggedIn) {
    const user = await currentUser();
    if (user && accessAllowed(user)) redirect(routeFor(user));
  }
  // … render landing
}
```

Anonymous visitors skip auth entirely; logged-in users behave exactly as today.

---

## Fix 8 · Put a CDN in front of the origin

Today joinklipr.com serves everything — HTML, JS, fonts, images — straight from the
Coolify box (no `via`/`cf-ray` headers on responses). One box, one region, no edge.

**Cloudflare free tier, ~20 minutes:**

1. Add the domain to Cloudflare, move the two DNS records, enable the orange-cloud proxy.
2. SSL/TLS mode: **Full (strict)** (Coolify's Let's Encrypt cert keeps working).
3. Done — by default Cloudflare caches static extensions and `/_next/static/*`
   (immutable-cached already, so edge hit-rate → ~100%) and does **not** cache HTML,
   so auth/dynamic pages are untouched.
4. Optional: a Cache Rule to "Bypass cache" on `/api/*` for belt-and-suspenders.

**Wins:** static assets served from the visitor's nearest POP (Dhaka included), origin
shielded from asset traffic, free DDoS absorption for launch day.

---

## Fix 9 · Fonts: stop the fallback flash (perceived speed)

Build warns: `Failed to find font override values for font "Stack Sans Headline"/"Stack
Sans Text"` — Next can't compute fallback metrics for these Google fonts, so text first
paints in a mismatched system font, then visibly reflows when the webfont lands. That
reflow is a big part of "feels slow/janky" on first load.

Best fix: **self-host the brand-kit font files** (they're in the `Klipr/` brand folder)
via `next/font/local`, which computes size-adjusted fallbacks automatically:

```ts
// app/layout.tsx
import localFont from "next/font/local";

const display = localFont({
  src: [
    { path: "../fonts/StackSansHeadline-Medium.woff2", weight: "500" },
    { path: "../fonts/StackSansHeadline-SemiBold.woff2", weight: "600" },
    { path: "../fonts/StackSansHeadline-Bold.woff2", weight: "700" },
  ],
  variable: "--font-stack-headline",
  display: "swap",
  adjustFontFallback: "Arial",   // auto-computed size-adjust → no layout shift
});
// same pattern for Stack Sans Text → --font-body
```

Bonus: fonts then ship from your own origin/CDN with immutable caching instead of an
extra connection to Google — one less DNS+TLS handshake on first visit.

---

## Fix 10 · Adopt `next/image` where images actually cost something

There is currently **zero** `next/image` usage — every image is a raw `<img>`. Priorities:

1. **Campaign covers** ([components/app/campaign-cover.tsx](components/app/campaign-cover.tsx))
   — will be real uploads soon; raw `<img>` means full-size downloads, no lazy-loading,
   no AVIF/WebP. Convert to `<Image fill sizes="(max-width: 640px) 100vw, 33vw">`.
2. **Landing mockup** (`public/brand/app-mockup.png`, 696 KB) — `<Image>` with explicit
   width/height gets it resized + AVIF'd per viewport.
3. **Brand logos from Supabase Storage** — add the storage host to
   [next.config.ts](next.config.ts) `remotePatterns`:
   ```ts
   { protocol: "https", hostname: "pznpitlqjhawwakswgbc.supabase.co" },
   ```
4. Google avatars (`lh3.googleusercontent.com`) are already tiny — lowest priority.

---

## Fix 11 · One animation runtime, not three

The landing ships **gsap + motion + lenis** (three overlapping animation engines;
largest client chunk 224 KB). Landing TTFB is fine, so this is hydration/interaction
cost, not urgent. When touched next:

```sh
grep -rln "from \"motion\|from \"gsap\|@gsap" components app   # see who uses what
```

Pick one (gsap + lenis covers everything `motion` does here), migrate the few
`motion` usages, drop the dependency. Expect ~40–80 KB gzipped off the landing bundle.

---

## Verifying the wins

**Logged-in TTFB (the number that matters):** Chrome DevTools → Network → click the
document row → *Timing* tab → **Waiting for server response** on `/brand`,
`/brand/campaigns`, `/home`, `/admin/campaigns`, before vs. after each fix batch.

**Anonymous baseline (should stay flat):**

```sh
curl -so /dev/null -w 'ttfb=%{time_starttransfer}s\n' https://joinklipr.com/
```

**Expected end state** (with server+Supabase co-located): authenticated TTFB in the
**200–400 ms** range, admin/brand lists flat regardless of row counts, no font reflow,
static assets from the nearest edge.

---

## Order of execution

| Step | Fix | Where | Effort |
|---|---|---|---|
| 1 | `cache(currentUser)` | code (Fix 1) | 5 min |
| 2 | Proxy cookie check | code (Fix 2) | 15 min |
| 3 | Region measurement → move server if needed | infra (Fix 3) | 5 min + optional migration |
| 4 | Batched DB helpers + 5 call sites | code (Fix 4) | ~1 h |
| 5 | Unread-only notifications | code (Fix 5) | 20 min |
| 6 | `ledger_balance` RPC + migration 0012 | code+SQL (Fix 6) | 30 min |
| 7 | Landing cookie short-circuit | code (Fix 7) | 10 min |
| 8 | Cloudflare in front | infra (Fix 8) | 20 min |
| 9 | Self-hosted fonts | code (Fix 9) | 30 min |
| 10 | `next/image` for covers/mockup | code (Fix 10) | ~1 h |
| 11 | Drop one animation lib | code (Fix 11) | ~1 h |

Steps 1–7 are the speed story; 8–11 are polish. Say the word and I'll implement steps
1, 2, 4, 5, 6, 7 in one pass (they're independent of the infra decisions and safe to
ship together).
