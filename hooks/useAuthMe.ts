import { useQuery } from '@tanstack/react-query';

import { fetchAuthMe } from '@/lib/data/profileAndDashboard';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';

export type AuthMePayload = {
  id: string;
  email: string;
  role: 'client' | 'student';
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile: {
    displayName: string | null;
    photoUrl: string | null;
    skills: string[];
    hourlyRate: number;
    availabilityNote: string | null;
    availableNow: boolean;
    portfolioUrl: string | null;
    bio: string | null;
  } | null;
};

export function useAuthMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.authMe,
    queryFn: async (): Promise<AuthMePayload | null> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;
      return fetchAuthMe(session.user.id);
    },
    enabled,
    staleTime: 60_000,
  });
}
