# Klipr — Production Setup (V2)

Klipr runs in **two modes**, chosen automatically by environment:

| Mode | When | Persistence | Auth |
|---|---|---|---|
| **Stub** (default) | no Supabase env | local `.data/db.json` (v3 seed) | demo cookie identities |
| **Production** | Supabase env set | Supabase Postgres + RLS | Supabase Google OAuth |

App code is identical in both — `lib/db/index.ts` and `lib/auth/session.ts`
branch on `hasSupabase`. All money is integer poisha; the ledger is zero-sum
by construction.

---

## Local dev (zero config)

```bash
npm install
npm run dev          # http://localhost:3000
```

> If a root `.env` holds Supabase values, force stub mode:
> `NEXT_PUBLIC_SUPABASE_URL="" NEXT_PUBLIC_SUPABASE_ANON_KEY="" SUPABASE_SERVICE_ROLE_KEY="" npm run dev`

**Demo identities** (login page, stub only): active Clipper · Network Manager
(agency) · waitlisted Applicant · Brand · Admin. Dev-only QA endpoints
(404 in production): `/dev-login?as=usr_admin` · `/dev-sweep?at=<iso>`
(time-travel the settlement sweep) · `/dev-submit` · `/styleguide`.

## Verify

```bash
npm test             # money/ledger/XP/crypto/fraud/parse engines
npx tsc --noEmit     # typecheck
npm run lint         # eslint (flat config)
npm run build        # production build
```

Full stub E2E: sign in as the Applicant → apply → Admin vets (Clipper
Standard checklist) → approve → onboarding → submit a clip in a funded
campaign → `/dev-sweep?at=<+8 days>` settles it → wallet → request payout →
Admin verifies NID → marks paid with a bKash txn ref. The ledger stays
zero-sum throughout.

---

## Going to production with Supabase

1. **Create a Supabase project** → copy Project URL, anon key, service-role key.
2. **Run migrations in order** in the SQL editor: `0001` → `0002` → `0003` →
   **`0004_v2_schema.sql`** (V2 model: applications, connected accounts,
   ledger, XP, payouts, fraud, the `settle_submission` transaction). Run
   `0004` in a maintenance window; the waitlist/leads tables are untouched.
3. **Enable Google OAuth** (sign-in): Google Cloud OAuth client (Web),
   redirect `https://<project>.supabase.co/auth/v1/callback`; paste ID+secret
   in Supabase Auth → Providers → Google; add `http://localhost:3000/auth/callback`
   and the prod `/auth/callback` to the URL config.
4. **Set env** (`.env.local`, from `.env.example` — placeholders only, never
   commit real values):
   - Supabase trio + `NEXT_PUBLIC_SITE_URL`
   - `YOUTUBE_API_KEY` — flips the YouTube adapter LIVE (Data API v3, ~10k
     units/day default is ample)
   - `GOOGLE_OAUTH_CLIENT_ID/SECRET` — a SECOND OAuth client for the
     "connect YouTube channel" flow (scope `youtube.readonly`), redirect
     `https://<site>/api/connect/youtube/callback`
   - `TOKEN_KEY` (`openssl rand -base64 32`) — AES-256-GCM for OAuth tokens + NID
   - `CRON_SECRET` (`openssl rand -hex 32`) — protects `/api/cron/sweep`
   - `VERIFY_MODE_TIKTOK/INSTAGRAM/FACEBOOK` stay `simulated` until each
     platform's app review passes; the UI labels them honestly
   - `WAITLIST_EXPORT_TOKEN` (+ optional `LEADS_WEBHOOK_URL`) — landing leads
5. **Make yourself admin** after first sign-in:
   ```sql
   update public.profiles
     set role='admin', access='active', profile_completed=true
     where email='you@example.com';
   ```
6. **Deploy (Vercel):** set the same env vars. `vercel.json` schedules
   `/api/cron/sweep` every 15 min (Vercel sends `Authorization: Bearer
   $CRON_SECRET` automatically). **Hobby plan allows only daily crons** — use
   GitHub Actions/cron-job.org to curl the endpoint every 15 min until on Pro.
   The sweep is idempotent; overlapping pings are harmless.

## Launch policy (per flows v2)
Real-money campaigns are **YouTube-only** until TikTok/Meta app reviews pass.
Simulated platforms stay visible with the `Simulated` chip and "pending
platform approval" copy. Flip each with `VERIFY_MODE_<PLATFORM>=live` once
its adapter has a live implementation and approval.

## Security model
- **RLS everywhere**; money/verification/vetting writes go through the
  service-role client only after `lib/auth/guards.ts` authorises the caller
  (server actions re-check auth — the proxy matcher can't cover them).
- **Secrets at rest:** OAuth tokens + NID numbers are AES-256-GCM ciphertext
  (`TOKEN_KEY`); columns excluded from user-facing selects; NID rendered
  masked (last 4).
- **Ledger integrity:** unique `(event_id, account)` makes settlements,
  fundings, refunds and payouts idempotent — double-running the sweep or
  double-clicking "mark paid" cannot double-book.
- Security headers on every response (`next.config.ts`).

## Follow-ups (not blocking)
- bKash Payout API to replace the manual send (drop-in behind PayoutBatch).
- TikTok Display API + Meta Graph adapters when app reviews land.
- Storage buckets for campaign assets (currently URLs).
- Transactional emails (approval / settlement / payout) + a nonce-based CSP.
- Founder sign-off on `XP_CONFIG` numbers before public launch.
