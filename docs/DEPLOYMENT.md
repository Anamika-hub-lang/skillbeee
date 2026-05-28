# Deploy SkillBee (Expo + Supabase only)

The mobile app talks **directly** to **Supabase** (Postgres + Auth + Storage + Realtime). There is **no** bundled Node/Express server in this repo.

## 1. Database & security

1. `npm run db:push` (or migrations) against your Supabase Postgres URL.
2. Run storage bucket SQL: `supabase/sql/001_storage_buckets.sql` and `003_application_samples_bucket.sql` if needed.
3. Run **`supabase/sql/004_client_supabase_only.sql`** once in the Supabase SQL editor — enables RLS, auth → `public.users` trigger, `accept_application` / `mark_thread_read` RPCs, and notification triggers.

## 2. Expo / EAS

- Set **`EXPO_PUBLIC_SUPABASE_URL`** and **`EXPO_PUBLIC_SUPABASE_ANON_KEY`** for your EAS build environment (Expo dashboard or `eas.json` env).
- No `EXPO_PUBLIC_API_URL` is required.

## 3. Payments (Razorpay)

1. **Expo env** (EAS / `.env`): `EXPO_PUBLIC_RAZORPAY_KEY_ID` (test: `rzp_test_…`, live: `rzp_live_…`).
2. **Supabase Edge Function secrets** (never in the mobile bundle):
   - `RAZORPAY_KEY_ID` — same as the public key id
   - `RAZORPAY_KEY_SECRET` — from Razorpay Dashboard → API Keys
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected automatically when deployed.
3. Deploy functions from this repo:
   ```bash
   supabase link --project-ref YOUR_REF
   supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxx RAZORPAY_KEY_SECRET=your_secret
   supabase functions deploy razorpay-create-order
   supabase functions deploy razorpay-verify-payment
   ```
4. Restart Expo after changing `EXPO_PUBLIC_*` vars. Checkout lives under **Earn → Quick pay** and **Payment → Checkout**.

Order creation and signature verification run in Edge Functions; the app opens Razorpay Checkout in a WebView and then calls `razorpay-verify-payment`.
