# Collecting & emailing your waitlist leads

Everyone who submits the waitlist form is saved as a **lead**. This guide gets
that working reliably (so you never lose a lead once ads are running) and shows
how to download the list to email everyone.

> **Why this matters:** without the setup below, leads are written to a file
> *inside the container* that is **wiped every time you redeploy** on Coolify.
> Do the 3 steps first, before spending on ads.

---

## Step 1 — Create a free Supabase project (your durable database)

1. Go to <https://supabase.com> → sign up → **New project**. Pick a name and a
   strong database password. The free tier is plenty for a waitlist.
2. When it's ready, open **Project Settings → API** and copy these 3 values:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon public** key
   - **service_role** key ⚠️ *secret — server only, never share/publish it*

## Step 2 — Create the leads table

1. In Supabase, open the **SQL Editor** → **New query**.
2. Paste the contents of **`supabase/migrations/0001_init.sql`**, click **Run**.
3. New query again, paste **`supabase/migrations/0002_waitlist_leads.sql`**,
   click **Run**. (This creates the locked-down `waitlist_leads` table.)
4. New query again, paste **`supabase/migrations/0003_waitlist_lead_fields.sql`**,
   click **Run**. (Adds the brand `company`/`designation` and clipper
   `post_frequency` columns used by the v2 signup forms.) The signup form keeps
   working even before you run this — those three fields just start saving once
   you do.

## Step 3 — Add the keys to Coolify, then redeploy

In Coolify → your **klipr app → Environment Variables**, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
WAITLIST_EXPORT_TOKEN=<make up a long random password, e.g. 40 chars>
```

Save → **Redeploy**. Done — every waitlist signup now lands in Supabase and
survives redeploys.

---

## Seeing / downloading your leads

**Option A — Supabase dashboard (easiest):**
Supabase → **Table Editor → `waitlist_leads`**. You see every lead. Click the
**Export** button for a CSV.

**Option B — one-click CSV from your site:**
Open this URL (using the `WAITLIST_EXPORT_TOKEN` you set):

```
https://joinklipr.com/api/waitlist/export?token=YOUR_TOKEN
```

It downloads `klipr-leads-YYYY-MM-DD.csv` with every lead. Keep the token
private — anyone with it can download your list.

> Putting the token in the URL is the easy way, but the URL (with the token)
> lands in your browser history and server access logs. For anything automated,
> pass it as a header instead — `x-export-token: YOUR_TOKEN` — and treat the
> token like a password (rotate it if it leaks).

---

## Emailing all your leads

You've got the list; now send to it. Two easy paths:

**Path 1 — export & import (no code):**
Download the CSV (above) → create a free account at an email tool
([Brevo](https://www.brevo.com), [Mailchimp](https://mailchimp.com), or
[Loops](https://loops.so)) → import the CSV as contacts → send a campaign.
Repeat the export whenever you want the latest leads.

**Path 2 — auto-sync every new lead (optional):**
Set one more env var and every signup is forwarded in real time to any tool
that accepts a webhook (Zapier, Make, n8n, Loops, …):

```
LEADS_WEBHOOK_URL=<the webhook URL from your automation/email tool>
```

The site POSTs the lead as JSON (`email`, `role`, `name`, `phone`, `category`,
`handles`, `source`, `at`). Point it at a "Catch Hook" step that adds the
contact to your audience. Supabase still stores every lead regardless, so this
is a bonus, not a single point of failure.

---

## Tracking which ads convert

Add a `source` to the signup so you can tell which ad/campaign it came from.
When you send paid traffic, append it to your landing URL, e.g.:

```
https://joinklipr.com/?utm_source=tiktok&utm_campaign=launch1
```

The form reads those UTM params automatically and stores them in the `source`
column, so you can see which ad each lead came from. (If there are no UTM params
it records the referring site instead.)

---

## FAQ

- **Do I have to use Supabase?** It's strongly recommended — it's free, durable,
  and the rest of the app needs it anyway. Without it, leads only live in an
  ephemeral file and are lost on redeploy (they're also written to the deploy
  logs as a last-ditch backup, but don't rely on that).
- **Can visitors see other people's emails?** No. The `waitlist_leads` table has
  Row Level Security on with no public policies, so the browser's key can't read
  it. Only your server (service_role key) and the token-protected export can.
- **Duplicate signups?** Deduplicated by email automatically — one row per person.
