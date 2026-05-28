import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateUserProfile } from '@/lib/data/profileAndDashboard';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';

type Patch = Partial<{
  displayName: string | null;
  photoUrl: string | null;
  skills: string[];
  hourlyRate: number;
  availabilityNote: string | null;
  availableNow: boolean;
  portfolioUrl: string | null;
  bio: string | null;
}>;

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Patch) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Sign in required.');
      await updateUserProfile(session.user.id, patch);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.authMe });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
