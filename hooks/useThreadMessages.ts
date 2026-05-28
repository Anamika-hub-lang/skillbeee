import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchThreadMessages, sendThreadMessage, type ThreadMessageApi } from '@/lib/data/messages';
import { isUuid } from '@/lib/isUuid';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';

export type { ThreadMessageApi };

export function useThreadMessages(requirementId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.messages(requirementId ?? '__none__'),
    queryFn: async (): Promise<ThreadMessageApi[]> => {
      if (!requirementId || !isUuid(requirementId)) return [];
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return [];
      return fetchThreadMessages(requirementId, session.user.id);
    },
    enabled: Boolean(requirementId && isUuid(requirementId)),
    staleTime: 20_000,
  });
}

export function useSendThreadMessage(requirementId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      if (!requirementId || !isUuid(requirementId)) {
        throw new Error('Invalid thread');
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Sign in required.');
      return sendThreadMessage(requirementId, session.user.id, body);
    },
    onSuccess: () => {
      if (requirementId) {
        void qc.invalidateQueries({ queryKey: queryKeys.messages(requirementId) });
      }
      void qc.invalidateQueries({ queryKey: queryKeys.inbox });
      void qc.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}
