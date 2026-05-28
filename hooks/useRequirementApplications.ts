import { useQuery } from '@tanstack/react-query';

import { fetchApplicationsForClient } from '@/lib/data/applications';
import { isUuid } from '@/lib/isUuid';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';

export type ApplicationRow = {
  id: string;
  requirementId: string;
  studentId: string;
  status: string;
  coverNote: string | null;
  /** Public image URLs the student attached when applying (for client review). */
  sampleUrls: string[];
  createdAt: string;
  student: {
    id: string;
    profile: { displayName: string | null; photoUrl: string | null };
  };
};

export function useRequirementApplications(requirementId: string | undefined) {
  const id = requirementId && isUuid(requirementId) ? requirementId : undefined;
  return useQuery({
    queryKey: queryKeys.requirementApplications(id ?? '__none__'),
    queryFn: async (): Promise<ApplicationRow[]> => {
      if (!id) return [];
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Sign in required.');
      return fetchApplicationsForClient(id, session.user.id);
    },
    enabled: Boolean(id),
    staleTime: 20_000,
  });
}
