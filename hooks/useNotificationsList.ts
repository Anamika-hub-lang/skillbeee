import { useQuery } from '@tanstack/react-query';

import { fetchNotifications } from '@/lib/data/notifications';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';

import type { NotificationItem } from '@/types';

export type ApiNotification = NotificationItem;

export function useNotificationsList() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async (): Promise<NotificationItem[]> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return [];
      return fetchNotifications(session.user.id);
    },
    staleTime: 30_000,
    refetchOnReconnect: true,
  });
}
