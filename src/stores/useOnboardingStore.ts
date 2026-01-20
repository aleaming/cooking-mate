import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  // Track which onboarding flows the user has seen
  hasSeenWelcome: boolean;
  hasSeenImportGuide: boolean;

  // Actions
  markWelcomeSeen: () => void;
  markImportGuideSeen: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenWelcome: false,
      hasSeenImportGuide: false,

      markWelcomeSeen: () => set({ hasSeenWelcome: true }),
      markImportGuideSeen: () => set({ hasSeenImportGuide: true }),
      reset: () => set({ hasSeenWelcome: false, hasSeenImportGuide: false }),
    }),
    {
      name: 'meddiet-onboarding',
    }
  )
);
