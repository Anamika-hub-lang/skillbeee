-- Run in Supabase SQL Editor (Dashboard → SQL) after `prisma db push` created tables.
-- Creates Storage buckets used by SkillBee (avatars, gig art, work samples, chat files, voice).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'gig-images',
    'gig-images',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'application-samples',
    'application-samples',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[]
  ),
  (
    'chat-attachments',
    'chat-attachments',
    false,
    52428800,
    null
  ),
  (
    'voice',
    'voice',
    false,
    10485760,
    array['audio/m4a', 'audio/mpeg', 'audio/webm']::text[]
  )
on conflict (id) do nothing;

-- Optional: allow authenticated users to upload their own avatar.
-- Tighten paths (`(storage.foldername(name))[1]`) once you standardize object keys.

create policy "avatars read public"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars insert own"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "avatars update own"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "gig-images read public"
  on storage.objects for select
  using (bucket_id = 'gig-images');

create policy "gig-images insert authenticated"
  on storage.objects for insert
  with check (bucket_id = 'gig-images' and auth.role() = 'authenticated');

create policy "application-samples read public"
  on storage.objects for select
  using (bucket_id = 'application-samples');

create policy "application-samples insert authenticated"
  on storage.objects for insert
  with check (bucket_id = 'application-samples' and auth.role() = 'authenticated');

create policy "chat-attachments read authenticated"
  on storage.objects for select
  using (bucket_id = 'chat-attachments' and auth.role() = 'authenticated');

create policy "chat-attachments insert authenticated"
  on storage.objects for insert
  with check (bucket_id = 'chat-attachments' and auth.role() = 'authenticated');

create policy "voice read authenticated"
  on storage.objects for select
  using (bucket_id = 'voice' and auth.role() = 'authenticated');

create policy "voice insert authenticated"
  on storage.objects for insert
  with check (bucket_id = 'voice' and auth.role() = 'authenticated');
