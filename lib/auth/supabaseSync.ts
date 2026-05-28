import type { UserRole } from '@/types';

import { setUserRole, fetchAuthMe } from '@/lib/data/profileAndDashboard';
import { supabase } from '@/lib/supabase';

/**
 * Ensure `public.users` + `profiles` exist (auth trigger may have run; this covers edge cases + role hint).
 */
export async function syncBackendUser(roleHint?: UserRole): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user?.email) {
    throw new Error('Sign in required.');
  }

  const email = user.email;

  const { data: existing } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  const existingRole = (existing as { role?: string } | null)?.role;
  const role =
    roleHint ?? (existingRole === 'client' || existingRole === 'student' ? existingRole : 'student');

  const { error: rpcErr } = await supabase.rpc('ensure_user_role', {
    p_role: roleHint ?? role,
    p_force: Boolean(roleHint),
  });
  if (rpcErr) {
    throw new Error(rpcErr.message);
  }
}

export async function syncBackendRole(role: UserRole): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await setUserRole(user.id, role);
}

/** After sign-in, optional helper for callers that need a fresh row. */
export async function loadAuthMeForSession(userId: string) {
  return fetchAuthMe(userId);
}
