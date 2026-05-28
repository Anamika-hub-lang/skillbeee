import type { RealtimeChannel } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/** Legacy name — kept for chat-specific broadcast experiments. */
export function subscribeTaskThread(
  threadId: string,
  onMessage: (payload: unknown) => void,
): RealtimeChannel | null {
  if (!isSupabaseConfigured()) return null;
  return supabase
    .channel(`thread:${threadId}`)
    .on('broadcast', { event: 'message' }, (p) => onMessage(p))
    .subscribe();
}

/** Typing / presence channel (broadcast-only; pair with UI debounce). */
export function subscribeTypingChannel(
  requirementId: string,
  userId: string,
  onTyping: (payload: { userId: string; typing: boolean }) => void,
): RealtimeChannel | null {
  if (!isSupabaseConfigured()) return null;
  return supabase
    .channel(`typing:${requirementId}`)
    .on('broadcast', { event: 'typing' }, (p) => {
      const pl = p.payload as { userId?: string; typing?: boolean };
      if (pl?.userId && pl.userId !== userId) {
        onTyping({ userId: pl.userId, typing: Boolean(pl.typing) });
      }
    })
    .subscribe();
}
