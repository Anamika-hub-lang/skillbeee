import type { QueryClient } from '@tanstack/react-query';

import { markThreadRead } from '@/lib/data/messages';
import { clearInboxThreadUnread } from '@/lib/inboxUnread';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';
import { useReadChatsStore } from '@/stores/readChats';

/** Mark a chat read locally + on server; keep badge cleared even if refetch races. */
export async function markChatRead(qc: QueryClient, requirementId: string): Promise<void> {
  const id = requirementId.trim();
  if (!id) return;

  useReadChatsStore.getState().markThreadCleared(id);
  clearInboxThreadUnread(qc, id);

  try {
    const uid = (await supabase.auth.getSession()).data.session?.user?.id;
    if (uid) await markThreadRead(id, uid);
  } catch {
    /* local cleared state keeps the badge hidden */
  }
}

export function markChatUnreadLocal(qc: QueryClient, requirementId: string): void {
  const id = requirementId.trim();
  if (!id) return;
  useReadChatsStore.getState().markThreadUnread(id);
  void qc.invalidateQueries({ queryKey: queryKeys.inbox });
}
