'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingListByCategory, ShoppingListItem } from '@/types';
import { ShoppingItem } from './ShoppingItem';
import { collapseVariants, staggerContainer, staggerItem, SPRING } from '@/lib/constants/animations';

interface ShoppingCategoryProps {
  category: ShoppingListByCategory;
  checkedItems: Set<string>;
  onToggleItem: (itemId: string) => void;
}

export function ShoppingCategory({ category, checkedItems, onToggleItem }: ShoppingCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const checkedCount = category.items.filter((item) => checkedItems.has(item.id)).length;
  const totalCount = category.items.length;
  const allChecked = checkedCount === totalCount;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.gentle}
      className="bg-white rounded-2xl shadow-lg shadow-sand-200/50 overflow-hidden"
    >
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-sand-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">
            {getCategoryEmoji(category.category)}
          </span>
          <h3 className="font-display font-semibold text-olive-900">
            {category.categoryLabel}
          </h3>
          <span className="text-sm text-sand-500">
            {checkedCount}/{totalCount}
          </span>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="w-5 h-5 text-sand-400" />
        </motion.div>
      </button>

      {/* Category Items */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={collapseVariants}
          >
            <div className="px-4 pb-4 space-y-1">
              {category.items.map((item) => (
                <ShoppingItem
                  key={item.id}
                  item={{ ...item, isChecked: checkedItems.has(item.id) }}
                  onToggle={() => onToggleItem(item.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All checked indicator */}
      {allChecked && totalCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 pb-3 text-center text-sm text-olive-600"
        >
          All items checked!
        </motion.div>
      )}
    </motion.div>
  );
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    produce: '🥬',
    protein: '🥩',
    seafood: '🐟',
    dairy: '🥛',
    grains: '🍞',
    pantry: '🥫',
    'oils-vinegars': '🫒',
    'herbs-spices': '🌿',
    'nuts-seeds': '🥜',
    beverages: '🍷',
    other: '📦',
  };
  return emojis[category] || '📦';
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
