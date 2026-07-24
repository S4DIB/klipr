-- ============================================================
-- Klipr V2.1 schema — the gated-access, tiers/XP, auto-verification model.
-- See KLIPR-BUILD-PLAN.md §3 and `Klipr Product Flows v2.pdf`.
--
-- Money: ALL amounts are integer poisha (৳ × 100).
-- Run in a maintenance window: this drops & recreates campaign/submission
-- tables (V1 held only seed data). The waitlist_leads tables (0002/0003)
-- are untouched.
-- ============================================================

-- ── profiles: V1 → V2.1 ─────────────────────────────────────
alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'clipper' where role = 'individual';
alter table public.profiles
  add constraint profiles_role_check check (role in ('clipper','brand','agency','admin'));
alter table public.profiles alter column role set default 'clipper';

alter table public.profiles rename column payout_number to bkash_number;

alter table public.profiles
  add column if not exists access text not null default 'none'
    check (access in ('none','waitlisted','active','declined')),
  add column if not exists tier text not null default 'beginner'
    check (tier in ('beginner','hustler','pro','elite')),
  add column if not exists xp_total integer not null default 0,
  add column if not exists streak_weeks integer not null default 0,
  add column if not exists nid_status text not null default 'none'
    check (nid_status in ('none','submitted','verified')),
  add column if not exists nid_number_enc text,
  add column if not exists org_name text,
  add column if not exists onboarding_step integer not null default 0,
  add column if not exists leaderboard_opt_out boolean not null default false;

-- admins/brands created pre-migration keep working
update public.profiles set access = 'active' where role in ('admin','brand','agency');

alter table public.profiles
  drop column if exists page_url,
  drop column if exists handle,
  drop column if exists platform,
  drop column if exists follower_count;

-- ── V1 tables that are superseded ───────────────────────────
drop table if exists public.payouts;
drop table if exists public.submissions;
drop table if exists public.campaigns;

-- ── applications (the access loop) ──────────────────────────
create table public.applications (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('clipper','agency')),
  note text not null default '',
  status text not null default 'submitted' check (status in ('submitted','approved','declined')),
  decline_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index applications_status_created_idx on public.applications (status, created_at);
create index applications_profile_idx on public.applications (profile_id);

create table public.application_pages (
  id text primary key,
  application_id text not null references public.applications(id) on delete cascade,
  platform text not null check (platform in ('facebook','tiktok','instagram','youtube')),
  handle text not null,
  url text not null,
  self_reported_followers integer not null default 0,
  niche text not null default 'Other',
  vet_status text not null default 'pending' check (vet_status in ('pending','approved','declined')),
  vet_checklist jsonb,
  vet_note text
);
create index application_pages_app_idx on public.application_pages (application_id);

-- ── connected accounts (ownership proof) ────────────────────
create table public.connected_accounts (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('facebook','tiktok','instagram','youtube')),
  application_page_id text not null references public.application_pages(id),
  external_id text not null,
  handle text not null,
  display_name text,
  avatar_url text,
  follower_count integer,
  proof text not null check (proof in ('oauth','simulated')),
  access_token_enc text,   -- AES-256-GCM ciphertext; service-role only
  refresh_token_enc text,  -- AES-256-GCM ciphertext; service-role only
  token_expires_at timestamptz,
  status text not null default 'active' check (status in ('active','revoked')),
  created_at timestamptz not null default now()
);
create index connected_accounts_profile_idx on public.connected_accounts (profile_id);
create unique index connected_accounts_platform_external_idx
  on public.connected_accounts (platform, external_id);

-- ── campaigns ────────────────────────────────────────────────
create table public.campaigns (
  id text primary key,
  brand_profile_id uuid not null references public.profiles(id),
  name text not null,
  brand_name text not null,
  brief text not null default '',
  guidelines text not null default '',
  niche text not null default 'Other',
  allowed_platforms text[] not null default '{}',
  source_url text not null default '',
  cover_url text,
  budget_poisha bigint not null check (budget_poisha > 0),
  spent_poisha bigint not null default 0,
  rate_clipper_per_1k integer not null default 5000,  -- ৳50; identical at every tier
  rate_brand_per_1k integer not null default 6000,    -- ৳60; future tiered client rates change this snapshot
  min_qualify_views integer not null default 2000,    -- 2,000–4,000 per flows v2
  max_payout_per_clipper_poisha bigint not null default 500000,
  submission_cap_base integer not null default 1,
  early_access_tier text check (early_access_tier in ('pro','elite')),
  early_access_ends_at timestamptz,
  tracking_window_days numeric not null default 7,
  start_date timestamptz not null,
  end_date timestamptz not null,
  status text not null default 'draft'
    check (status in ('draft','pending_funding','active','settling','completed','cancelled')),
  funded_at timestamptz,
  created_at timestamptz not null default now()
);
create index campaigns_status_idx on public.campaigns (status);
create index campaigns_brand_idx on public.campaigns (brand_profile_id);

