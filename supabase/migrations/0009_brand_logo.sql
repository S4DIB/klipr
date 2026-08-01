-- 0009: brand logo storage
-- The brand onboarding uploads a company logo. Store the public URL on the
-- profile, and create a public-read storage bucket to hold the files. Uploads
-- go through the service-role client (bypasses storage RLS), so no insert
-- policy is needed; public=true makes the objects readable by their URL.
-- Idempotent.

alter table public.profiles
  add column if not exists logo_url text;

insert into storage.buckets (id, name, public)
values ('brand-logos', 'brand-logos', true)
on conflict (id) do nothing;
