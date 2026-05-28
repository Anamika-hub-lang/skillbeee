-- SkillBee — reference SQL for Supabase (run in SQL editor after `prisma db push`).
-- Tune policies to your threat model. The Node API can use a direct Postgres role that bypasses RLS;
-- these policies mainly protect Realtime + any future direct client queries.
--
-- IMPORTANT (Realtime not updating in the app):
-- 1) Tables must be in the `supabase_realtime` publication (below).
-- 2) In Dashboard → Database → Replication, enable these tables for "0 tables" → turn on.
-- 3) The Expo app calls `supabase.realtime.setAuth(access_token)` so Realtime uses the user JWT.
-- 4) If you use RLS on these tables, add SELECT policies for role `authenticated` or Realtime will
--    filter out all rows for the JWT. Example policies are commented below — adjust before uncommenting.

-- --- Realtime: add tables to the publication (names must match @@map) ---
-- If already added, Postgres may error — ignore or comment out lines you already ran.
alter publication supabase_realtime add table public.requirements;
alter publication supabase_realtime add table public.applications;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.notifications;

-- --- OPTIONAL: RLS examples (review before enabling — can block Prisma if your DB role is not bypass) ---
-- alter table public.requirements enable row level security;
-- create policy "requirements_select_authenticated" on public.requirements
--   for select to authenticated using (true);
--
-- alter table public.messages enable row level security;
-- create policy "messages_select_authenticated" on public.messages
--   for select to authenticated using (true);
--
-- alter table public.notifications enable row level security;
-- create policy "notifications_own" on public.notifications
--   for select to authenticated using ("userId" = auth.uid());

-- Optional: richer UPDATE payloads for Realtime
-- alter table public.messages replica identity full;

-- See: https://supabase.com/docs/guides/realtime/postgres-changes
-- See: https://supabase.com/docs/guides/realtime/authorization
