'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IconUser,
  IconCrown,
  IconShield,
  IconThumbUp,
  IconEye,
  IconDotsVertical,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
  IconEdit,
} from '@tabler/icons-react';
import { Badge, Button } from '@/components/ui';
import {
  ROLE_LABELS,
  ROLE_COLORS,
  type FamilyMemberWithProfile,
  type FamilyRole,
  type FamilyPermissions,
} from '@/types/family';
import { cardVariants, SPRING } from '@/lib/constants/animations';

interface FamilyMemberCardProps {
  member: FamilyMemberWithProfile;
  currentUserId: string;
  isOwner: boolean;
  permissions: FamilyPermissions | null;
  onUpdateRole?: (memberId: string, newRole: FamilyRole) => void;
  onRemove?: (memberId: string) => void;
  onEditNickname?: (memberId: string, nickname: string) => void;
}

const roleIcons: Record<FamilyRole, React.ElementType> = {
  owner: IconCrown,
  admin: IconShield,
  voter: IconThumbUp,
  viewer: IconEye,
};

export function FamilyMemberCard({
  member,
  currentUserId,
  isOwner,
  permissions,
  onUpdateRole,
  onRemove,
  onEditNickname,
}: FamilyMemberCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(member.nickname || '');

  const isCurrentUser = member.userId === currentUserId;
  const isMemberOwner = member.role === 'owner';
  const RoleIcon = roleIcons[member.role];

  const displayName = member.nickname || member.profile.displayName || member.profile.email;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const canManageThisMember =
    permissions?.canManageMembers &&
    !isMemberOwner &&
    !isCurrentUser &&
    // Admins can't manage other admins
    !(member.role === 'admin' && !isOwner);

  const canChangeNickname = isCurrentUser || permissions?.canManageMembers;

  const getRoleBadgeVariant = (role: FamilyRole): 'olive' | 'aegean' | 'terracotta' | 'sand' => {
    return ROLE_COLORS[role] as 'olive' | 'aegean' | 'terracotta' | 'sand';
  };

  const handleSaveNickname = () => {
    if (onEditNickname && nickname !== member.nickname) {
      onEditNickname(member.id, nickname);
    }
    setIsEditing(false);
  };

  const availableRoles: FamilyRole[] = isOwner
    ? ['admin', 'voter', 'viewer']
    : ['voter', 'viewer'];

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      className="
        flex items-center justify-between gap-4 p-4
        bg-white rounded-xl border border-sand-200
        hover:border-sand-300 transition-colors
      "
    >
      {/* Avatar & Info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        {member.profile.avatarUrl ? (
          <img
            src={member.profile.avatarUrl}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="
            w-10 h-10 rounded-full
            bg-olive-100 text-olive-700
            flex items-center justify-center
            font-medium text-sm
          ">
            {initials}
          </div>
        )}

        {/* Name & Email */}
        <div className="min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Nickname"
                className="
                  px-2 py-1 text-sm rounded-lg
                  border border-olive-300 focus:border-olive-500
                  focus:outline-none focus:ring-2 focus:ring-olive-500/20
                "
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveNickname();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <Button size="sm" variant="primary" onClick={handleSaveNickname}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <p className="font-medium text-olive-900 truncate">
                  {displayName}
                </p>
                {isCurrentUser && (
                  <span className="text-xs text-sand-500">(you)</span>
                )}
                {canChangeNickname && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sand-400 hover:text-olive-600 transition-colors"
                    title="Edit nickname"
                  >
                    <IconEdit size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm text-sand-500 truncate">
                {member.profile.email}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Role & Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Role Badge */}
        <Badge variant={getRoleBadgeVariant(member.role)} size="md">
          <RoleIcon size={14} className="mr-1" />
          {ROLE_LABELS[member.role]}
        </Badge>

        {/* Actions Menu */}
        {canManageThisMember && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="
                p-2 rounded-lg text-sand-400
                hover:bg-sand-100 hover:text-sand-600
                transition-colors
              "
            >
              <IconDotsVertical size={18} />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={SPRING.gentle}
                  className="
                    absolute right-0 top-full mt-1 z-20
                    bg-white rounded-lg shadow-lg border border-sand-200
                    min-w-[160px] py-1
                  "
                >
                  {/* Role Change Options */}
                  {onUpdateRole && (
                    <>
                      <p className="px-3 py-1.5 text-xs text-sand-500 font-medium">
                        Change Role
                      </p>
                      {availableRoles.map((role) => (
                        <button
                          key={role}
                          onClick={() => {
                            onUpdateRole(member.id, role);
                            setShowMenu(false);
                          }}
                          disabled={role === member.role}
                          className={`
                            flex items-center gap-2 w-full px-3 py-2 text-sm
                            hover:bg-sand-50 transition-colors
                            ${role === member.role ? 'text-sand-400' : 'text-olive-900'}
                          `}
                        >
                          {role === member.role ? (
                            <IconArrowUp size={14} className="opacity-0" />
                          ) : availableRoles.indexOf(role) < availableRoles.indexOf(member.role) ? (
                            <IconArrowUp size={14} className="text-olive-500" />
                          ) : (
                            <IconArrowDown size={14} className="text-sand-400" />
                          )}
                          {ROLE_LABELS[role]}
                        </button>
                      ))}
                      <div className="border-t border-sand-200 my-1" />
                    </>
                  )}

                  {/* Remove Option */}
                  {onRemove && (
                    <button
                      onClick={() => {
                        onRemove(member.id);
                        setShowMenu(false);
                      }}
                      className="
                        flex items-center gap-2 w-full px-3 py-2 text-sm
                        text-terracotta-600 hover:bg-terracotta-50 transition-colors
                      "
                    >
                      <IconTrash size={14} />
                      Remove from family
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
