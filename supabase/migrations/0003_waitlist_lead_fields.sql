-- Klipr — extra waitlist-lead fields (Landing Page v2 forms, spec §8).
-- Run in the Supabase SQL editor AFTER 0002. Additive + idempotent: safe to
-- re-run, and existing rows are untouched.
--
-- Clipper "pages" (paste-a-link + niche) keep living in the existing `handles`
-- jsonb column, so only the scalar brand/frequency fields are added here.

alter table public.waitlist_leads
  add column if not exists company        text,   -- brand
  add column if not exists designation    text,   -- brand
  add column if not exists post_frequency text;   -- clipper
