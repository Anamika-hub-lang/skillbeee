import { useMemo } from 'react';

import { useInboxThreads } from '@/hooks/useInboxThreads';
import { useNotificationsList } from '@/hooks/useNotificationsList';

export function useUnreadBadgeCounts() {
  const { data: notifs } = useNotificationsList();
  const { data: threads } = useInboxThreads();

  return useMemo(() => {
    const notifUnread = notifs?.filter((n) => !n.read).length ?? 0;
    const messageNotifUnread =
      notifs?.filter((n) => !n.read && n.type === 'message').length ?? 0;
    const applicationNotifUnread =
      notifs?.filter((n) => !n.read && (n.type === 'application' || n.type === 'match')).length ?? 0;
    const chatUnread = threads?.reduce((sum, t) => sum + (typeof t.unread === 'number' ? t.unread : 0), 0) ?? 0;
    return { notifUnread, chatUnread, messageNotifUnread, applicationNotifUnread };
  }, [notifs, threads]);
}
