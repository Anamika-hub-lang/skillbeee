-- Add work-sample URLs to applications (student apply flow).
-- Prisma schema already defines sampleUrls String[] @default([]).

alter table public.applications
  add column if not exists "sampleUrls" text[] not null default '{}'::text[];

comment on column public.applications."sampleUrls" is
  'Public URLs of work samples shown to the client when reviewing applicants.';

-- Ask PostgREST to refresh schema cache (Supabase).
notify pgrst, 'reload schema';
