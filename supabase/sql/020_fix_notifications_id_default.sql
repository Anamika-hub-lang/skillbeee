-- Fix NOT NULL violation on notifications.id for trigger-based inserts.
-- Run once in Supabase SQL Editor when error appears:
--   null value in column "id" of relation "notifications" violates not-null constraint

alter table public.notifications
  alter column id set default gen_random_uuid();

alter table public.notifications
  alter column "createdAt" set default now();

notify pgrst, 'reload schema';
