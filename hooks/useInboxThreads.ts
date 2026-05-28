import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fetchInboxThreads } from '@/lib/data/messages';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { applyLocalReadState, useReadChatsStore } from '@/stores/readChats';

export function useInboxThreads() {
  const clearedThreadIds = useReadChatsStore((s) => s.clearedThreadIds);
  const query = useQuery({
    queryKey: queryKeys.inbox,
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return [];
      return fetchInboxThreads(session.user.id);
    },
    staleTime: 20_000,
    refetchOnReconnect: true,
  });

  const data = useMemo(
    () => applyLocalReadState(query.data ?? [], clearedThreadIds),
    [clearedThreadIds, query.data],
  );

  return { ...query, data };
}