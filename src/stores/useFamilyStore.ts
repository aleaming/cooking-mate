import { create } from 'zustand';
import type {
  Family,
  FamilyWithDetails,
  FamilyMemberWithProfile,
  FamilyPermissions,
  FamilyRole,
  FamilyInvitationWithDetails,
} from '@/types/family';
import { getPermissionsForRole } from '@/types/family';
import {
  getMyFamilies,
  getFamilyById,
  createFamily as createFamilyAction,
  updateFamily as updateFamilyAction,
  deleteFamily as deleteFamilyAction,
  leaveFamily as leaveFamilyAction,
  setActiveFamily as setActiveFamilyAction,
  toggleFamilyMode as toggleFamilyModeAction,
  getFamilyContext,
} from '@/lib/actions/family';
import {
  getPendingInvitations,
  getMyPendingInvitations,
} from '@/lib/actions/familyInvitations';
import { getFamilyMembers } from '@/lib/actions/familyMembers';

interface FamilyState {
  // Core state
  myFamilies: FamilyWithDetails[];
  activeFamily: FamilyWithDetails | null;
  activeFamilyMembers: FamilyMemberWithProfile[];
  familyModeEnabled: boolean;
  userRole: FamilyRole | null;
  permissions: FamilyPermissions | null;

  // Invitations
  pendingInvitations: FamilyInvitationWithDetails[]; // Invitations sent by this family
  myPendingInvitations: FamilyInvitationWithDetails[]; // Invitations sent to user

  // Loading states
  isLoading: boolean;
  isLoadingFamilies: boolean;
  isLoadingMembers: boolean;
  isLoadingInvitations: boolean;
  isSyncing: boolean;
  error: string | null;

  // Actions - Fetching
  fetchMyFamilies: () => Promise<void>;
  fetchFamilyDetails: (familyId: string) => Promise<void>;
  fetchFamilyMembers: (familyId: string) => Promise<void>;
  fetchPendingInvitations: (familyId: string) => Promise<void>;
  fetchMyPendingInvitations: () => Promise<void>;
  fetchFamilyContext: () => Promise<void>;

  // Actions - Family CRUD
  createFamily: (name: string) => Promise<{ success: boolean; familyId?: string; error?: string }>;
  updateFamily: (familyId: string, name: string) => Promise<{ success: boolean; error?: string }>;
  deleteFamily: (familyId: string) => Promise<{ success: boolean; error?: string }>;
  leaveFamily: (familyId: string) => Promise<{ success: boolean; error?: string }>;

  // Actions - Family Mode
  setActiveFamily: (familyId: string | null) => Promise<{ success: boolean; error?: string }>;
  toggleFamilyMode: () => Promise<{ success: boolean; error?: string }>;

  // Helpers
  clearError: () => void;
  clearState: () => void;
  isOwnerOrAdmin: () => boolean;
  canUserVote: () => boolean;
}

