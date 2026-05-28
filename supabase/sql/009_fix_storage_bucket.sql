-- Fix "Bucket not found" for profile photo + work sample uploads.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-samples',
  'application-samples',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "application-samples read public" on storage.objects;
create policy "application-samples read public"
  on storage.objects for select
  using (bucket_id = 'application-samples');

drop policy if exists "application-samples insert authenticated" on storage.objects;
create policy "application-samples insert authenticated"
  on storage.objects for insert
  with check (bucket_id = 'application-samples' and auth.role() = 'authenticated');

drop policy if exists "application-samples insert own paths" on storage.objects;
create policy "application-samples insert own paths"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'application-samples'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or name like ('profile-photos/' || auth.uid()::text || '/%')
    )
  );
