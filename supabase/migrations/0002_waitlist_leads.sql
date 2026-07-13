-- Klipr — waitlist leads (pre-launch marketing capture for paid ads).
-- Run in the Supabase SQL editor AFTER 0001_init.sql (or `supabase db push`).
--
-- Locked down by design: RLS is ON with NO policies, so the public `anon`
-- key can neither read nor write this table. Only the server-side
-- `service_role` key (which bypasses RLS) touches it — the email list can
-- never leak through the browser.

create table if not exists public.waitlist_leads (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,          -- always stored lowercased (normalized in app)
  role       text not null default 'clipper' check (role in ('clipper','brand')),
  name       text,
  phone      text,
  category   text,
  handles    jsonb not null default '[]'::jsonb,
  source     text,                          -- ad / campaign attribution (utm, referrer)
  created_at timestamptz not null default now()
);

create index if not exists waitlist_leads_created_idx
  on public.waitlist_leads (created_at desc);

alter table public.waitlist_leads enable row level security;
-- No policies on purpose. service_role bypasses RLS; anon/authenticated get nothing.
