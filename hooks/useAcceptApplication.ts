import { useMutation, useQueryClient } from '@tanstack/react-query';

import { acceptApplicationRpc } from '@/lib/data/applications';
import { queryKeys } from '@/lib/queryKeys';

export function useAcceptApplication(requirementId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => acceptApplicationRpc(applicationId),
    onSuccess: () => {
      if (requirementId) {
        void qc.invalidateQueries({ queryKey: queryKeys.requirementApplications(requirementId) });
        void qc.invalidateQueries({ queryKey: queryKeys.gig(requirementId) });
      }
      void qc.invalidateQueries({ queryKey: queryKeys.clientRequirements });
      void qc.invalidateQueries({ queryKey: queryKeys.gigs });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      void qc.invalidateQueries({ queryKey: queryKeys.inbox });
      void qc.invalidateQueries({ queryKey: queryKeys.notifications });
      void qc.invalidateQueries({ queryKey: queryKeys.studentApplications });
      void qc.invalidateQueries({ queryKey: queryKeys.clientApplicationCounts });
    },
  });
}
