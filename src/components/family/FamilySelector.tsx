'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconUsers, IconChevronDown, IconCheck, IconPlus, IconUserOff } from '@tabler/icons-react';
import { useFamilyStore } from '@/stores/useFamilyStore';
import { Badge } from '@/components/ui';
import { ROLE_COLORS, type FamilyRole } from '@/types/family';
import { fadeIn, SPRING } from '@/lib/constants/animations';

interface FamilySelectorProps {
  onCreateFamily?: () => void;
  compact?: boolean;
}

export function FamilySelector({ onCreateFamily, compact = false }: FamilySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    myFamilies,
    activeFamily,
    familyModeEnabled,
    userRole,
    fetchMyFamilies,
    setActiveFamily,
    isLoadingFamilies,
  } = useFamilyStore();

  useEffect(() => {
    fetchMyFamilies();
  }, [fetchMyFamilies]);

  const handleSelectFamily = async (familyId: string | null) => {
    await setActiveFamily(familyId);
    setIsOpen(false);
  };

  const getRoleBadgeVariant = (role: FamilyRole): 'olive' | 'aegean' | 'terracotta' | 'sand' => {
    return ROLE_COLORS[role] as 'olive' | 'aegean' | 'terracotta' | 'sand';
  };

  if (compact) {
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-xl
          transition-colors
          ${familyModeEnabled
            ? 'bg-olive-100 text-olive-700 hover:bg-olive-200'
            : 'bg-sand-100 text-sand-700 hover:bg-sand-200'
          }
        `}
      >
        <IconUsers size={18} />
        {familyModeEnabled && activeFamily ? (
          <span className="text-sm font-medium truncate max-w-[100px]">
            {activeFamily.name}
          </span>
        ) : (
          <span className="text-sm font-medium">Personal</span>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoadingFamilies}
        className={`
          flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl
          border-2 transition-all
          ${familyModeEnabled
            ? 'border-olive-300 bg-olive-50 hover:border-olive-400'
            : 'border-sand-300 bg-white hover:border-sand-400'
          }
          ${isOpen ? 'ring-2 ring-olive-500/20' : ''}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`
            p-2 rounded-lg
            ${familyModeEnabled ? 'bg-olive-500 text-white' : 'bg-sand-200 text-sand-600'}
          `}>
            {familyModeEnabled ? <IconUsers size={20} /> : <IconUserOff size={20} />}
          </div>
          <div className="text-left">
            <p className="text-sm text-sand-500">
              {familyModeEnabled ? 'Family Mode' : 'Personal Mode'}
            </p>
            <p className="font-medium text-olive-900">
              {familyModeEnabled && activeFamily ? activeFamily.name : 'Just Me'}
            </p>
          </div>
          {familyModeEnabled && userRole && (
            <Badge variant={getRoleBadgeVariant(userRole)} size="sm">
              {userRole}
            </Badge>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={SPRING.gentle}
        >
          <IconChevronDown size={20} className="text-sand-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-10"
            />

            {/* Dropdown */}
            <motion.div
              variants={fadeIn}
              initial="initial"
              animate="animate"
              exit="exit"
              className="
                absolute z-20 top-full left-0 right-0 mt-2
                bg-white rounded-xl shadow-xl border border-sand-200
                overflow-hidden
              "
            >
              {/* Personal Mode Option */}
              <button
                onClick={() => handleSelectFamily(null)}
                className={`
                  flex items-center justify-between w-full px-4 py-3
                  hover:bg-sand-50 transition-colors
                  ${!familyModeEnabled ? 'bg-sand-100' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-sand-200 text-sand-600">
                    <IconUserOff size={18} />
                  </div>
                  <span className="font-medium text-olive-900">Personal Mode</span>
                </div>
                {!familyModeEnabled && (
                  <IconCheck size={18} className="text-olive-500" />
                )}
              </button>

              {/* Divider */}
              {myFamilies.length > 0 && (
                <div className="border-t border-sand-200" />
              )}

              {/* Family Options */}
              {myFamilies.map((family) => (
                <button
                  key={family.id}
                  onClick={() => handleSelectFamily(family.id)}
                  className={`
                    flex items-center justify-between w-full px-4 py-3
                    hover:bg-sand-50 transition-colors
                    ${activeFamily?.id === family.id && familyModeEnabled ? 'bg-olive-50' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-olive-100 text-olive-600">
                      <IconUsers size={18} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-olive-900">{family.name}</p>
                      <p className="text-xs text-sand-500">
                        {family.memberCount} member{family.memberCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {activeFamily?.id === family.id && familyModeEnabled && (
                    <IconCheck size={18} className="text-olive-500" />
                  )}
                </button>
              ))}

              {/* Create Family Option */}
              {onCreateFamily && (
                <>
                  <div className="border-t border-sand-200" />
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onCreateFamily();
                    }}
                    className="
                      flex items-center gap-3 w-full px-4 py-3
                      text-olive-600 hover:bg-olive-50 transition-colors
                    "
                  >
                    <div className="p-1.5 rounded-lg bg-olive-100">
                      <IconPlus size={18} />
                    </div>
                    <span className="font-medium">Create New Family</span>
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
