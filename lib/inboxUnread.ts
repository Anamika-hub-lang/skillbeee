import type { QueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryKeys';
import type { InboxThread } from '@/types';

export function patchInboxThreadUnread(
  qc: QueryClient,
  requirementId: string,
  unread: number,
): void {
  qc.setQueryData<InboxThread[]>(queryKeys.inbox, (old) => {
    if (!old) return old;
    return old.map((t) => (t.id === requirementId ? { ...t, unread } : t));
  });
}

export function clearInboxThreadUnread(qc: QueryClient, requirementId: string): void {
  patchInboxThreadUnread(qc, requirementId, 0);
}
