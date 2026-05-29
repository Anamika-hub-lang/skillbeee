import { fetchAuthMe } from '@/lib/data/profileAndDashboard';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/stores/session';
import type { UserRole } from '@/types';

export type AccountProgress = {
  role: UserRole | null;
  profileComplete: boolean;
};

function profileIsComplete(
  role: UserRole,
  profile: {
    displayName: string | null;
    skills?: string[];
    bio?: string | null;
    setupComplete?: boolean;
  } | null,
): boolean {
  if (!profile) return false;
  if (profile.setupComplete) return true;
  if (profile.displayName?.trim()) return true;
  if (role === 'student' && (profile.skills?.length ?? 0) > 0) return true;
  if (role === 'client' && profile.bio?.trim()) return true;
  return false;
}

async function loadProfileProgress(userId: string, role: UserRole): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('displayName, skills, bio, setupComplete')
    .eq('userId', userId)
    .maybeSingle();
  if (error) return false;
  return profileIsComplete(role, data as {
    displayName: string | null;
    skills?: string[];
    bio?: string | null;
    setupComplete?: boolean;
  } | null);
}

/** Load role + profile completion from Supabase (source of truth after login). */
export async function syncAccountProgressFromServer(): Promise<AccountProgress> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    return { role: null, profileComplete: false };
  }

  const store = useSessionStore.getState();
  const userId = session.user.id;

  if (store.accountUserId && store.accountUserId !== userId) {
    useSessionStore.setState({
      accountUserId: userId,
      role: null,
      studentProfileComplete: false,
      clientProfileComplete: false,
    });
  } else {
    store.setAccountUserId(userId);
  }

  const latest = useSessionStore.getState();

  const { data: roleRaw, error: roleErr } = await supabase.rpc('get_my_role');
  let role =
    !roleErr && (roleRaw === 'client' || roleRaw === 'student') ? (roleRaw as UserRole) : null;

  if (!role && (latest.role === 'client' || latest.role === 'student')) {
    role = latest.role;
  }

  let profileComplete = false;
  if (role) {
    try {
      const me = await fetchAuthMe(userId);
      if (me.role === 'client' || me.role === 'student') {
        role = me.role;
      }
      profileComplete = profileIsComplete(role, me.profile);
      if (!profileComplete) {
        profileComplete = await loadProfileProgress(userId, role);
      }
    } catch {
      profileComplete = await loadProfileProgress(userId, role);
      if (!profileComplete) {
        profileComplete =
          role === 'client' ? latest.clientProfileComplete : latest.studentProfileComplete;
      }
    }
  }

  if (role) {
    latest.setRole(role);
    if (role === 'client') {
      if (profileComplete) latest.completeClientSetup();
    } else if (profileComplete) {
      latest.completeStudentSetup();
    }
  }

  return { role, profileComplete };
}

export function profileCompleteForAccount(
  role: UserRole | null,
  syncedComplete: boolean,
  userId: string | null,
): boolean {
  const store = useSessionStore.getState();
  const sameAccount = Boolean(userId && store.accountUserId === userId);
  return (
    syncedComplete ||
    (sameAccount &&
      ((role === 'client' && store.clientProfileComplete) ||
        (role === 'student' && store.studentProfileComplete)))
  );
}

export function homeRouteForAccount(role: UserRole | null, profileComplete: boolean): string {
  if (!role) return '/role';
  if (role === 'client') {
    return profileComplete ? '/(tabs)/client-home' : '/client-setup';
  }
  return profileComplete ? '/(tabs)/discover' : '/student-setup';
}
