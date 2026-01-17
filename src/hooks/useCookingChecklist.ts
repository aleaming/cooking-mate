'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseCookingChecklistOptions {
  recipeId: string;
  persistToSession?: boolean;
}

interface UseCookingChecklistReturn {
  checkedIds: Set<string>;
  isChecked: (id: string) => boolean;
  toggleItem: (id: string) => void;
  clearAll: () => void;
  checkedCount: number;
}

/**
 * Hook for managing ingredient checklist state during cooking sessions.
 * Uses sessionStorage for persistence - clears when browser tab closes.
 */
export function useCookingChecklist({
  recipeId,
  persistToSession = true,
}: UseCookingChecklistOptions): UseCookingChecklistReturn {
  const storageKey = `cooking-checklist-${recipeId}`;

  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined' || !persistToSession) {
      return new Set();
    }
    try {
      const stored = sessionStorage.getItem(storageKey);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Sync to sessionStorage when checkedIds changes
  useEffect(() => {
    if (persistToSession && typeof window !== 'undefined') {
      sessionStorage.setItem(storageKey, JSON.stringify([...checkedIds]));
    }
  }, [checkedIds, storageKey, persistToSession]);

  const isChecked = useCallback(
    (id: string) => checkedIds.has(id),
    [checkedIds]
  );

  const toggleItem = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setCheckedIds(new Set());
  }, []);

  return {
    checkedIds,
    isChecked,
    toggleItem,
    clearAll,
    checkedCount: checkedIds.size,
  };
}
