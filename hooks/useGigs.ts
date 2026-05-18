import { useQuery } from '@tanstack/react-query';

import { DUMMY_GIGS } from '@/data/dummy';
import type { Gig } from '@/types';

export function useGigs() {
  return useQuery({
    queryKey: ['gigs'],
    queryFn: async (): Promise<Gig[]> => {
      await new Promise((r) => setTimeout(r, 450));
      return DUMMY_GIGS;
    },
  });
}
