-- ============================================================
-- Patch: application photo uploads
-- 1) adds image_url to applications
-- 2) creates the public "application-photos" storage bucket
-- 3) adds storage policies (traders upload into their own folder)
-- 4) attaches a relevant photo to each pending application
-- Run ONCE in: Supabase Dashboard -> SQL Editor -> New query
-- Safe to re-run (idempotent).
-- ============================================================

alter table public.applications add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('application-photos', 'application-photos', true)
on conflict (id) do nothing;

drop policy if exists "public read application photos" on storage.objects;
create policy "public read application photos"
on storage.objects for select to public
using (bucket_id = 'application-photos');

drop policy if exists "trader uploads own application photo" on storage.objects;
create policy "trader uploads own application photo"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'application-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "trader updates own application photos" on storage.objects;
create policy "trader updates own application photos"
on storage.objects for update to authenticated
using (bucket_id = 'application-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "trader deletes own application photos" on storage.objects;
create policy "trader deletes own application photos"
on storage.objects for delete to authenticated
using (bucket_id = 'application-photos' and (storage.foldername(name))[1] = auth.uid()::text);
update public.applications set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Small_Honey_Jar_with_Honeycomb.jpg/1280px-Small_Honey_Jar_with_Honeycomb.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'
where business_name = 'Loch Lomond Honey Farm' and status = 'pending';

update public.applications set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/85/Chocolate_with_churros.jpg/1280px-Chocolate_with_churros.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'
where business_name = 'Churros del Sol' and status = 'pending';

update public.applications set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/Leather_handmade_bags.JPG/1280px-Leather_handmade_bags.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'
where business_name = 'Argyll Leathercraft' and status = 'pending';

update public.applications set image_url = 'https://upload.wikimedia.org/wikipedia/commons/b/be/Handmade_Jewelries.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled'
where business_name = 'Silver & Selkie Jewellery' and status = 'pending';

update public.applications set image_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ce/Prosecco_di_Conegliano_bottle_and_glass.jpg/1280px-Prosecco_di_Conegliano_bottle_and_glass.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail'
where business_name = 'Prosecco & Frost Bar' and status = 'pending';

update public.applications set image_url = 'https://upload.wikimedia.org/wikipedia/commons/6/64/Kiptopeke_Interior_Yurt_%286076155267%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled'
where business_name = 'Storytelling Yurt' and status = 'pending';

