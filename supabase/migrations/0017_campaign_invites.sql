-- 0017: clipper directory + campaign invites
-- Agencies can browse every active clipper (/agency/clippers) and invite one
-- to a live campaign. There is no "join" step in the model — a clipper takes
-- part by submitting a clip — so an invite is a nudge, not a handshake: it
-- lands as a notification linking to the campaign, and "accepted" simply
-- means a submission from that clipper exists on that campaign.
--
-- The directory itself needs no schema: it reads profiles/submissions through
-- the service-role client (like leaderboard()) and the app whitelists the
-- public fields. What's here is the invite record and the notification link.
--
-- DEPLOY WITH THE CODE: the invite action writes kind='campaign_invite' and
-- notifications.href, both added below.
-- Idempotent.

-- ── campaign_invites ────────────────────────────────────────
create table if not exists public.campaign_invites (
  id text primary key,
  campaign_id text not null references public.campaigns(id) on delete cascade,
  -- denormalised sender so the per-agency daily rate limit is one indexed count
  agency_profile_id uuid not null references public.profiles(id) on delete cascade,
  clipper_profile_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  created_at timestamptz not null default now(),
  -- one invite per clipper per campaign; a re-invite is a no-op in the app
  unique (campaign_id, clipper_profile_id)
);

create index if not exists campaign_invites_agency_created_idx
  on public.campaign_invites (agency_profile_id, created_at desc);
create index if not exists campaign_invites_clipper_idx
  on public.campaign_invites (clipper_profile_id, created_at desc);
create index if not exists campaign_invites_campaign_idx
  on public.campaign_invites (campaign_id);

-- ── RLS ─────────────────────────────────────────────────────
-- The server reads/writes through the service-role key. These policies keep
-- the public anon/authenticated key to "your own side of the invite".
alter table public.campaign_invites enable row level security;

drop policy if exists campaign_invites_select_own on public.campaign_invites;
create policy campaign_invites_select_own on public.campaign_invites
  for select using (
    clipper_profile_id = auth.uid()
    or agency_profile_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists campaign_invites_admin_write on public.campaign_invites;
create policy campaign_invites_admin_write on public.campaign_invites
  for all using (public.is_admin()) with check (public.is_admin());

-- ── notifications: a kind for invites + an optional deep link ──
alter table public.notifications
  add column if not exists href text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.notifications'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%''campaign_invite''%'
  ) then
    alter table public.notifications drop constraint if exists notifications_kind_check;
    alter table public.notifications
      add constraint notifications_kind_check
      check (kind in ('campaign_deleted', 'campaign_invite', 'general'));
  end if;
end $$;
