-- 0013: profile cover picture
-- Clippers can replace the default gradient band on the /home profile header
-- with their own cover photo. Store the public URL on the profile, and create
-- a public-read storage bucket to hold the files. Uploads go through the
-- service-role client (bypasses storage RLS), so no insert policy is needed;
-- public=true makes the objects readable by their URL.
-- Idempotent.

alter table public.profiles
  add column if not exists cover_url text;

insert into storage.buckets (id, name, public)
values ('profile-covers', 'profile-covers', true)
on conflict (id) do nothing;
