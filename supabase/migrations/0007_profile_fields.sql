-- 0007: onboarding profile fields
-- The 4-step onboarding writes name, username, location and the languages a
-- clipper posts in onto their profile. These already exist on the Profile type
-- and the local stub store; add the matching Supabase columns so the real
-- backend stops erroring when the profile / about steps save. Idempotent.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists username text,
  add column if not exists location text,
  add column if not exists post_languages text;

-- Usernames are unique, case-insensitive — a DB backstop to the app-level
-- check. Partial index so the many not-yet-set NULLs are allowed.
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username))
  where username is not null;
