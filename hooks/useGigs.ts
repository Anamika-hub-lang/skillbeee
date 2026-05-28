import { useQuery } from '@tanstack/react-query';

import { fetchOpenFeedGigs } from '@/lib/data/gigs';
import { normalizeGigList } from '@/lib/normalizeGig';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/stores/session';

export function useGigs() {
  const supabaseAuthReady = useSessionStore((s) => s.supabaseAuthReady);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.gigs,
    enabled: supabaseAuthReady && isAuthenticated,
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return [];
      const gigs = await fetchOpenFeedGigs();
      return normalizeGigList(gigs);
    },
    staleTime: 15_000,
    retry: 1,
    refetchOnReconnect: true,
  });
}
