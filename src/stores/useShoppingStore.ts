import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ShoppingState {
  // Checked items by item ID
  checkedItems: Record<string, boolean>;

  // Date range for shopping list
  startDate: string;
  endDate: string;

  // Actions
  toggleItem: (itemId: string) => void;
  setChecked: (itemId: string, checked: boolean) => void;
  clearChecked: () => void;
  setDateRange: (startDate: string, endDate: string) => void;
  isChecked: (itemId: string) => boolean;
  getCheckedSet: () => Set<string>;
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

export const useShoppingStore = create<ShoppingState>()(
  persist(
    (set, get) => ({
      checkedItems: {},
      startDate: formatDate(startOfWeek),
      endDate: formatDate(endOfWeek),

      toggleItem: (itemId) => {
        set((state) => ({
          checkedItems: {
            ...state.checkedItems,
            [itemId]: !state.checkedItems[itemId],
          },
        }));
      },

      setChecked: (itemId, checked) => {
        set((state) => ({
          checkedItems: {
            ...state.checkedItems,
            [itemId]: checked,
          },
        }));
      },

      clearChecked: () => {
        set({ checkedItems: {} });
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
    }),
    {
      name: 'meddiet-shopping',
    }
  )
);
