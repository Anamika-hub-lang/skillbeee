import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';

import { markChatUnreadLocal } from '@/lib/markChatRead';
import { queryKeys } from '@/lib/queryKeys';
import { syncRealtimeAuth } from '@/lib/realtimeAuth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const TABLES = ['requirements', 'applications', 'messages', 'payments', 'notifications'] as const;

const DEBOUNCE_MS = 320;

function debounceTable(
  timers: Map<string, ReturnType<typeof setTimeout>>,
  table: (typeof TABLES)[number],
  run: () => void,
) {
  const key = table;
  const prev = timers.get(key);
  if (prev) clearTimeout(prev);
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      run();
    }, DEBOUNCE_MS),
  );
}

/** Invalidate only queries affected by a given table (avoids refetching the entire app). */
function invalidateForTable(qc: QueryClient, table: (typeof TABLES)[number]) {
  switch (table) {
    case 'requirements':
      void qc.invalidateQueries({ queryKey: queryKeys.gigs });
      void qc.invalidateQueries({ queryKey: queryKeys.clientRequirements });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'gig' });
      return;
    case 'applications':
      void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'applications' });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      void qc.invalidateQueries({ queryKey: queryKeys.inbox });
      return;
    case 'messages':
      void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'messages' });
      void qc.invalidateQueries({ queryKey: queryKeys.inbox });
      void qc.invalidateQueries({ queryKey: queryKeys.notifications });
      return;
    case 'payments':
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      return;
    case 'notifications':
      void qc.invalidateQueries({ queryKey: queryKeys.notifications });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      return;
    default:
      return;
  }
}

function messageThreadId(row: Record<string, unknown>): string | undefined {
  const a = row.requirementId;
  const b = row.requirement_id;
  if (typeof a === 'string') return a;
  if (typeof b === 'string') return b;
  return undefined;
}

/** Inbox badge only changes on new messages — not read-receipt UPDATEs. */
function handleMessagesRealtime(
  qc: QueryClient,
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
): void {
  void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'messages' });

  if (payload.eventType !== 'INSERT') return;

  const row = payload.new ?? {};
  const threadId = messageThreadId(row);
  const senderId = row.senderId ?? row.sender_id;

  void (async () => {
    const uid = (await supabase.auth.getSession()).data.session?.user?.id;
    if (threadId && typeof senderId === 'string' && senderId !== uid) {
      markChatUnreadLocal(qc, threadId);
    } else {
      void qc.invalidateQueries({ queryKey: queryKeys.inbox });
    }
    void qc.invalidateQueries({ queryKey: queryKeys.notifications });
  })();
}

/**
 * Invalidates TanStack Query caches when Postgres rows change.
 * Requires: tables in `supabase_realtime` publication, Realtime enabled in dashboard, and RLS policies
 * that allow `SELECT` for the signed-in user (plus `syncRealtimeAuth()` so Realtime uses your JWT).
 */
export function usePlatformRealtime(): void {
  const qc = useQueryClient();
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const debounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!isSupabaseConfigured()) return undefined;

    let cancelled = false;

    const clearDebounceTimers = () => {
      for (const t of debounceTimersRef.current.values()) {
        clearTimeout(t);
      }
      debounceTimersRef.current.clear();
    };

    let mountGen = 0;
    let mountChain = Promise.resolve();

    const teardown = async () => {
      clearDebounceTimers();
      const channels = [...channelsRef.current];
      channelsRef.current = [];
      await Promise.all(channels.map((ch) => supabase.removeChannel(ch)));
    };

    const mount = async () => {
      const gen = ++mountGen;

      await syncRealtimeAuth();
      if (cancelled || gen !== mountGen) return;

      await teardown();
      if (cancelled || gen !== mountGen) return;

      const uid = (await supabase.auth.getSession()).data.session?.user?.id ?? 'anon';
      const topic = `platform-db:${uid}:${gen}`;

      const channel = supabase.channel(topic);
      for (const table of TABLES) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
            debounceTable(debounceTimersRef.current, table, () => {
              if (table === 'messages') {
                handleMessagesRealtime(qc, payload);
                return;
              }
              invalidateForTable(qc, table);
            });
          },
        );
      }

      channel.subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // eslint-disable-next-line no-console
          console.warn('[SkillBee Realtime]', status, err?.message ?? err);
        }
      });

      if (cancelled || gen !== mountGen) {
        await supabase.removeChannel(channel);
        return;
      }

      channelsRef.current = [channel];
    };

    const scheduleMount = () => {
      mountChain = mountChain.then(() => mount()).catch(() => undefined);
    };

    scheduleMount();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED' ||
        event === 'INITIAL_SESSION'
      ) {
        scheduleMount();
      }
      if (event === 'SIGNED_OUT') {
        mountGen += 1;
        void syncRealtimeAuth();
        void teardown();
      }
    });

    return () => {
      cancelled = true;
      mountGen += 1;
      subscription.unsubscribe();
      void teardown();
    };
  }, [qc]);
}
