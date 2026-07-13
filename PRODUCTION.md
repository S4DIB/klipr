# Klipr — Production Setup

Klipr runs in **two modes**, chosen automatically by environment:

| Mode | When | Persistence | Auth |
|---|---|---|---|
| **Stub** (default) | no Supabase env | local `.data/db.json` | demo cookie identity |
| **Production** | Supabase env set | Supabase Postgres + RLS | Supabase Google OAuth |

The app code is identical in both — only `lib/db/index.ts` and `lib/auth/session.ts` branch on `hasSupabase`.

---

## Local dev (zero config)
```bash
npm install
npm run dev          # http://localhost:3000
```
Sign in with **Continue with Google** (stubbed) or **Explore the admin console**.

## Verify
```bash
npm test             # payout engine unit tests
npx tsc --noEmit     # typecheck
npm run lint
npm run build
```

---

## Going to production with Supabase

**1. Create a Supabase project** → copy the Project URL, the `anon` (publishable) key, and the `service_role` key.

**2. Run the migration** — paste `supabase/migrations/0001_init.sql` into the Supabase **SQL editor** and run it (creates tables, RLS policies, the signup trigger, and seed campaigns).

**3. Enable Google OAuth**
- Google Cloud Console → create an OAuth 2.0 Client (Web). Authorized redirect URI:
  `https://<your-project>.supabase.co/auth/v1/callback`
- Supabase → Authentication → Providers → **Google**: paste the client ID + secret.
- Supabase → Authentication → URL config → add redirect URLs:
  `http://localhost:3000/auth/callback` and your production `https://…/auth/callback`.

**4. Set env** (`.env.local`, from `.env.example`)
```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
Restart `npm run dev` — the app is now on real Supabase + Google.

**5. Make yourself admin** (after first sign-in), in the SQL editor:
```sql
update public.profiles set role='admin', profile_completed=true where email='you@example.com';
```

**6. Deploy** (Vercel): set the same env vars (point `NEXT_PUBLIC_SITE_URL` at the prod domain), and add the prod `/auth/callback` URL to both Supabase and Google.

---

## Security model
- **RLS on every table** — clippers read only their own submissions/earnings; verified clips are publicly readable (top-clips); only admins write campaigns/verifications/payouts. `is_admin()` is `SECURITY DEFINER` to avoid policy recursion.
- **Service-role key is server-only** (`lib/supabase/admin.ts`); never shipped to the client.
- **Security headers** on every response (`next.config.ts`): HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
- **Payout engine is unit-tested** (`lib/payout.test.ts`) — floor rounding never exceeds budget; divide-by-zero guarded.
- The proxy (`proxy.ts`) refreshes the Supabase session and does an optimistic auth gate; the **real** onboarding/role gates live in the route layouts (DB-aware).

## Follow-ups (not blocking)
- Add a Content-Security-Policy (nonce-based) once asset origins are finalised.
- Storage buckets for source clips + proof screenshots (currently URLs).
- Transactional emails (approval / payout) and rate limiting on submit.
