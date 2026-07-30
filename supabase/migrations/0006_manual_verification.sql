-- 0006 — Manual verification
-- With no platform API, an admin approves account ownership and enters each
-- clip's verified view count. Connected accounts gain a "pending" status and a
-- "manual" proof, plus an audit of who verified them and when.

alter table public.connected_accounts
  drop constraint if exists connected_accounts_proof_check;
alter table public.connected_accounts
  add constraint connected_accounts_proof_check
  check (proof in ('oauth', 'simulated', 'manual'));

alter table public.connected_accounts
  drop constraint if exists connected_accounts_status_check;
alter table public.connected_accounts
  add constraint connected_accounts_status_check
  check (status in ('pending', 'active', 'revoked'));

alter table public.connected_accounts
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by text;
