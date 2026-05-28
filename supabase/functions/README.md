# Razorpay Edge Functions

Deploy once per Supabase project so the app can create orders and verify signatures.

## Secrets (Dashboard → Project Settings → Edge Functions, or CLI)

| Name | Value |
|------|--------|
| `RAZORPAY_KEY_ID` | `rzp_test_…` or `rzp_live_…` |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret (never ship in the Expo app) |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically in production.

## Deploy

```bash
npx supabase login
npx supabase link --project-ref kpizpbxhakwbxxoualxl
npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxx RAZORPAY_KEY_SECRET=your_secret
npx supabase functions deploy razorpay-create-order
npx supabase functions deploy razorpay-verify-payment
```

Restart Expo after setting `EXPO_PUBLIC_RAZORPAY_KEY_ID` in `.env`.
