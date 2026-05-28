import type { AuthMePayload } from '@/hooks/useAuthMe';
import type { DashboardPayload } from '@/hooks/useDashboard';

import { supabase } from '@/lib/supabase';
import { throwOnPostgrestError } from '@/lib/supabase/queryHelpers';

export async function fetchAuthMe(userId: string): Promise<AuthMePayload> {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, emailVerifiedAt, createdAt, updatedAt, profiles(*)')
    .eq('id', userId)
    .maybeSingle();
  throwOnPostgrestError(error);
  if (!user) throw new Error('User not provisioned — sign out and sign in again.');

  const u = user as {
    id: string;
    email: string;
    role: string;
    emailVerifiedAt: string | null;
    createdAt: string;
    updatedAt: string;
    profiles: unknown;
  };
  const profRaw = u.profiles;
  const profCell = Array.isArray(profRaw) ? profRaw[0] : profRaw;
  const p = profCell as {
    displayName: string | null;
    photoUrl: string | null;
    skills: string[] | null;
    hourlyRate: number | null;
    availabilityNote: string | null;
    availableNow: boolean | null;
    portfolioUrl: string | null;
    bio: string | null;
  } | null;

  return {
    id: u.id,
    email: u.email,
    role: u.role === 'client' ? 'client' : 'student',
    emailVerifiedAt: u.emailVerifiedAt,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    profile: p
      ? {
          displayName: p.displayName,
          photoUrl: p.photoUrl,
          skills: p.skills ?? [],
          hourlyRate: p.hourlyRate ?? 0,
          availabilityNote: p.availabilityNote,
          availableNow: p.availableNow ?? false,
          portfolioUrl: p.portfolioUrl,
          bio: p.bio,
        }
      : null,
  };
}

export async function updateUserProfile(
  userId: string,
  patch: Partial<{
    displayName: string | null;
    photoUrl: string | null;
    skills: string[];
    hourlyRate: number;
    availabilityNote: string | null;
    availableNow: boolean;
    portfolioUrl: string | null;
    bio: string | null;
  }>,
): Promise<void> {
  const { error } = await supabase.rpc('save_my_profile', {
    p_display_name: patch.displayName ?? null,
    p_photo_url: patch.photoUrl ?? null,
    p_skills: patch.skills ?? null,
    p_hourly_rate: patch.hourlyRate ?? null,
    p_availability_note: patch.availabilityNote ?? null,
    p_available_now: patch.availableNow ?? null,
    p_portfolio_url: patch.portfolioUrl ?? null,
    p_bio: patch.bio ?? null,
  });
  throwOnPostgrestError(error);

  if (patch.displayName?.trim()) {
    const { data, error: readErr } = await supabase
      .from('profiles')
      .select('displayName, setupComplete')
      .eq('userId', userId)
      .maybeSingle();
    throwOnPostgrestError(readErr);
    const row = data as { displayName?: string | null; setupComplete?: boolean } | null;
    const savedName = row?.displayName?.trim();
    if (savedName !== patch.displayName.trim()) {
      throw new Error('Profile could not be saved. Please try again.');
    }
  }
}

export async function setUserRole(userId: string, role: 'client' | 'student'): Promise<void> {
  const { error } = await supabase.from('users').update({ role, updatedAt: new Date().toISOString() }).eq('id', userId);
  throwOnPostgrestError(error);
}

export async function fetchDashboard(userId: string, role: 'client' | 'student'): Promise<DashboardPayload> {
  if (role === 'client') {
    const [openRes, matchedRes, payRes, actRes, sumRes] = await Promise.all([
      supabase
        .from('requirements')
        .select('id', { count: 'exact', head: true })
        .eq('clientId', userId)
        .eq('status', 'open'),
      supabase
        .from('requirements')
        .select('id', { count: 'exact', head: true })
        .eq('clientId', userId)
        .in('status', ['matched', 'in_progress']),
      supabase
        .from('payments')
        .select('*')
        .eq('payerId', userId)
        .order('createdAt', { ascending: false })
        .limit(20),
      supabase
        .from('activity_logs')
        .select('*')
        .eq('actorUserId', userId)
        .order('createdAt', { ascending: false })
        .limit(30),
      supabase.from('payments').select('amountMinor').eq('payerId', userId).eq('status', 'captured'),
    ]);
    throwOnPostgrestError(openRes.error);
    throwOnPostgrestError(matchedRes.error);
    throwOnPostgrestError(payRes.error);
    throwOnPostgrestError(actRes.error);
    throwOnPostgrestError(sumRes.error);
    const openReqs = openRes.count;
    const matched = matchedRes.count;
    const payments = payRes.data;
    const activity = actRes.data;
    const sumResData = sumRes;
    let totalSpendMinor = 0;
    for (const row of sumResData.data ?? []) {
      totalSpendMinor += (row as { amountMinor: number }).amountMinor ?? 0;
    }
    return {
      role: 'client',
      counts: { openRequirements: openReqs ?? 0, activeMatches: matched ?? 0 },
      payments: payments ?? [],
      activity: activity ?? [],
      totalSpendMinor,
    };
  }

  const [pendingRes, acceptedRes, creditsRes, appRowsRes] = await Promise.all([
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('studentId', userId).eq('status', 'pending'),
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('studentId', userId).eq('status', 'accepted'),
    supabase.from('transactions').select('amountMinor').eq('userId', userId).eq('kind', 'credit'),
    supabase.from('applications').select('requirementId').eq('studentId', userId),
  ]);
  throwOnPostgrestError(pendingRes.error);
  throwOnPostgrestError(acceptedRes.error);
  throwOnPostgrestError(creditsRes.error);
  throwOnPostgrestError(appRowsRes.error);
  const pending = pendingRes.count;
  const accepted = acceptedRes.count;
  const credits = creditsRes.data;
  const appRows = appRowsRes.data;
  let earningsMinor = 0;
  for (const row of credits ?? []) {
    earningsMinor += (row as { amountMinor: number }).amountMinor ?? 0;
  }
  const activeThreads = new Set((appRows ?? []).map((r) => (r as { requirementId: string }).requirementId)).size;
  return {
    role: 'student',
    applicationsByStatus: { pending: pending ?? 0, accepted: accepted ?? 0 },
    earningsMinor,
    activeThreads,
  };
}
