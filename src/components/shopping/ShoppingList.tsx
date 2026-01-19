'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingListByCategory } from '@/types';
import { ShoppingCategory } from './ShoppingCategory';
import { Button } from '@/components/ui';
import { staggerContainer, staggerItem } from '@/lib/constants/animations';
import { IconShoppingCart, IconConfetti } from '@tabler/icons-react';

interface ShoppingListProps {
  categories: ShoppingListByCategory[];
  checkedItems: Set<string>;
  onToggleItem: (itemId: string) => void;
  onClearChecked: () => void;
}

export function ShoppingList({
  categories,
  checkedItems,
  onToggleItem,
  onClearChecked,
}: ShoppingListProps) {
  const stats = useMemo(() => {
    let totalItems = 0;
    let checkedCount = 0;

    for (const category of categories) {
      totalItems += category.items.length;
      checkedCount += category.items.filter((item) => checkedItems.has(item.id)).length;
    }

    return {
      totalItems,
      checkedCount,
      remainingCount: totalItems - checkedCount,
      progress: totalItems > 0 ? (checkedCount / totalItems) * 100 : 0,
    };
  }, [categories, checkedItems]);

  if (categories.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <IconShoppingCart size={64} className="mx-auto mb-4 text-sand-400" />
        <h3 className="text-lg font-medium text-olive-800 mb-2">
          No items on your shopping list
        </h3>
        <p className="text-sand-600 max-w-md mx-auto">
          Add recipes to your meal plan to automatically generate a shopping list
          with all the ingredients you need.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-lg shadow-sand-200/50 dark:shadow-sand-900/20 p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-olive-800">
            Shopping Progress
          </span>
          <span className="text-sm text-sand-600">
            {stats.checkedCount} of {stats.totalItems} items
          </span>
        </div>

        <div className="h-3 bg-sand-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-olive-400 to-olive-500 rounded-full"
          />
        </div>

        {stats.checkedCount > 0 && (
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={onClearChecked}>
              Clear checked items
            </Button>
          </div>
        )}
      </motion.div>

      {/* Category List */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-4"
      >
        {categories.map((category) => (
          <motion.div key={category.category} variants={staggerItem}>
            <ShoppingCategory
              category={category}
              checkedItems={checkedItems}
              onToggleItem={onToggleItem}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Completion Message */}
      {stats.progress === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8 bg-olive-50 rounded-2xl"
        >
          <IconConfetti size={40} className="mx-auto mb-2 text-olive-600" />
          <p className="font-medium text-olive-800">
            Shopping complete! You got everything.
          </p>
        </motion.div>
      )}
    </div>
  );
}
