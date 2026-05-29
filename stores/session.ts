import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { StudentProfile, UserRole } from '@/types';

type SessionState = {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  supabaseAuthReady: boolean;
  setSupabaseAuthReady: (v: boolean) => void;
  onboardingComplete: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  authFlowComplete: boolean;
  completeAuthFlow: () => void;
  isAuthenticated: boolean;
  applySupabaseSignedIn: () => void;
  clearAppAuthOnly: () => void;
  signOut: () => Promise<void>;
  role: UserRole | null;
  setRole: (role: UserRole) => void;
  accountUserId: string | null;
  setAccountUserId: (userId: string) => void;
  studentProfileComplete: boolean;
  clientProfileComplete: boolean;
  setStudentProfile: (p: Partial<StudentProfile>) => void;
  completeStudentSetup: () => void;
  completeClientSetup: () => void;
  studentProfile: StudentProfile;
};

const defaultStudent: StudentProfile = {
  displayName: '',
  skills: [],
  hourlyRate: 500,
  availabilityNote: 'Evenings (IST)',
  availableNow: false,
  bio: '',
  portfolioUrl: '',
};

function clearAuthSessionOnly() {
  return {
    authFlowComplete: false,
    isAuthenticated: false,
  } as const;
}

function clearSessionSlice() {
  return {
    ...clearAuthSessionOnly(),
    role: null,
    studentProfileComplete: false,
    clientProfileComplete: false,
    studentProfile: defaultStudent,
  } as const;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      supabaseAuthReady: false,
      setSupabaseAuthReady: (v) => set({ supabaseAuthReady: v }),
      onboardingComplete: false,
      completeOnboarding: () => set({ onboardingComplete: true }),
      resetOnboarding: () => set({ onboardingComplete: false }),
      authFlowComplete: false,
      completeAuthFlow: () => set({ authFlowComplete: true, isAuthenticated: true }),
      isAuthenticated: false,
      applySupabaseSignedIn: () => set({ isAuthenticated: true }),
      clearAppAuthOnly: () => set(clearAuthSessionOnly()),
      signOut: async () => {
        try {
          if (isSupabaseConfigured()) {
            await supabase.auth.signOut();
          }
        } catch {
          /* ignore */
        } finally {
          set(clearAuthSessionOnly());
        }
      },
      role: null,
      setRole: (role) => set({ role }),
      accountUserId: null,
      setAccountUserId: (userId) => set({ accountUserId: userId }),
      studentProfileComplete: false,
      setStudentProfile: (p) =>
        set((s) => ({
          studentProfile: { ...s.studentProfile, ...p },
        })),
      completeStudentSetup: () => set({ studentProfileComplete: true }),
      clientProfileComplete: false,
      completeClientSetup: () => set({ clientProfileComplete: true }),
      studentProfile: defaultStudent,
    }),
    {
      name: 'skillbee-session',
      version: 1,
      migrate: (persisted, fromVersion) => {
        const state =
          typeof persisted === 'object' && persisted !== null
            ? (persisted as Record<string, unknown>)
            : {};
        if (fromVersion < 1) {
          // v1: onboarding is only completed in the onboarding UI (not via server sync).
          return { ...state, onboardingComplete: false };
        }
        return state;
      },
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        onboardingComplete: s.onboardingComplete,
        accountUserId: s.accountUserId,
        role: s.role,
        studentProfileComplete: s.studentProfileComplete,
        clientProfileComplete: s.clientProfileComplete,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(typeof persisted === 'object' && persisted !== null ? (persisted as Partial<SessionState>) : {}),
        isAuthenticated: false,
        supabaseAuthReady: false,
        authFlowComplete: false,
        studentProfile: defaultStudent,
      }),
      onRehydrateStorage: () => () => {
        useSessionStore.getState().setHydrated(true);
      },
    },
  ),
);

useSessionStore.persist.onFinishHydration(() => {
  useSessionStore.getState().setHydrated(true);
});
