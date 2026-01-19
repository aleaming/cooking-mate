import { create } from 'zustand';
import {
  getShoppingPreferences as getShoppingPreferencesFromDatabase,
  toggleShoppingItem as toggleShoppingItemInDatabase,
  setShoppingItemChecked as setShoppingItemCheckedInDatabase,
  clearCheckedItems as clearCheckedItemsFromDatabase,
  updateShoppingPreferences as updateShoppingPreferencesInDatabase,
  type ShoppingPreferences,
} from '@/lib/actions/shopping';

interface ShoppingState {
  // Checked items by item ID
  checkedItems: Record<string, boolean>;

  // Date range for shopping list
  startDate: string;
  endDate: string;

  // Loading and sync state
  isLoading: boolean;
  isSyncing: boolean;
  lastSynced: string | null;
  error: string | null;

  // Actions
  toggleItem: (itemId: string) => Promise<void>;
  setChecked: (itemId: string, checked: boolean) => Promise<void>;
  clearChecked: () => Promise<void>;
  setDateRange: (startDate: string, endDate: string) => void;
  isChecked: (itemId: string) => boolean;
  getCheckedSet: () => Set<string>;

  // Sync actions
  fetchPreferences: () => Promise<void>;
  clearLocalState: () => void;
}

// Default to current week
const today = new Date();
const startOfWeek = new Date(today);
startOfWeek.setDate(today.getDate() - today.getDay());
const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 6);

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const useShoppingStore = create<ShoppingState>()((set, get) => ({
  checkedItems: {},
  startDate: formatDate(startOfWeek),
  endDate: formatDate(endOfWeek),
  isLoading: false,
  isSyncing: false,
  lastSynced: null,
  error: null,

  toggleItem: async (itemId) => {
    const currentChecked = get().checkedItems[itemId] || false;
    const newChecked = !currentChecked;

    // Optimistic update
    set((state) => ({
      checkedItems: {
        ...state.checkedItems,
        [itemId]: newChecked,
      },
      isSyncing: true,
      error: null,
    }));

    try {
      const { error } = await toggleShoppingItemInDatabase(itemId);

      if (error) {
        // Rollback on error
        set((state) => ({
          checkedItems: {
            ...state.checkedItems,
            [itemId]: currentChecked,
          },
          isSyncing: false,
          error,
        }));
        return;
      }

      set({ isSyncing: false, lastSynced: new Date().toISOString() });
    } catch (err) {
      // Rollback on error
      set((state) => ({
        checkedItems: {
          ...state.checkedItems,
          [itemId]: currentChecked,
        },
        isSyncing: false,
        error: err instanceof Error ? err.message : 'Failed to toggle item',
      }));
    }
  },

  setChecked: async (itemId, checked) => {
    const previousChecked = get().checkedItems[itemId] || false;

    if (previousChecked === checked) return;

    // Optimistic update
    set((state) => ({
      checkedItems: {
        ...state.checkedItems,
        [itemId]: checked,
      },
      isSyncing: true,
      error: null,
    }));

    try {
      const { error } = await setShoppingItemCheckedInDatabase(itemId, checked);

      if (error) {
        // Rollback on error
        set((state) => ({
          checkedItems: {
            ...state.checkedItems,
            [itemId]: previousChecked,
          },
          isSyncing: false,
          error,
        }));
        return;
      }

      set({ isSyncing: false, lastSynced: new Date().toISOString() });
    } catch (err) {
      // Rollback on error
      set((state) => ({
        checkedItems: {
          ...state.checkedItems,
          [itemId]: previousChecked,
        },
        isSyncing: false,
        error: err instanceof Error ? err.message : 'Failed to set item checked',
      }));
    }
  },

  clearChecked: async () => {
    const previousCheckedItems = get().checkedItems;

    // Optimistic update
    set({ checkedItems: {}, isSyncing: true, error: null });

    try {
      const { error } = await clearCheckedItemsFromDatabase();

      if (error) {
        // Rollback on error
        set({ checkedItems: previousCheckedItems, isSyncing: false, error });
        return;
      }

      set({ isSyncing: false, lastSynced: new Date().toISOString() });
    } catch (err) {
      // Rollback on error
      set({
        checkedItems: previousCheckedItems,
        isSyncing: false,
        error: err instanceof Error ? err.message : 'Failed to clear checked items',
      });
    }
  },

  setDateRange: (startDate, endDate) => {
    set({ startDate, endDate });
  },

  isChecked: (itemId) => {
    return get().checkedItems[itemId] || false;
  },

  getCheckedSet: () => {
    const { checkedItems } = get();
    return new Set(
      Object.entries(checkedItems)
        .filter(([_, checked]) => checked)
        .map(([id]) => id)
    );
  },

  // Sync actions
  fetchPreferences: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await getShoppingPreferencesFromDatabase();

      if (error) {
        set({ isLoading: false, error });
        return;
      }

      if (data) {
        // Convert checked_items array to Record
        const checkedItems: Record<string, boolean> = {};
        for (const itemId of data.checked_items) {
          checkedItems[itemId] = true;
        }

        // Calculate date range based on default_range_days
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfRange = new Date(startOfWeek);
        endOfRange.setDate(startOfWeek.getDate() + data.default_range_days - 1);

        set({
          checkedItems,
          startDate: formatDate(startOfWeek),
          endDate: formatDate(endOfRange),
          isLoading: false,
          lastSynced: new Date().toISOString(),
        });
      }
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch preferences',
      });
    }
  },

  clearLocalState: () => {
    set({
      checkedItems: {},
      startDate: formatDate(startOfWeek),
      endDate: formatDate(endOfWeek),
      isLoading: false,
      isSyncing: false,
      lastSynced: null,
      error: null,
    });
  },
}));
