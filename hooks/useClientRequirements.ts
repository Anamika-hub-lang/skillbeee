import { useQuery } from '@tanstack/react-query';

import { fetchClientRequirementsGigs } from '@/lib/data/gigs';
import { normalizeGigList } from '@/lib/normalizeGig';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/stores/session';

export function useClientRequirements() {
  const supabaseAuthReady = useSessionStore((s) => s.supabaseAuthReady);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.clientRequirements,
    enabled: supabaseAuthReady && isAuthenticated,
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return [];
      const gigs = await fetchClientRequirementsGigs(session.user.id);
      return normalizeGigList(gigs);
    },
    staleTime: 15_000,
    retry: 1,
    refetchOnReconnect: true,
  });
}