export const useFamilyStore = create<FamilyState>()((set, get) => ({
  // Initial state
  myFamilies: [],
  activeFamily: null,
  activeFamilyMembers: [],
  familyModeEnabled: false,
  userRole: null,
  permissions: null,
  pendingInvitations: [],
  myPendingInvitations: [],
  isLoading: false,
  isLoadingFamilies: false,
  isLoadingMembers: false,
  isLoadingInvitations: false,
  isSyncing: false,
  error: null,

  // Fetch all families user belongs to
  fetchMyFamilies: async () => {
    set({ isLoadingFamilies: true, error: null });

    try {
      const result = await getMyFamilies();

      if (result.error) {
        set({ isLoadingFamilies: false, error: result.error });
        return;
      }

      set({
        myFamilies: result.data || [],
        isLoadingFamilies: false,
      });
    } catch (err) {
      set({
        isLoadingFamilies: false,
        error: err instanceof Error ? err.message : 'Failed to fetch families',
      });
    }
  },

  // Fetch details for a specific family
  fetchFamilyDetails: async (familyId: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await getFamilyById(familyId);

      if (result.error) {
        set({ isLoading: false, error: result.error });
        return;
      }

      if (result.data) {
        const permissions = result.data.userRole
          ? getPermissionsForRole(result.data.userRole)
          : null;

        set({
          activeFamily: result.data.family,
          activeFamilyMembers: result.data.members,
          userRole: result.data.userRole,
          permissions,
          isLoading: false,
        });
      }
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch family details',
      });
    }
  },

  // Fetch members for a family
  fetchFamilyMembers: async (familyId: string) => {
    set({ isLoadingMembers: true, error: null });

    try {
      const result = await getFamilyMembers(familyId);

      if (result.error) {
        set({ isLoadingMembers: false, error: result.error });
        return;
      }

      set({
        activeFamilyMembers: result.data || [],
        isLoadingMembers: false,
      });
    } catch (err) {
      set({
        isLoadingMembers: false,
        error: err instanceof Error ? err.message : 'Failed to fetch family members',
      });
    }
  },

  // Fetch pending invitations for a family
  fetchPendingInvitations: async (familyId: string) => {
    set({ isLoadingInvitations: true, error: null });

    try {
      const result = await getPendingInvitations(familyId);

      if (result.error) {
        set({ isLoadingInvitations: false, error: result.error });
        return;
      }

      set({
        pendingInvitations: result.data || [],
        isLoadingInvitations: false,
      });
    } catch (err) {
      set({
        isLoadingInvitations: false,
        error: err instanceof Error ? err.message : 'Failed to fetch invitations',
      });
    }
  },

  // Fetch invitations sent to the current user
  fetchMyPendingInvitations: async () => {
    set({ isLoadingInvitations: true, error: null });

    try {
      const result = await getMyPendingInvitations();

      if (result.error) {
        set({ isLoadingInvitations: false, error: result.error });
        return;
      }

      set({
        myPendingInvitations: result.data || [],
        isLoadingInvitations: false,
      });
    } catch (err) {
      set({
        isLoadingInvitations: false,
        error: err instanceof Error ? err.message : 'Failed to fetch your invitations',
      });
    }
  },

  // Fetch full family context (active family, mode, permissions)
  fetchFamilyContext: async () => {
    set({ isLoading: true, error: null });

    try {
      const result = await getFamilyContext();

      if (result.error) {
        set({ isLoading: false, error: result.error });
        return;
      }

      if (result.data) {
        set({
          activeFamily: result.data.activeFamily,
          familyModeEnabled: result.data.familyModeEnabled,
          permissions: result.data.permissions,
          userRole: result.data.role,
          isLoading: false,
        });

        // If there's an active family, fetch its members
        if (result.data.activeFamily) {
          await get().fetchFamilyMembers(result.data.activeFamily.id);
        }
      }
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch family context',
      });
    }
  },

  // Create a new family
  createFamily: async (name: string) => {
    set({ isSyncing: true, error: null });

    try {
      const result = await createFamilyAction({ name });

      if (result.error) {
        set({ isSyncing: false, error: result.error });
        return { success: false, error: result.error };
      }

      // Refresh families list
      await get().fetchMyFamilies();

      set({ isSyncing: false });
      return { success: true, familyId: result.data?.id };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create family';
      set({ isSyncing: false, error });
      return { success: false, error };
    }
  },

  // Update family settings
  updateFamily: async (familyId: string, name: string) => {
    set({ isSyncing: true, error: null });

    try {
      const result = await updateFamilyAction(familyId, { name });

      if (result.error) {
        set({ isSyncing: false, error: result.error });
        return { success: false, error: result.error };
      }

      // Refresh families list and details
      await get().fetchMyFamilies();
      if (get().activeFamily?.id === familyId) {
        await get().fetchFamilyDetails(familyId);
      }

      set({ isSyncing: false });
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update family';
      set({ isSyncing: false, error });
      return { success: false, error };
    }
  },

  // Delete a family
  deleteFamily: async (familyId: string) => {
    set({ isSyncing: true, error: null });

    try {
      const result = await deleteFamilyAction(familyId);

      if (result.error) {
        set({ isSyncing: false, error: result.error });
        return { success: false, error: result.error };
      }

      // Clear active family if it was deleted
      if (get().activeFamily?.id === familyId) {
        set({
          activeFamily: null,
          activeFamilyMembers: [],
          familyModeEnabled: false,
          userRole: null,
          permissions: null,
        });
      }

      // Refresh families list
      await get().fetchMyFamilies();

      set({ isSyncing: false });
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete family';
      set({ isSyncing: false, error });
      return { success: false, error };
    }
  },

  // Leave a family
  leaveFamily: async (familyId: string) => {
    set({ isSyncing: true, error: null });

    try {
      const result = await leaveFamilyAction(familyId);

      if (result.error) {
        set({ isSyncing: false, error: result.error });
        return { success: false, error: result.error };
      }

      // Clear active family if user left it
      if (get().activeFamily?.id === familyId) {
        set({
          activeFamily: null,
          activeFamilyMembers: [],
          familyModeEnabled: false,
          userRole: null,
          permissions: null,
        });
      }

      // Refresh families list
      await get().fetchMyFamilies();

      set({ isSyncing: false });
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to leave family';
      set({ isSyncing: false, error });
      return { success: false, error };
    }
  },

  // Set the active family
  setActiveFamily: async (familyId: string | null) => {
    set({ isSyncing: true, error: null });

    try {
      const result = await setActiveFamilyAction(familyId);

      if (result.error) {
        set({ isSyncing: false, error: result.error });
        return { success: false, error: result.error };
      }

      if (familyId) {
        // Fetch the new active family details
        await get().fetchFamilyDetails(familyId);
        set({ familyModeEnabled: true });
      } else {
        set({
          activeFamily: null,
          activeFamilyMembers: [],
          familyModeEnabled: false,
          userRole: null,
          permissions: null,
        });
      }

      set({ isSyncing: false });
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to set active family';
      set({ isSyncing: false, error });
      return { success: false, error };
    }
  },

  // Toggle family mode on/off
  toggleFamilyMode: async () => {
    set({ isSyncing: true, error: null });

    try {
      const result = await toggleFamilyModeAction();

      if (result.error) {
        set({ isSyncing: false, error: result.error });
        return { success: false, error: result.error };
      }

      set({
        familyModeEnabled: result.data ?? false,
        isSyncing: false,
      });

      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to toggle family mode';
      set({ isSyncing: false, error });
      return { success: false, error };
    }
  },

  // Helper methods
  clearError: () => set({ error: null }),

  clearState: () =>
    set({
      myFamilies: [],
      activeFamily: null,
      activeFamilyMembers: [],
      familyModeEnabled: false,
      userRole: null,
      permissions: null,
      pendingInvitations: [],
      myPendingInvitations: [],
      isLoading: false,
      isLoadingFamilies: false,
      isLoadingMembers: false,
      isLoadingInvitations: false,
      isSyncing: false,
      error: null,
    }),

  isOwnerOrAdmin: () => {
    const { userRole } = get();
    return userRole === 'owner' || userRole === 'admin';
  },

  canUserVote: () => {
    const { userRole } = get();
    return userRole === 'owner' || userRole === 'admin' || userRole === 'voter';
  },
}));
