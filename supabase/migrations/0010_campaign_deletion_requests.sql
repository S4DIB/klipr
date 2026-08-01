-- Campaign deletion requests.
-- Brands can't delete their own campaigns directly; they raise a request that
-- an admin approves. This column records the pending request (null = none).
-- Admins delete unconditionally, so no request is needed on their side.

alter table public.campaigns
  add column if not exists deletion_requested_at timestamptz;

create index if not exists campaigns_deletion_requested_idx
  on public.campaigns (deletion_requested_at)
  where deletion_requested_at is not null;
