import { useEffect, useRef } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  canUseAppNotifications,
  presentLocalNotification,
  enableAppNotifications,
} from '@/lib/pushNotifications';
import { syncRealtimeAuth } from '@/lib/realtimeAuth';
import { useNotificationPrefsStore } from '@/stores/notificationPrefs';

/**
 * When push is enabled, registers the device token and shows a phone alert
 * for new rows in `public.notifications` (realtime INSERT).
 */
export function NotificationPushBridge(): null {
  const pushEnabled = useNotificationPrefsStore((s) => s.pushEnabled);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return undefined;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const mount = async () => {
      if (canUseAppNotifications()) {
        try {
          await enableAppNotifications();
        } catch {
          /* keep realtime subscription alive even if permissions are denied */
        }
      }
      if (cancelled) return;

      await syncRealtimeAuth();
      const uid = (await supabase.auth.getSession()).data.session?.user?.id;
      if (!uid || cancelled) return;

      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('userId', uid)
        .order('createdAt', { ascending: false })
        .limit(40);
      for (const row of existing ?? []) {
        seenIdsRef.current.add((row as { id: string }).id);
      }
      bootstrappedRef.current = true;

      channel = supabase
        .channel(`push-notifications:${uid}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `userId=eq.${uid}`,
          },
          (payload) => {
            if (!bootstrappedRef.current) return;
            const row = payload.new as { id?: string; title?: string; body?: string; type?: string };
            if (!row.id || seenIdsRef.current.has(row.id)) return;
            seenIdsRef.current.add(row.id);
            const important = row.type === 'message' || row.type === 'application' || row.type === 'match';
            if (!pushEnabled && !important) return;
            void presentLocalNotification(row.title ?? 'SkillBee', row.body ?? '');
          },
        )
        .subscribe();
    };

    void mount();

    return () => {
      cancelled = true;
      bootstrappedRef.current = false;
      seenIdsRef.current.clear();
      if (channel) void supabase.removeChannel(channel);
    };
  }, [pushEnabled]);

  return null;
}
