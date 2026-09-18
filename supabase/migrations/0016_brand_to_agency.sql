-- 0016: rebrand — the client side is an "agency", not a "brand"
-- The role that funds campaigns was called 'brand'; it is now 'agency'. That
-- name was already taken by the old clipper-side agency role (one operator,
-- many pages), so that one moves to 'network' first. 'network' is DORMANT:
-- kept in data and code, hidden from every screen, nobody new can get it.
--
--   profiles.role        'agency' → 'network', then 'brand' → 'agency'
--   applications.role    'agency' → 'network'
--   waitlist_leads.role  'brand'  → 'agency'
--   campaigns            brand_* columns → agency_*
--
-- DEPLOY WITH THE CODE: the app reads the new role values and column names, so
-- run this in the same window as the release that ships the rename.
-- The `brand-logos` storage bucket keeps its id — existing logo URLs point at it.
-- Idempotent: every step checks the current state first, so a re-run is a no-op
-- (it can never flip the new 'agency' rows on to 'network').

begin;

-- ── profiles.role ───────────────────────────────────────────
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%''brand''%'
  ) then
    alter table public.profiles drop constraint if exists profiles_role_check;
    -- order matters: free the name before reusing it
    update public.profiles set role = 'network' where role = 'agency';
    update public.profiles set role = 'agency'  where role = 'brand';
    alter table public.profiles
      add constraint profiles_role_check check (role in ('clipper','agency','network','admin'));
  end if;
end $$;

-- ── applications.role (clipper-side only) ───────────────────
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.applications'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%''agency''%'
  ) then
    alter table public.applications drop constraint if exists applications_role_check;
    update public.applications set role = 'network' where role = 'agency';
    alter table public.applications
      add constraint applications_role_check check (role in ('clipper','network'));
  end if;
end $$;

-- ── waitlist_leads.role ─────────────────────────────────────
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.waitlist_leads'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%''brand''%'
  ) then
    alter table public.waitlist_leads drop constraint if exists waitlist_leads_role_check;
    update public.waitlist_leads set role = 'agency' where role = 'brand';
    alter table public.waitlist_leads
      add constraint waitlist_leads_role_check check (role in ('clipper','agency'));
  end if;
end $$;

-- ── campaigns: brand_* → agency_* ───────────────────────────
-- Renames carry through to the index, the FK, the campaigns_select policy and
-- the per-video check constraint on their own (they bind to the column, not
-- its name). Only plpgsql bodies hold the old names as text — see below.
do $$
declare
  pair text[];
begin
  foreach pair slice 1 in array array[
    ['brand_profile_id',       'agency_profile_id'],
    ['brand_name',             'agency_name'],
    ['rate_brand_per_1k',      'rate_agency_per_1k'],
    ['per_video_brand_poisha', 'per_video_agency_poisha']
  ] loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'campaigns' and column_name = pair[1]
    ) then
      execute format('alter table public.campaigns rename column %I to %I', pair[1], pair[2]);
    end if;
  end loop;
end $$;

alter index if exists public.campaigns_brand_idx rename to campaigns_agency_idx;

-- ── leaderboard: the dormant role keeps its place, under its new name ──
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
    and p.role in ('clipper','network')
  group by p.id, p.display_name, p.tier;

-- ── settle_submission: same logic as 0004, new column names ──
-- The return column is renamed (brand_cost → agency_cost), which `create or
-- replace` can't do, so drop first. Nothing else depends on it.
drop function if exists public.settle_submission(text, integer, integer, integer);

create function public.settle_submission(
  p_submission_id text,
  p_locked_views integer,
  p_xp_views integer,          -- XP from views (computed by the app: views ÷ 100)
  p_xp_completion integer      -- completion bonus (0 when not eligible)
) returns table (payable_views integer, clipper_earn bigint, agency_cost bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.submissions%rowtype;
  v_cmp public.campaigns%rowtype;
  v_clipper_per_view integer;
  v_agency_per_view integer;
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
  v_agency_per_view := v_cmp.rate_agency_per_1k / 1000;
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
      (v_remaining / v_agency_per_view)::integer,
      (v_cap_remaining / v_clipper_per_view)::integer
    );
    v_payable := greatest(v_payable, 0);
  end if;

  v_earn := v_payable::bigint * v_clipper_per_view;
  v_cost := v_payable::bigint * v_agency_per_view;
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

commit;
