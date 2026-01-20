'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconMail, IconMailOpened } from '@tabler/icons-react';
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from '@/components/ui';
import { InvitationCard } from './InvitationCard';
import { getMyPendingInvitations, acceptInvitation } from '@/lib/actions/familyInvitations';
import { useFamilyStore } from '@/stores/useFamilyStore';
import { staggerContainer, staggerItem } from '@/lib/constants/animations';
import type { FamilyInvitationWithDetails } from '@/types/family';

interface PendingInvitationsPanelProps {
  onAccepted?: () => void;
}

export function PendingInvitationsPanel({ onAccepted }: PendingInvitationsPanelProps) {
  const [invitations, setInvitations] = useState<FamilyInvitationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { fetchMyFamilies, setActiveFamily } = useFamilyStore();

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setIsLoading(true);
    const result = await getMyPendingInvitations();
    if (result.data) {
      // Filter out expired invitations
      const validInvitations = result.data.filter(
        (inv) => new Date(inv.expiresAt) > new Date()
      );
      setInvitations(validInvitations);
    }
    setIsLoading(false);
  };

  const handleAccept = async (invitationId: string) => {
    const invitation = invitations.find((inv) => inv.id === invitationId);
    if (!invitation) return;

    const result = await acceptInvitation(invitation.token);

    if (result.error) {
      console.error('Failed to accept invitation:', result.error);
      return;
    }

    if (result.data) {
      // Remove from list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

      // Refresh families and set active
      await fetchMyFamilies();
      await setActiveFamily(result.data.familyId);

      onAccepted?.();
    }
  };

  const handleDecline = async (invitationId: string) => {
    // For now, just remove from local list
    // In a full implementation, we might call an API to formally decline
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
  };

  if (isLoading) {
    return (
      <Card padding="lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconMail size={20} className="text-olive-600" />
            <CardTitle>Pending Invitations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return null; // Don't show panel if no invitations
  }

  return (
    <Card padding="lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconMail size={20} className="text-olive-600" />
            <span className="
              absolute -top-1 -right-1 w-2 h-2
              bg-terracotta-500 rounded-full
            " />
          </div>
          <CardTitle>Pending Invitations</CardTitle>
          <span className="
            ml-auto px-2 py-0.5 rounded-full
            bg-terracotta-100 text-terracotta-700
            text-xs font-medium
          ">
            {invitations.length}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {invitations.map((invitation) => (
              <motion.div
                key={invitation.id}
                variants={staggerItem}
                exit={{ opacity: 0, x: -20 }}
                layout
              >
                <InvitationCard
                  invitation={invitation}
                  type="received"
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {invitations.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center"
          >
            <IconMailOpened size={32} className="mx-auto mb-2 text-sand-400" />
            <p className="text-sand-500">All caught up!</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
