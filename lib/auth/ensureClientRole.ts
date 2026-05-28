import { supabase } from '@/lib/supabase';

/** Ensures client account + role before posting requirements. */
export async function ensureClientRole(_userId: string): Promise<void> {
  const { error: syncErr } = await supabase.rpc('ensure_user_role', {
    p_role: 'client',
    p_force: true,
  });
  if (syncErr) {
    throw new Error(syncErr.message);
  }

  const { data: role, error: roleErr } = await supabase.rpc('get_my_role');
  if (roleErr) {
    throw new Error(roleErr.message);
  }
  if (role !== 'client') {
    throw new Error('This email is registered as a student account. Clients can post tasks.');
  }
}