-- ── submissions ──────────────────────────────────────────────
create table public.submissions (
  id text primary key,
  campaign_id text not null references public.campaigns(id) on delete cascade,
  profile_id uuid not null references public.profiles(id),
  connected_account_id text not null references public.connected_accounts(id),
  platform text not null check (platform in ('facebook','tiktok','instagram','youtube')),
  post_url text not null unique,
  media_id text not null,
  baseline_views integer not null default 0,
  latest_views integer not null default 0,
  counted_views integer not null default 0,
  locked_views integer,
  earned_poisha bigint,
  xp_awarded integer,
  status text not null default 'pending'
    check (status in ('pending','tracking','held','settled','rejected')),
  hold_reason text,
  reject_reason text,
  submitted_at timestamptz not null default now(),
  window_ends_at timestamptz not null,
  settled_at timestamptz,
  unique (campaign_id, media_id)
);
create index submissions_sweep_idx on public.submissions (status, window_ends_at);
create index submissions_profile_idx on public.submissions (profile_id);
create index submissions_campaign_idx on public.submissions (campaign_id);

-- ── view snapshots ───────────────────────────────────────────
create table public.view_snapshots (
  id text primary key,
  submission_id text not null references public.submissions(id) on delete cascade,
  views integer not null,
  source text not null check (source in ('live','simulated')),
  captured_at timestamptz not null default now()
);
create index view_snapshots_submission_idx on public.view_snapshots (submission_id, captured_at);

-- ── xp events ────────────────────────────────────────────────
create table public.xp_events (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  connected_account_id text references public.connected_accounts(id),
  submission_id text references public.submissions(id),
  campaign_id text references public.campaigns(id),
  amount integer not null,
  reason text not null check (reason in ('views','completion_bonus','streak_bonus','adjustment')),
  created_at timestamptz not null default now()
);
create index xp_events_profile_idx on public.xp_events (profile_id);
create index xp_events_account_idx on public.xp_events (connected_account_id);

-- ── ledger (append-only, zero-sum per event_id) ─────────────
create table public.ledger_entries (
  id text primary key,
  event_id text not null,
  event_type text not null
    check (event_type in ('escrow_funding','settlement','payout','escrow_refund','adjustment')),
  account text not null,
  amount_poisha bigint not null,
  campaign_id text,
  profile_id uuid,
  submission_id text,
  payout_batch_id text,
  memo text,
  created_at timestamptz not null default now(),
  unique (event_id, account)   -- the idempotency key
);
create index ledger_entries_account_idx on public.ledger_entries (account);
create index ledger_entries_profile_idx on public.ledger_entries (profile_id);

