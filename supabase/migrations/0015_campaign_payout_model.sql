-- 0015: per-video payout model
-- Campaigns can now pay either per 1,000 verified views (the original model)
-- or a flat amount per accepted video that clears min_qualify_views. The flat
-- amounts are snapshotted per campaign, exactly like the per-1k rates, so
-- changing platform pricing never re-prices a live campaign.
-- Existing rows default to 'views', which is what they have always been.
-- Idempotent.

alter table public.campaigns
  add column if not exists payout_model text not null default 'views',
  add column if not exists per_video_clipper_poisha bigint,
  add column if not exists per_video_brand_poisha bigint;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'campaigns_payout_model_check'
  ) then
    alter table public.campaigns
      add constraint campaigns_payout_model_check
      check (payout_model in ('views', 'per_video'));
  end if;

  -- a per-video campaign is meaningless without its amounts
  if not exists (
    select 1 from pg_constraint where conname = 'campaigns_per_video_amounts_check'
  ) then
    alter table public.campaigns
      add constraint campaigns_per_video_amounts_check
      check (
        payout_model <> 'per_video'
        or (per_video_clipper_poisha > 0 and per_video_brand_poisha >= per_video_clipper_poisha)
      );
  end if;
end $$;
