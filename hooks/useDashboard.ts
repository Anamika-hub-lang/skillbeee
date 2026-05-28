import { useQuery } from '@tanstack/react-query';

import { fetchDashboard } from '@/lib/data/profileAndDashboard';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/stores/session';

export type ClientDashboardPayload = {
  role: 'client';
  counts: { openRequirements: number; activeMatches: number };
  payments: unknown[];
  activity: unknown[];
  totalSpendMinor: number;
};

export type StudentDashboardPayload = {
  role: 'student';
  applicationsByStatus: { pending: number; accepted: number };
  earningsMinor: number;
  activeThreads: number;
};

export type DashboardPayload = ClientDashboardPayload | StudentDashboardPayload;

export function useDashboard() {
  const role = useSessionStore((s) => s.role);
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async (): Promise<DashboardPayload | null> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id || !role) return null;
      return fetchDashboard(session.user.id, role);
    },
    enabled: Boolean(role),
    staleTime: 60_000,
    retry: 1,
    refetchOnReconnect: true,
  });
}
