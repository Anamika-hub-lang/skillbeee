import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ReadChatsState = {
  /** Thread ids the user opened — hide unread badge until a new peer message arrives. */
  clearedThreadIds: string[];
  markThreadCleared: (threadId: string) => void;
  markThreadUnread: (threadId: string) => void;
  isThreadCleared: (threadId: string) => boolean;
};

export const useReadChatsStore = create<ReadChatsState>()(
  persist(
    (set, get) => ({
      clearedThreadIds: [],
      markThreadCleared: (threadId) => {
        const id = threadId.trim();
        if (!id) return;
        set((s) => ({
          clearedThreadIds: s.clearedThreadIds.includes(id)
            ? s.clearedThreadIds
            : [...s.clearedThreadIds, id],
        }));
      },
      markThreadUnread: (threadId) => {
        const id = threadId.trim();
        if (!id) return;
        set((s) => ({
          clearedThreadIds: s.clearedThreadIds.filter((x) => x !== id),
        }));
      },
      isThreadCleared: (threadId) => get().clearedThreadIds.includes(threadId),
    }),
    {
      name: 'skillbee-read-chats',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ clearedThreadIds: s.clearedThreadIds }),
    },
  ),
);

/** Apply local read state so badges stay cleared after opening a chat. */
export function applyLocalReadState<T extends { id: string; unread: number }>(
  threads: T[],
  clearedThreadIds: string[],
): T[] {
  if (clearedThreadIds.length === 0) return threads;
  const cleared = new Set(clearedThreadIds);
  return threads.map((t) => (cleared.has(t.id) ? { ...t, unread: 0 } : t));
}
