# SkillBee database (Prisma + Supabase)

The Expo app talks to **Supabase** with `@supabase/supabase-js` (`lib/supabase.ts`).  
**Prisma** manages the **Postgres schema** (same database Supabase hosts): models, `db push` / migrations, and seeds. Prisma Client runs in **Node** (your laptop, CI, or a small API) — **not** inside the React Native bundle.

## 1. Environment variables

Copy `.env.example` → `.env` and fill:

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (Expo app) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (Expo app) |
| `DATABASE_URL` | Postgres connection string (often **pooler**, port `6543`, `?pgbouncer=true`) |
| `DIRECT_URL` | **Direct** Postgres (port `5432`) — used by Prisma for migrations / introspection |

Get strings from Supabase: **Project Settings → Database**.

> If you previously committed real keys/passwords, **rotate** them in the Supabase dashboard.

## 2. Install dev tools

```bash
npm install
```

## 3. Push schema to Supabase Postgres

```bash
npm run db:generate
npm run db:push
```

`db push` syncs `prisma/schema.prisma` to the remote database (good for early development).

For versioned migrations later:

```bash
npm run db:migrate
```

## 4. Seed sample rows

```bash
npm run db:seed
```

Creates two `Profile` rows (fixed UUIDs) and the same gigs/notifications as `data/dummy.ts` (for API wiring tests).

## 5. Storage buckets (Supabase Dashboard)

Prisma **does not** create Storage buckets. After the database exists:

1. Open **Supabase → SQL → New query**.
2. Paste `supabase/sql/001_storage_buckets.sql` and run **once**.
3. If policies already exist, edit or drop conflicting names before re-running.

Buckets:

| Bucket | Use |
|--------|-----|
| `avatars` | Profile photos (public read) |
| `gig-images` | Gig cover images (public read) |
| `application-samples` | Student work samples + profile photos uploaded via the API (public read) |
| `chat-attachments` | Files in chat (private) |
| `voice` | Voice notes (private) |

If apply / uploads return **Bucket not found**, run `supabase/sql/003_application_samples_bucket.sql` once (or use the updated `001` on a fresh project).

**Client-only app:** after that, run **`supabase/sql/004_client_supabase_only.sql`** so Row Level Security, RPCs (`accept_application`, `mark_thread_read`), and auth/notification triggers match the Expo code.

Optional: `supabase/sql/002_public_rls_template.sql` — commented reminders for **RLS** on public tables when you use PostgREST from clients.

## 6. Link `auth.users` → `Profile`

`Profile.id` is a UUID meant to match `auth.users.id` after you add Supabase Auth. Until then, seed UUIDs are placeholders.

## Scripts (package.json)

| Script | Command |
|--------|---------|
| `db:generate` | `prisma generate` |
| `db:push` | `prisma db push` |
| `db:migrate` | `prisma migrate dev` |
| `db:studio` | `prisma studio` |
| `db:seed` | `prisma db seed` |
