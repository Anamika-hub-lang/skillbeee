import { useMutation, useQueryClient } from '@tanstack/react-query';

import { submitApplication } from '@/lib/data/applications';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';

type ApplyInput = { requirementId: string; coverNote?: string | null; sampleUrls: string[] };

export function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ApplyInput) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Sign in required.');
      return submitApplication({
        requirementId: input.requirementId,
        studentId: session.user.id,
        coverNote: input.coverNote ?? null,
        sampleUrls: input.sampleUrls,
      });
    },
    onSuccess: (_data, input) => {
      void qc.invalidateQueries({ queryKey: queryKeys.gigs });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      void qc.invalidateQueries({ queryKey: queryKeys.inbox });
      void qc.invalidateQueries({ queryKey: queryKeys.notifications });
      void qc.invalidateQueries({ queryKey: queryKeys.studentApplications });
      void qc.invalidateQueries({ queryKey: queryKeys.clientApplicationCounts });
      void qc.invalidateQueries({
        queryKey: queryKeys.requirementApplications(input.requirementId),
      });
    },
  });
}
