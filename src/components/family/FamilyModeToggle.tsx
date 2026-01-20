'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconUsers, IconUser, IconChevronDown } from '@tabler/icons-react';
import { useFamilyStore } from '@/stores/useFamilyStore';
import { useAuth } from '@/providers/AuthProvider';

interface FamilyModeToggleProps {
  className?: string;
  compact?: boolean;
}

export function FamilyModeToggle({ className = '', compact = false }: FamilyModeToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const {
    myFamilies,
    activeFamily,
    familyModeEnabled,
    isLoadingFamilies,
    isSyncing,
    fetchMyFamilies,
    setActiveFamily,
    toggleFamilyMode,
  } = useFamilyStore();

  // Fetch families when user is logged in
  useEffect(() => {
    if (user) {
      fetchMyFamilies();
    }
  }, [user, fetchMyFamilies]);

  // Don't render if not logged in or no families
  if (!user || myFamilies.length === 0) {
    return null;
  }

  const handleTogglePersonal = async () => {
    if (familyModeEnabled) {
      await setActiveFamily(null);
    }
    setIsOpen(false);
  };

  const handleSelectFamily = async (familyId: string) => {
    await setActiveFamily(familyId);
    setIsOpen(false);
  };

  const currentLabel = familyModeEnabled && activeFamily
    ? activeFamily.name
    : 'Personal';

  const CurrentIcon = familyModeEnabled ? IconUsers : IconUser;

  if (compact) {
    return (
      <button
        onClick={() => toggleFamilyMode()}
        disabled={isSyncing || !activeFamily}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg
          text-sm font-medium transition-colors
          ${familyModeEnabled
            ? 'bg-olive-100 text-olive-700'
            : 'bg-sand-100 text-sand-700'
          }
          hover:opacity-80 disabled:opacity-50
          ${className}
        `}
        title={familyModeEnabled ? 'Switch to Personal Mode' : 'Switch to Family Mode'}
      >
        <CurrentIcon size={16} />
        <span className="hidden sm:inline">{currentLabel}</span>
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoadingFamilies || isSyncing}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl
          text-sm font-medium transition-all
          border-2 min-w-[140px]
          ${familyModeEnabled
            ? 'bg-olive-50 border-olive-200 text-olive-700'
            : 'bg-sand-50 border-sand-200 text-sand-700'
          }
          hover:border-olive-300 disabled:opacity-50
        `}
      >
        <CurrentIcon size={18} />
        <span className="flex-1 text-left truncate">{currentLabel}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <IconChevronDown size={16} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="
                absolute top-full left-0 mt-2 z-50
                w-56 bg-white rounded-xl shadow-lg
                border border-sand-200 py-1 overflow-hidden
              "
            >
              {/* Personal Mode Option */}
              <button
                onClick={handleTogglePersonal}
                className={`
                  flex items-center gap-3 w-full px-4 py-3
                  text-left transition-colors
                  ${!familyModeEnabled
                    ? 'bg-olive-50 text-olive-700'
                    : 'text-sand-700 hover:bg-sand-50'
                  }
                `}
              >
                <IconUser size={20} />
                <div className="flex-1">
                  <p className="font-medium">Personal</p>
                  <p className="text-xs text-sand-500">Your individual meal plans</p>
                </div>
                {!familyModeEnabled && (
                  <div className="w-2 h-2 rounded-full bg-olive-500" />
                )}
              </button>

              {/* Divider */}
              <div className="my-1 border-t border-sand-100" />

              {/* Family Options */}
              <div className="px-3 py-1">
                <p className="text-xs font-medium text-sand-400 uppercase tracking-wide">
                  Families
                </p>
              </div>

              {myFamilies.map((family) => (
                <button
                  key={family.id}
                  onClick={() => handleSelectFamily(family.id)}
                  className={`
                    flex items-center gap-3 w-full px-4 py-3
                    text-left transition-colors
                    ${familyModeEnabled && activeFamily?.id === family.id
                      ? 'bg-olive-50 text-olive-700'
                      : 'text-sand-700 hover:bg-sand-50'
                    }
                  `}
                >
                  <IconUsers size={20} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{family.name}</p>
                    <p className="text-xs text-sand-500">
                      {family.memberCount} member{family.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {familyModeEnabled && activeFamily?.id === family.id && (
                    <div className="w-2 h-2 rounded-full bg-olive-500" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
