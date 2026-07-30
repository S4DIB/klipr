# Go live — Supabase + Google auth + manual verification

The code is ready. Production runs on your Supabase project with real Google
sign-in and **manual** admin verification (no platform APIs). This is the
checklist for the parts only you can do (create the Google OAuth app, run SQL
on your project). Nothing is live until you finish these.

Your Supabase project: **`pznpitlqjhawwakswgbc`** (URL already in `.env`).

---

## 1. Apply the database migrations

Run `supabase/migrations/0001` → `0006` **in order** on your project — either:

- **Supabase CLI:** `supabase link --project-ref pznpitlqjhawwakswgbc` then `supabase db push`, or
- **SQL editor:** paste each file's contents in order and run.

`0006_manual_verification.sql` is the new one — it lets a connected account be
`pending` / `manual` and adds `verified_at` / `verified_by`.

## 2. Configure Google sign-in (Supabase Auth provider)

1. **Google Cloud Console** → *APIs & Services → Credentials* → *Create OAuth client ID* → **Web application**.
2. Under **Authorized redirect URIs**, add:
   ```
   https://pznpitlqjhawwakswgbc.supabase.co/auth/v1/callback
   ```
3. Copy the **Client ID** and **Client secret**.
4. **Supabase dashboard** → *Authentication → Providers → Google* → enable, paste the Client ID + secret, save.
5. **Authentication → URL Configuration**:
   - **Site URL** = your production origin (e.g. `https://app.klipr.co`).
   - **Redirect URLs** = add `https://YOUR-DOMAIN/auth/callback` (and `http://localhost:3000/auth/callback` if you sign in locally).

## 3. Environment variables (production host)

Set these where you deploy (Vercel/host env, **not** committed):

| Var | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | already set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | already set |
| `SUPABASE_SERVICE_ROLE_KEY` | already set (server only) |
| `NEXT_PUBLIC_SITE_URL` | your production origin |
| `TOKEN_KEY` | `openssl rand -base64 32` (AES key for token/NID encryption) |
| `CRON_SECRET` | `openssl rand -hex 32` (bearer for `/api/cron/sweep`) |
| `KLIPR_FORCE_STUB` | **must be unset** in production |

Leave `YOUTUBE_API_KEY` / `VERIFY_MODE_*` empty → every platform stays **manual**
(admin enters view counts). Set `YOUTUBE_API_KEY` later to flip YouTube live.

## 4. Admin access — automatic

The SaaS admin is **`shahsadib25@gmail.com`** (built into the code —
`DEFAULT_ADMIN_EMAILS` in `lib/auth/preapproval.ts`). Just **sign in with that
Google account** → you're provisioned as an active admin automatically and land
on `/admin`. **No SQL step needed.**

- Only allowlisted emails can ever be admin. Everyone else who signs in is a
  clipper — and only gets in if you approved them on the waitlist.
- To add/change admins: set `ADMIN_EMAILS=a@x.com,b@y.com` in your env, or edit
  `DEFAULT_ADMIN_EMAILS`.

From `/admin` you approve waitlist leads in **/admin/applications**, and those
people can then sign in.

> Manual fallback (if you ever need it): you can still promote any profile by
> hand — `update public.profiles set role='admin', access='active',
> profile_completed=true where email='…';` in the Supabase SQL editor.

## 5. Deploy

With migrations applied, the Google provider configured, and `KLIPR_FORCE_STUB`
unset, the app runs entirely on Supabase.

---

## Access is invite-only (no self-serve sign-up)

A Google sign-in is **refused** unless the email is one you approved. The only
way in for a clipper:

1. They **join the waitlist** on the landing page (or you add them as a lead).
2. You **approve the lead** in `/admin/applications` (waitlist queue).
3. They **sign in with Google using that same email** → they're let in and
   promoted to active automatically. Any other email is bounced to
   `/login?error=not_approved` with a "join the waitlist" link — no account is
   created. (Admins and brands are provisioned by you, not self-serve.)

There is no self-serve "apply" form anymore. To let someone in, approve their
waitlist lead first.

## How manual verification works (the admin loop)

Because there are no platform APIs, two things are manual — both in the admin
console (`/admin`):

1. **Accounts** (`/admin/accounts`) — when a clipper connects a vetted page, the
   account is created **pending**. Open the page, confirm it's really theirs,
   and **Approve** (→ active) or **Reject**. Only approved accounts can submit.
2. **Clips** (`/admin/clips`) — every submitted clip lands here. Open the post,
   read its real view count, type it in, and **Approve · settle** — that number
   pays the clipper at the campaign rate and awards XP (below the campaign
   minimum it settles honestly at ৳0). **Reject** if it breaks the brief.

Everything downstream (earnings, wallet, XP, tiers, payouts) runs itself from
the number you enter. Funding, NID checks, fraud holds, and bKash payouts remain
the same admin actions as before. The cron sweep still runs but **skips**
manual-mode clips — it never fabricates a view count.

## Local development

`.env` keeps `KLIPR_FORCE_STUB=1`, so local dev uses the file store with **no
demo data** (empty store). "Continue with Google" mints a fresh applicant; set
`KLIPR_DEV_ADMIN_EMAIL=you@gmail.com` (already in `.env`) so that identity is an
admin and you can reach the verification queues locally.
