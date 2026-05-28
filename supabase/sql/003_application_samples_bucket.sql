-- Run once in Supabase → SQL Editor if you already applied an older `001_storage_buckets.sql`
-- that did NOT include `application-samples` (fixes API error: Bucket not found).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-samples',
  'application-samples',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[]
)
on conflict (id) do nothing;

drop policy if exists "application-samples read public" on storage.objects;
create policy "application-samples read public"
  on storage.objects for select
  using (bucket_id = 'application-samples');

drop policy if exists "application-samples insert authenticated" on storage.objects;
create policy "application-samples insert authenticated"
  on storage.objects for insert
  with check (bucket_id = 'application-samples' and auth.role() = 'authenticated');
