# Supabase SQL helpers

| File | When to run |
|------|-------------|
| `001_storage_buckets.sql` | After `npm run db:push` — creates Storage buckets + basic object policies. Run **once**; fix duplicate-policy errors by dropping old policies first. |
| `002_public_rls_template.sql` | Reference only — uncomment/edit when you enable RLS on app tables. |
| `003_application_samples_bucket.sql` | If apply/uploads fail with **Bucket not found** and you ran `001` before `application-samples` existed — run **once** to add that bucket + policies. |
| `004_client_supabase_only.sql` | **Required for the Expo app:** RLS, auth→`public.users` trigger, `accept_application` / `mark_thread_read` RPCs, notification triggers. Run once after `001`/`003`. |
| `013_add_application_sample_urls.sql` | Adds `sampleUrls` column on `applications`. |
| `014_submit_application_rpc.sql` | Student apply RPC (`submit_student_application`). |
| `017_application_samples_documents.sql` | Allows PDF/docs in `application-samples` bucket. |
| `018_application_status_notifications.sql` | Notifies students when accepted/rejected. |
| `019_accept_application_rpc.sql` | **Fix Accept button:** creates `accept_application` RPC if missing from schema cache. |
| `020_fix_notifications_id_default.sql` | **Fix notifications insert error:** sets `notifications.id` default to `gen_random_uuid()`. |
| `021_fix_notifications_trigger_id.sql` | **Hard fix:** notification triggers now insert explicit `id` values + ensure defaults. |

See `docs/DATABASE.md` for the full flow.
