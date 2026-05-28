import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { markChatUnreadLocal } from '@/lib/markChatRead';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { isUuid } from '@/lib/isUuid';
import { queryKeys } from '@/lib/queryKeys';
import { syncRealtimeAuth } from '@/lib/realtimeAuth';

function requirementIdFromPayloadNew(row: Record<string, unknown>): string | undefined {
  const a = row.requirementId;
  const b = row.requirement_id;
  if (typeof a === 'string') return a;
  if (typeof b === 'string') return b;
  return undefined;
}

/**
 * Tight realtime for a single requirement thread (messages INSERT/UPDATE).
 */
export function useChatRealtime(requirementId: string | undefined): void {
  const qc = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !requirementId || !isUuid(requirementId)) return undefined;

    let cancelled = false;

    const run = async () => {
      await syncRealtimeAuth();
      if (cancelled) return;

      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel: RealtimeChannel = supabase
        .channel(`messages:${requirementId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
            const row = payload.new as Record<string, unknown>;
            if (requirementIdFromPayloadNew(row) !== requirementId) return;

            void qc.invalidateQueries({ queryKey: queryKeys.messages(requirementId) });

            if (payload.eventType === 'INSERT') {
              void (async () => {
                const uid = (await supabase.auth.getSession()).data.session?.user?.id;
                const senderId = row.senderId ?? row.sender_id;
                if (typeof senderId === 'string' && senderId !== uid) {
                  markChatUnreadLocal(qc, requirementId);
                } else {
                  void qc.invalidateQueries({ queryKey: queryKeys.inbox });
                }
                void qc.invalidateQueries({ queryKey: queryKeys.notifications });
              })();
            }
          },
        );

      channel.subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // eslint-disable-next-line no-console
          console.warn('[SkillBee Realtime chat]', status, err?.message ?? err);
        }
      });

      channelRef.current = channel;
    };

    void run();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [qc, requirementId]);
}
