import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * Pushes the current Supabase session JWT into the Realtime client.
 * Required for `postgres_changes` when tables use RLS — without this, subscriptions connect as anon only.
 *
 * @see https://supabase.com/docs/guides/realtime/postgres-changes#listening-to-postgres-changes-with-rls
 */
export async function syncRealtimeAuth(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? null;
    await supabase.realtime.setAuth(token);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[SkillBee] syncRealtimeAuth failed', e);
  }
}