-- ── payout batches ───────────────────────────────────────────
create table public.payout_batches (
  id text primary key,
  profile_id uuid not null references public.profiles(id),
  amount_poisha bigint not null check (amount_poisha > 0),
  bkash_number text not null,
  status text not null default 'queued'
    check (status in ('queued','blocked_nid','processing','paid','failed')),
  txn_ref text,
  paid_by uuid references public.profiles(id),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index payout_batches_profile_idx on public.payout_batches (profile_id);
create index payout_batches_status_idx on public.payout_batches (status);

-- ── fraud flags ──────────────────────────────────────────────
create table public.fraud_flags (
  id text primary key,
  submission_id text not null references public.submissions(id) on delete cascade,
  rule text not null check (rule in ('velocity','follower_ratio','duplicate_media','manual')),
  detail text not null default '{}',
  status text not null default 'open' check (status in ('open','released','upheld')),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index fraud_flags_status_idx on public.fraud_flags (status);

-- ── sweep overlap guard ──────────────────────────────────────
create table public.sweep_locks (
  key text primary key,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS — user-facing reads are scoped; ALL money/verification/vetting
-- writes go through the service-role client (bypasses RLS after the
-- server has authorised the caller). is_admin() from 0001 is reused.
-- ============================================================

alter table public.applications enable row level security;
alter table public.application_pages enable row level security;
alter table public.connected_accounts enable row level security;
alter table public.campaigns enable row level security;
alter table public.submissions enable row level security;
alter table public.view_snapshots enable row level security;
alter table public.xp_events enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.payout_batches enable row level security;
alter table public.fraud_flags enable row level security;
alter table public.sweep_locks enable row level security;  -- no policies: service-role only

-- applications: applicants see their own; they may create their own
create policy applications_select_own on public.applications
  for select using (profile_id = auth.uid() or public.is_admin());
create policy applications_insert_own on public.applications
  for insert with check (profile_id = auth.uid());

create policy application_pages_select_own on public.application_pages
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = application_id and (a.profile_id = auth.uid() or public.is_admin())
    )
  );
create policy application_pages_insert_own on public.application_pages
  for insert with check (
    exists (
      select 1 from public.applications a
      where a.id = application_id and a.profile_id = auth.uid()
    )
  );

-- connected accounts: owner reads SAFE columns via the view below; the raw
-- table is admin/service-role only (token ciphertext lives here).
create policy connected_accounts_admin_read on public.connected_accounts
  for select using (public.is_admin());

create or replace view public.my_connected_accounts
  with (security_invoker = off) as
  select id, profile_id, platform, application_page_id, external_id, handle,
         display_name, avatar_url, follower_count, proof, status, created_at
  from public.connected_accounts
  where profile_id = auth.uid();

-- campaigns: active/settling are public to signed-in users; brands see their own
create policy campaigns_select on public.campaigns
  for select using (
    status in ('active','settling','completed')
    or brand_profile_id = auth.uid()
    or public.is_admin()
  );

-- submissions: clippers their own; brands aggregate via campaign_public_stats
create policy submissions_select_own on public.submissions
  for select using (profile_id = auth.uid() or public.is_admin());

create policy view_snapshots_select_own on public.view_snapshots
  for select using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and (s.profile_id = auth.uid() or public.is_admin())
    )
  );

create policy xp_events_select_own on public.xp_events
  for select using (profile_id = auth.uid() or public.is_admin());

-- ledger: own clipper rows (by profile linkage); admins everything
create policy ledger_select_own on public.ledger_entries
  for select using (profile_id = auth.uid() or public.is_admin());

create policy payout_batches_select_own on public.payout_batches
  for select using (profile_id = auth.uid() or public.is_admin());

create policy fraud_flags_admin_read on public.fraud_flags
  for select using (public.is_admin());

-- brand-facing aggregates without exposing clipper rows
create or replace view public.campaign_public_stats
  with (security_invoker = off) as
  select
    s.campaign_id,
    count(*) filter (where s.status in ('tracking','held'))        as tracking_count,
    count(*) filter (where s.status = 'settled')                   as settled_count,
    coalesce(sum(s.counted_views), 0)                              as counted_views,
    coalesce(sum(s.locked_views) filter (where s.status='settled'), 0) as settled_views
  from public.submissions s
  group by s.campaign_id;

-- leaderboard: only safe columns of non-opted-out active earners
create or replace view public.leaderboard_public
  with (security_invoker = off) as
  select p.id as profile_id, p.display_name, p.tier,
         sum(s.locked_views)::bigint as settled_views
  from public.submissions s
  join public.profiles p on p.id = s.profile_id
  where s.status = 'settled'
    and coalesce(s.locked_views, 0) > 0
    and p.leaderboard_opt_out = false
    and p.account_status = 'active'
    and p.role in ('clipper','agency')
  group by p.id, p.display_name, p.tier;

