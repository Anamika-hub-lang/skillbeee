import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type NotificationPrefsState = {
  pushEnabled: boolean;
  setPushEnabled: (enabled: boolean) => void;
};

export const useNotificationPrefsStore = create<NotificationPrefsState>()(
  persist(
    (set) => ({
      pushEnabled: true,
      setPushEnabled: (pushEnabled) => set({ pushEnabled }),
    }),
    {
      name: 'skillbee-notification-prefs',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
