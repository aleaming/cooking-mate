'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IconMail,
  IconClock,
  IconCheck,
  IconX,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react';
import { Badge, Button } from '@/components/ui';
import { cardVariants } from '@/lib/constants/animations';
import {
  ROLE_LABELS,
  ROLE_COLORS,
  type FamilyRole,
  type FamilyInvitationWithDetails,
} from '@/types/family';

interface InvitationCardProps {
  invitation: FamilyInvitationWithDetails;
  /** 'sent' for invitations you sent, 'received' for invitations sent to you */
  type: 'sent' | 'received';
  onAccept?: (invitationId: string) => Promise<void>;
  onDecline?: (invitationId: string) => Promise<void>;
  onRevoke?: (invitationId: string) => Promise<void>;
  onResend?: (invitationId: string) => Promise<void>;
}

export function InvitationCard({
  invitation,
  type,
  onAccept,
  onDecline,
  onRevoke,
  onResend,
}: InvitationCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<string | null>(null);

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const isPending = invitation.status === 'pending';

  const getRoleBadgeVariant = (role: FamilyRole): 'olive' | 'aegean' | 'terracotta' | 'sand' => {
    return ROLE_COLORS[role] as 'olive' | 'aegean' | 'terracotta' | 'sand';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const expires = new Date(invitation.expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} left`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} left`;
    return 'Expires soon';
  };

  const handleAction = async (
    action: 'accept' | 'decline' | 'revoke' | 'resend',
    handler?: (id: string) => Promise<void>
  ) => {
    if (!handler) return;

    setIsLoading(true);
    setActionType(action);

    try {
      await handler(invitation.id);
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      className={`
        p-4 rounded-xl border
        ${isExpired
          ? 'bg-sand-50 border-sand-200 opacity-60'
          : 'bg-white border-sand-200'
        }
      `}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Icon & Info */}
        <div className="flex items-start gap-3 min-w-0">
          <div className={`
            p-2 rounded-lg flex-shrink-0
            ${type === 'received' ? 'bg-olive-100 text-olive-600' : 'bg-sand-100 text-sand-600'}
          `}>
            <IconMail size={20} />
          </div>

          <div className="min-w-0">
            {type === 'sent' ? (
              <>
                <p className="font-medium text-olive-900 truncate">
                  {invitation.email}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant={getRoleBadgeVariant(invitation.role)} size="sm">
                    {ROLE_LABELS[invitation.role]}
                  </Badge>
                  <span className="text-xs text-sand-500">
                    Sent {formatDate(invitation.createdAt)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="font-medium text-olive-900">
                  {invitation.family.name}
                </p>
                <p className="text-sm text-sand-600 truncate">
                  From {invitation.inviter.displayName || invitation.inviter.email}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant={getRoleBadgeVariant(invitation.role)} size="sm">
                    {ROLE_LABELS[invitation.role]}
                  </Badge>
                </div>
              </>
            )}

            {/* Expiry Status */}
            {isPending && (
              <div className={`
                flex items-center gap-1 mt-2 text-xs
                ${isExpired ? 'text-red-500' : 'text-sand-500'}
              `}>
                <IconClock size={12} />
                <span>{getTimeRemaining()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {type === 'received' && isPending && !isExpired && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAction('accept', onAccept)}
                disabled={isLoading}
                className="gap-1"
              >
                {isLoading && actionType === 'accept' ? (
                  'Joining...'
                ) : (
                  <>
                    <IconCheck size={14} />
                    Accept
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('decline', onDecline)}
                disabled={isLoading}
              >
                {isLoading && actionType === 'decline' ? (
                  '...'
                ) : (
                  <IconX size={14} />
                )}
              </Button>
            </>
          )}

          {type === 'sent' && isPending && (
            <>
              {isExpired ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('resend', onResend)}
                  disabled={isLoading}
                  className="gap-1"
                >
                  {isLoading && actionType === 'resend' ? (
                    '...'
                  ) : (
                    <>
                      <IconRefresh size={14} />
                      Resend
                    </>
                  )}
                </Button>
              ) : (
                <button
                  onClick={() => handleAction('revoke', onRevoke)}
                  disabled={isLoading}
                  className="
                    p-2 rounded-lg text-sand-400
                    hover:bg-red-50 hover:text-red-500
                    transition-colors disabled:opacity-50
                  "
                  title="Revoke invitation"
                >
                  {isLoading && actionType === 'revoke' ? (
                    <span className="animate-spin">...</span>
                  ) : (
                    <IconTrash size={16} />
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
