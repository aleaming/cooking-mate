'use client';

import { motion } from 'framer-motion';
import { IconUsers, IconUserPlus } from '@tabler/icons-react';
import { FamilyMemberCard } from './FamilyMemberCard';
import { Button, Skeleton } from '@/components/ui';
import { staggerContainer, staggerItem } from '@/lib/constants/animations';
import type {
  FamilyMemberWithProfile,
  FamilyPermissions,
  FamilyRole,
} from '@/types/family';

interface FamilyMemberListProps {
  members: FamilyMemberWithProfile[];
  currentUserId: string;
  ownerId: string;
  permissions: FamilyPermissions | null;
  maxMembers: number;
  isLoading?: boolean;
  onInvite?: () => void;
  onUpdateRole?: (memberId: string, newRole: FamilyRole) => void;
  onRemove?: (memberId: string) => void;
  onEditNickname?: (memberId: string, nickname: string) => void;
}

export function FamilyMemberList({
  members,
  currentUserId,
  ownerId,
  permissions,
  maxMembers,
  isLoading = false,
  onInvite,
  onUpdateRole,
  onRemove,
  onEditNickname,
}: FamilyMemberListProps) {
  const isOwner = currentUserId === ownerId;
  const canInvite = permissions?.canInvite && members.length < maxMembers;
  const spotsRemaining = maxMembers - members.length;

  // Sort members: owner first, then admins, voters, viewers
  const roleOrder: Record<FamilyRole, number> = {
    owner: 0,
    admin: 1,
    voter: 2,
    viewer: 3,
  };

  const sortedMembers = [...members].sort((a, b) => {
    // Current user always at top after owner
    if (a.userId === currentUserId && a.role !== 'owner') return -1;
    if (b.userId === currentUserId && b.role !== 'owner') return 1;
    return roleOrder[a.role] - roleOrder[b.role];
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconUsers size={20} className="text-olive-600" />
          <h3 className="font-display text-lg font-semibold text-olive-900">
            Family Members
          </h3>
          <span className="text-sm text-sand-500">
            ({members.length}/{maxMembers})
          </span>
        </div>

        {canInvite && onInvite && (
          <Button
            variant="outline"
            size="sm"
            onClick={onInvite}
            className="gap-2"
          >
            <IconUserPlus size={16} />
            Invite
          </Button>
        )}
      </div>

      {/* Members List */}
      {members.length > 0 ? (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {sortedMembers.map((member) => (
            <motion.div key={member.id} variants={staggerItem}>
              <FamilyMemberCard
                member={member}
                currentUserId={currentUserId}
                isOwner={isOwner}
                permissions={permissions}
                onUpdateRole={onUpdateRole}
                onRemove={onRemove}
                onEditNickname={onEditNickname}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="
          py-8 px-4 rounded-xl
          bg-sand-50 border border-dashed border-sand-300
          text-center
        ">
          <IconUsers size={32} className="mx-auto mb-2 text-sand-400" />
          <p className="text-sand-600">No members yet</p>
          {canInvite && (
            <p className="text-sm text-sand-500 mt-1">
              Invite family members to get started
            </p>
          )}
        </div>
      )}

      {/* Spots Remaining */}
      {spotsRemaining > 0 && spotsRemaining < maxMembers && (
        <p className="text-sm text-sand-500 text-center">
          {spotsRemaining} spot{spotsRemaining !== 1 ? 's' : ''} remaining
        </p>
      )}

      {/* Max Members Reached */}
      {spotsRemaining === 0 && (
        <div className="
          p-3 rounded-lg
          bg-amber-50 border border-amber-200
          text-center text-sm text-amber-700
        ">
          Family has reached maximum members ({maxMembers})
        </div>
      )}
    </div>
  );
}
