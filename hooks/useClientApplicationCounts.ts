import { useQuery } from '@tanstack/react-query';

import { fetchClientPendingApplicationCounts } from '@/lib/data/applications';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/stores/session';

export function useClientApplicationCounts() {
  const role = useSessionStore((s) => s.role);

  return useQuery({
    queryKey: queryKeys.clientApplicationCounts,
    enabled: role === 'client',
    queryFn: async (): Promise<Record<string, number>> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return {};
      return fetchClientPendingApplicationCounts(session.user.id);
    },
    staleTime: 15_000,
  });
}
