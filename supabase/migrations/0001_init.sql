-- Klipr — initial schema, RLS, signup trigger, seed.
-- Run in the Supabase SQL editor (or `supabase db push`).

-- ── Tables ──────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default '',
  avatar_url text,
  role text not null default 'individual' check (role in ('individual','agency','admin')),
  payout_number text,
  page_url text,
  handle text,
  platform text,
  follower_count int default 0,
  account_status text not null default 'active' check (account_status in ('active','blocked')),
  profile_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id text primary key,
  name text not null,
  brand text not null,
  brief text not null default '',
  guidelines text not null default '',
  niche text not null default '',
  allowed_platforms text[] not null default '{}',
  source_url text,
  budget int not null default 0,
  min_view_threshold int not null default 0,
  start_date timestamptz not null default now(),
  end_date timestamptz not null,
  status text not null default 'active' check (status in ('draft','active','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id text primary key,
  campaign_id text not null references public.campaigns(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  posting_handle text not null default '',
  platform text not null,
  post_url text not null unique,
  proof_url text,
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  reject_reason text,
  verified_views int not null default 0,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists submissions_campaign_idx on public.submissions(campaign_id);
create index if not exists submissions_profile_idx on public.submissions(profile_id);

create table if not exists public.payouts (
  id text primary key,
  campaign_id text not null references public.campaigns(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  views_used int not null default 0,
  amount int not null default 0,
  status text not null default 'pending' check (status in ('pending','paid')),
  txn_ref text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists payouts_campaign_idx on public.payouts(campaign_id);
create index if not exists payouts_profile_idx on public.payouts(profile_id);

-- ── Admin helper (SECURITY DEFINER avoids RLS recursion) ─
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ── New-user trigger: create a profile row on signup ────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ──────────────────────────────────
alter table public.profiles    enable row level security;
alter table public.campaigns   enable row level security;
alter table public.submissions enable row level security;
alter table public.payouts     enable row level security;

-- profiles: read/update your own; admins everything
create policy "profiles_self_read"   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles_self_insert" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_self_update" on public.profiles for update using (id = auth.uid() or public.is_admin());

-- campaigns: anyone can read; only admins write
create policy "campaigns_read"  on public.campaigns for select using (true);
create policy "campaigns_write" on public.campaigns for all using (public.is_admin()) with check (public.is_admin());

-- submissions: own + verified (public top-clips) + admin; insert your own; only admin updates
create policy "submissions_read"   on public.submissions for select
  using (profile_id = auth.uid() or status = 'verified' or public.is_admin());
create policy "submissions_insert" on public.submissions for insert with check (profile_id = auth.uid());
create policy "submissions_update" on public.submissions for update using (public.is_admin()) with check (public.is_admin());

-- payouts: own + admin; only admin writes
create policy "payouts_read"  on public.payouts for select using (profile_id = auth.uid() or public.is_admin());
create policy "payouts_write" on public.payouts for all using (public.is_admin()) with check (public.is_admin());

-- ── Seed campaigns ──────────────────────────────────────
insert into public.campaigns (id, name, brand, brief, guidelines, niche, allowed_platforms, source_url, budget, min_view_threshold, end_date, status) values
  ('cmp_aila','Eid drop teaser','Aila Active','Tease the Eid collection with fast, punchy cuts. Hook in the first 2 seconds.','Keep it under 30s. Do not alter the logo. No competitor brands in frame.','Fashion','{TikTok,Instagram}','https://example.com/aila.mp4',40000,2000, now()+interval '14 days','active'),
  ('cmp_north','New single rollout','Northbeat Records','Clip the most viral 15s of the music video. Caption with the song name.','Audio must stay original. Credit @northbeat in the caption.','Music','{YouTube,TikTok}','https://example.com/north.mp4',75000,3000, now()+interval '21 days','active'),
  ('cmp_pulse','Top story recaps','Pulse Daily','Recap the day''s top story in a 20s vertical clip.','Factual only. No editorialising. Use the supplied footage.','News','{Instagram,Facebook}','https://example.com/pulse.mp4',25000,2000, now()+interval '10 days','active'),
  ('cmp_orbit','App launch UGC','Orbit App','Show one feature you''d actually use. Authentic, talking-head style.','Show the app on screen. No paid-actor vibes. Be real.','Tech','{TikTok,YouTube}','https://example.com/orbit.mp4',50000,2500, now()+interval '18 days','active')
on conflict (id) do nothing;

-- To make yourself an admin after first sign-in:
--   update public.profiles set role='admin', profile_completed=true where email='you@example.com';
