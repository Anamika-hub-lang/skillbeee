import { supabase } from '@/lib/supabase';
import { throwOnPostgrestError } from '@/lib/supabase/queryHelpers';

import type { NotificationItem } from '@/types';

export async function fetchNotifications(userId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, body, type, read, data, createdAt')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })
    .limit(100);
  throwOnPostgrestError(error);
  return (data ?? []).map((n) => {
    const row = n as {
      id: string;
      title: string;
      body: string;
      type: string;
      read: boolean;
      data?: unknown;
      createdAt: string;
    };
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      type: row.type as NotificationItem['type'],
      read: row.read,
      createdAt: row.createdAt,
      data: row.data,
    };
  });
}

export async function markNotificationRead(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('userId', userId);
  throwOnPostgrestError(error);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('userId', userId).eq('read', false);
  throwOnPostgrestError(error);
}
