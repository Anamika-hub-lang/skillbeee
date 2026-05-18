import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { StudentProfile, UserRole } from '@/types';

type SessionState = {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  onboardingComplete: boolean;
  completeOnboarding: () => void;
  isAuthenticated: boolean;
  signInDemo: () => void;
  signOut: () => void;
  role: UserRole | null;
  setRole: (role: UserRole) => void;
  studentProfileComplete: boolean;
  setStudentProfile: (p: Partial<StudentProfile>) => void;
  completeStudentSetup: () => void;
  studentProfile: StudentProfile;
};

const defaultStudent: StudentProfile = {
  displayName: '',
  skills: [],
  hourlyRate: 25,
  availabilityNote: 'Evenings (ET)',
  availableNow: false,
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      onboardingComplete: false,
      completeOnboarding: () => set({ onboardingComplete: true }),
      isAuthenticated: false,
      signInDemo: () => set({ isAuthenticated: true }),
      signOut: () =>
        set({
          isAuthenticated: false,
          role: null,
          studentProfileComplete: false,
          studentProfile: defaultStudent,
        }),
      role: null,
      setRole: (role) => set({ role }),
      studentProfileComplete: false,
      setStudentProfile: (p) =>
        set((s) => ({
          studentProfile: { ...s.studentProfile, ...p },
        })),
      completeStudentSetup: () => set({ studentProfileComplete: true }),
      studentProfile: defaultStudent,
    }),
    {
      name: 'skillbee-session',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        onboardingComplete: s.onboardingComplete,
        isAuthenticated: s.isAuthenticated,
        role: s.role,
        studentProfileComplete: s.studentProfileComplete,
        studentProfile: s.studentProfile,
      }),
      onRehydrateStorage: () => () => {
        useSessionStore.getState().setHydrated(true);
      },
    },
  ),
);
