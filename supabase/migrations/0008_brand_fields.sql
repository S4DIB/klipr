-- 0008: brand onboarding fields
-- The 3-step brand onboarding (business profile → company details → finish
-- setup) collects a website, industry, estimated monthly spend and past
-- clipping-campaign experience onto the profile. Business name reuses org_name,
-- location reuses location, name reuses first/last_name. Idempotent.

alter table public.profiles
  add column if not exists website text,
  add column if not exists industry text,
  add column if not exists monthly_spend text,
  add column if not exists campaign_experience text;
