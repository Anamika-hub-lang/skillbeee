import { useQuery } from '@tanstack/react-query';

import { fetchRequirementGigForViewer } from '@/lib/data/gigs';
import { normalizeGig } from '@/lib/normalizeGig';
import { isUuid } from '@/lib/isUuid';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';

export function useRequirementGig(id: string | undefined) {
  const clean = id && isUuid(id) ? id : undefined;
  return useQuery({
    queryKey: queryKeys.gig(clean ?? '__none__'),
    queryFn: async () => {
      if (!clean) throw new Error('Invalid gig id');
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Sign in required.');
      const gig = await fetchRequirementGigForViewer(clean, session.user.id);
      return normalizeGig(gig);
    },
    enabled: Boolean(clean),
    staleTime: 20_000,
  });
}
