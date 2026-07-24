-- Waitlist lead review state. The landing waitlist feeds the vetting console
-- (/admin/applications): admins approve or decline each clipper lead before
-- the person signs up. Approved leads become approved Applications on first
-- sign-in (see lib/auth/preapproval.ts).
alter table public.waitlist_leads
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined')),
  add column if not exists decline_reason text,
  add column if not exists reviewed_at timestamptz;
