'use client';

import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui';
import { ShoppingListItem } from '@/types';
import { formatQuantity } from '@/lib/utils/ingredients';
import { SPRING, strikethroughVariants } from '@/lib/constants/animations';

interface ShoppingItemProps {
  item: ShoppingListItem;
  onToggle: () => void;
}

export function ShoppingItem({ item, onToggle }: ShoppingItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={SPRING.gentle}
      onClick={onToggle}
      className={`
        flex items-center gap-3 p-3 rounded-xl cursor-pointer
        transition-colors duration-200
        ${item.isChecked ? 'bg-sand-50' : 'bg-white hover:bg-olive-50'}
      `}
    >
      {/* Checkbox */}
      <Checkbox
        checked={item.isChecked}
        size="md"
        aria-label={`${item.isChecked ? 'Uncheck' : 'Check'} ${item.ingredientName}`}
      />

      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <div className="relative">
          <span
            className={`
              text-sm font-medium
              ${item.isChecked ? 'text-sand-400' : 'text-olive-900'}
            `}
          >
            {item.ingredientName}
          </span>
          {/* Strikethrough line */}
          <motion.div
            variants={strikethroughVariants}
            initial="unchecked"
            animate={item.isChecked ? 'checked' : 'unchecked'}
            className="absolute top-1/2 left-0 right-0 h-0.5 bg-sand-400"
          />
        </div>
      </div>

      {/* Quantity */}
      <span
        className={`
          text-sm flex-shrink-0
          ${item.isChecked ? 'text-sand-400' : 'text-sand-600'}
        `}
      >
        {formatQuantity(item.totalQuantity, item.unit)}
      </span>
    </motion.div>
  );
}
