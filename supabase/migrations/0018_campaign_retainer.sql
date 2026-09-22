-- 0018: retainer payout model
-- A campaign can now hire clippers on a fixed fee: each clipper the agency
-- brings on earns retainer_clipper_poisha for delivering retainer_videos
-- accepted videos, paid in equal installments per video; the agency pays
-- retainer_agency_poisha per clipper (the same 5:6 margin as every other
-- model) and budget_poisha = retainer_slots × retainer_agency_poisha.
-- Retainers are invite-only — they never appear in the marketplace.
--
-- Every amount is snapshotted on the campaign like the per-1k rates, so a
-- pricing change never re-prices a live retainer. Existing rows are untouched.
-- Idempotent.

alter table public.campaigns
  add column if not exists retainer_clipper_poisha bigint,
  add column if not exists retainer_agency_poisha bigint,
  add column if not exists retainer_videos integer,
  add column if not exists retainer_slots integer;

do $$
begin
  -- widen the payout_model check to admit 'retainer'
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.campaigns'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%''retainer''%'
  ) then
    alter table public.campaigns drop constraint if exists campaigns_payout_model_check;
    alter table public.campaigns
      add constraint campaigns_payout_model_check
      check (payout_model in ('views', 'per_video', 'retainer'));
  end if;

  -- a retainer is meaningless without its fee, video count and slots
  if not exists (
    select 1 from pg_constraint where conname = 'campaigns_retainer_check'
  ) then
    alter table public.campaigns
      add constraint campaigns_retainer_check
      check (
        payout_model <> 'retainer'
        or (
          retainer_clipper_poisha > 0
          and retainer_agency_poisha >= retainer_clipper_poisha
          and retainer_videos > 0
          and retainer_slots > 0
        )
      );
  end if;
end $$;
