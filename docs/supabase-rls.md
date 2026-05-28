# Supabase RLS for SkillBee

## Where to run SQL

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor** (left sidebar).
3. Click **New query**.
4. Paste the contents of `supabase/sql/004_client_supabase_only.sql` if you have not already (creates triggers, RPCs, enables RLS, baseline policies).
5. Paste **`supabase/sql/005_rls_secure_policies.sql`** and click **Run**.

Repeat step 5 whenever you update that migration file (it is written to be re-runnable: `DROP POLICY IF EXISTS` before each `CREATE POLICY`).

## What `auth.uid()` is

For requests using the **anon** or **authenticated** key with a user JWT, `auth.uid()` is the UUID in the JWT’s `sub` claim — the same value as `auth.users.id` and your `public.users.id`.

Policies in `005_rls_secure_policies.sql` target **`to authenticated`** so only signed-in users are affected. Adjust if you need `anon` access (not recommended for these tables).

## Why some rows are not “self only”

The Expo app loads **other users’** `users` + `profiles` rows for:

- Clients on **open** requirements (discover feed).
- **Applicants** (client sees students who applied).
- **Thread peers** (chat / inbox).

So `users` / `profiles` **SELECT** policies allow those cases in addition to `id = auth.uid()` / `"userId" = auth.uid()`. If you need stricter privacy (e.g. hide `email` from peers), use a **SQL view** that exposes only `id`, `displayName`, `photoUrl` and point the app at that view instead of full `users`.

## Storage

Object policies for the `application-samples` bucket remain in `004_client_supabase_only.sql` / `001_storage_buckets.sql`. RLS on `storage.objects` is separate from table RLS.

## Server-side writes

`SECURITY DEFINER` functions (`accept_application`, `mark_thread_read`) and **SECURITY DEFINER** trigger functions run with elevated rights and **bypass RLS** on the tables they touch, so they still work when direct `INSERT`/`UPDATE` from the client is denied.
