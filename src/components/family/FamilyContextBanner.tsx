'use client';

import { motion } from 'framer-motion';
import { IconUsers, IconX } from '@tabler/icons-react';
import { useFamilyStore } from '@/stores/useFamilyStore';

interface FamilyContextBannerProps {
  className?: string;
  showClose?: boolean;
}

export function FamilyContextBanner({
  className = '',
  showClose = true,
}: FamilyContextBannerProps) {
  const {
    activeFamily,
    familyModeEnabled,
    activeFamilyMembers,
    setActiveFamily,
    isSyncing,
  } = useFamilyStore();

  if (!familyModeEnabled || !activeFamily) {
    return null;
  }

  const handleClose = async () => {
    await setActiveFamily(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        flex items-center justify-between gap-3
        px-4 py-2 rounded-xl
        bg-olive-50 border border-olive-200
        ${className}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-olive-100 text-olive-600">
          <IconUsers size={18} />
        </div>
        <div>
          <p className="text-sm font-medium text-olive-800">
            Viewing {activeFamily.name}
          </p>
          <p className="text-xs text-olive-600">
            {activeFamilyMembers.length} member{activeFamilyMembers.length !== 1 ? 's' : ''} • Family meal plans
          </p>
        </div>
      </div>

      {showClose && (
        <button
          onClick={handleClose}
          disabled={isSyncing}
          className="
            p-1.5 rounded-lg
            text-olive-500 hover:bg-olive-100 hover:text-olive-700
            transition-colors disabled:opacity-50
          "
          title="Switch to Personal Mode"
        >
          <IconX size={16} />
        </button>
      )}
    </motion.div>
  );
}
