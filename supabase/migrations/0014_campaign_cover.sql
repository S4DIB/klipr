-- 0014: campaign cover media (picture or video)
-- campaigns.cover_url already exists (0004); this adds the public-read bucket
-- that holds the files. Brands upload a still or a short clip in the campaign
-- wizard, and it becomes the card/detail cover clippers see. Uploads go through
-- the service-role client (bypasses storage RLS), so no insert policy is
-- needed; public=true makes the objects readable by their URL.
-- Idempotent.

insert into storage.buckets (id, name, public)
values ('campaign-covers', 'campaign-covers', true)
on conflict (id) do nothing;
