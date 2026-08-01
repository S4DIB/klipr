-- In-app notifications.
-- A notice belongs to a recipient profile and outlives whatever it's about
-- (e.g. a campaign an admin deleted), so it carries denormalized text, not a
-- foreign key to the source row.

create table if not exists public.notifications (
  id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'general'
    check (kind in ('campaign_deleted', 'general')),
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_profile_idx
  on public.notifications (profile_id, created_at desc);

create index if not exists notifications_unread_idx
  on public.notifications (profile_id)
  where read_at is null;

-- ── Row Level Security ──────────────────────────────────
-- The server reads/writes via the service-role key (bypasses RLS). These
-- policies just keep the public anon/authenticated key from seeing anyone
-- else's notices, matching every other table in this schema.
alter table public.notifications enable row level security;

create policy "notifications_self_read" on public.notifications
  for select using (profile_id = auth.uid() or public.is_admin());
create policy "notifications_admin_write" on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());