-- ============================================================
-- settle_submission — the one money transaction, called by the sweep via
-- the service-role client. Locks the campaign row, computes payable views
-- (escrow clamp + per-clipper cap + qualification minimum), writes the
-- zero-sum ledger event, updates the submission, campaign spend, XP and
-- profile totals — atomically. Idempotent via the ledger unique key.
-- ============================================================
create or replace function public.settle_submission(
  p_submission_id text,
  p_locked_views integer,
  p_xp_views integer,          -- XP from views (computed by the app: views ÷ 100)
  p_xp_completion integer      -- completion bonus (0 when not eligible)
) returns table (payable_views integer, clipper_earn bigint, brand_cost bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.submissions%rowtype;
  v_cmp public.campaigns%rowtype;
  v_clipper_per_view integer;
  v_brand_per_view integer;
  v_remaining bigint;
  v_cap_remaining bigint;
  v_already_earned bigint;
  v_payable integer;
  v_earn bigint;
  v_cost bigint;
  v_xp integer;
begin
  select * into v_sub from public.submissions where id = p_submission_id for update;
  if not found then raise exception 'submission % not found', p_submission_id; end if;
  if v_sub.status = 'settled' then
    return query select 0, 0::bigint, 0::bigint; return;
  end if;

  select * into v_cmp from public.campaigns where id = v_sub.campaign_id for update;
  if not found then raise exception 'campaign % not found', v_sub.campaign_id; end if;

  v_clipper_per_view := v_cmp.rate_clipper_per_1k / 1000;
  v_brand_per_view := v_cmp.rate_brand_per_1k / 1000;
  v_remaining := greatest(v_cmp.budget_poisha - v_cmp.spent_poisha, 0);

  select coalesce(sum(earned_poisha), 0) into v_already_earned
  from public.submissions
  where campaign_id = v_cmp.id and profile_id = v_sub.profile_id and status = 'settled';
  v_cap_remaining := greatest(v_cmp.max_payout_per_clipper_poisha - v_already_earned, 0);

  if p_locked_views < v_cmp.min_qualify_views then
    v_payable := 0;
  else
    v_payable := least(
      p_locked_views,
      (v_remaining / v_brand_per_view)::integer,
      (v_cap_remaining / v_clipper_per_view)::integer
    );
    v_payable := greatest(v_payable, 0);
  end if;

  v_earn := v_payable::bigint * v_clipper_per_view;
  v_cost := v_payable::bigint * v_brand_per_view;
  v_xp := case when v_payable > 0 then p_xp_views + p_xp_completion else 0 end;

  if v_payable > 0 then
    insert into public.ledger_entries
      (id, event_id, event_type, account, amount_poisha, campaign_id, profile_id, submission_id)
    values
      ('led_' || substr(md5(random()::text), 1, 8) || substr(md5(random()::text), 1, 4),
       'settle:' || p_submission_id, 'settlement', 'escrow:' || v_cmp.id, -v_cost,
       v_cmp.id, v_sub.profile_id, p_submission_id),
      ('led_' || substr(md5(random()::text), 1, 8) || substr(md5(random()::text), 1, 4),
       'settle:' || p_submission_id, 'settlement', 'clipper:' || v_sub.profile_id, v_earn,
       v_cmp.id, v_sub.profile_id, p_submission_id),
      ('led_' || substr(md5(random()::text), 1, 8) || substr(md5(random()::text), 1, 4),
       'settle:' || p_submission_id, 'settlement', 'margin', v_cost - v_earn,
       v_cmp.id, v_sub.profile_id, p_submission_id)
    on conflict (event_id, account) do nothing;

    update public.campaigns
      set spent_poisha = spent_poisha + v_cost
      where id = v_cmp.id;
  end if;

  update public.submissions
    set status = 'settled',
        locked_views = p_locked_views,
        earned_poisha = v_earn,
        xp_awarded = v_xp,
        settled_at = now()
    where id = p_submission_id;

  if v_xp > 0 then
    if p_xp_views > 0 then
      insert into public.xp_events
        (id, profile_id, connected_account_id, submission_id, campaign_id, amount, reason)
      values ('xp_' || substr(md5(random()::text), 1, 10), v_sub.profile_id,
              v_sub.connected_account_id, p_submission_id, v_cmp.id, p_xp_views, 'views');
    end if;
    if p_xp_completion > 0 then
      insert into public.xp_events
        (id, profile_id, connected_account_id, submission_id, campaign_id, amount, reason)
      values ('xp_' || substr(md5(random()::text), 1, 10), v_sub.profile_id,
              v_sub.connected_account_id, p_submission_id, v_cmp.id, p_xp_completion, 'completion_bonus');
    end if;
    update public.profiles set xp_total = xp_total + v_xp where id = v_sub.profile_id;
  end if;

  return query select v_payable, v_earn, v_cost;
end;
$$;

revoke all on function public.settle_submission(text, integer, integer, integer) from public, anon, authenticated;
