'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconArrowLeft, IconUsers, IconMail, IconTrash } from '@tabler/icons-react';
import { useAuth } from '@/providers/AuthProvider';
import { useFamilyStore } from '@/stores/useFamilyStore';
import { FamilySettingsForm, FamilyMemberList, InviteMemberModal } from '@/components/family';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Skeleton } from '@/components/ui';
import { getPendingInvitations, revokeInvitation } from '@/lib/actions/familyInvitations';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/constants/animations';
import { ROLE_LABELS, ROLE_COLORS, type FamilyRole, type FamilyInvitationWithDetails } from '@/types/family';
import { updateMemberRole, removeMember, updateMemberNickname } from '@/lib/actions/familyMembers';

export default function FamilySettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitations, setInvitations] = useState<FamilyInvitationWithDetails[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  const {
    activeFamily,
    activeFamilyMembers,
    familyModeEnabled,
    userRole,
    permissions,
    isLoadingMembers,
    fetchFamilyContext,
    fetchFamilyMembers,
  } = useFamilyStore();

  useEffect(() => {
    fetchFamilyContext();
  }, [fetchFamilyContext]);

  useEffect(() => {
    if (activeFamily) {
      fetchFamilyMembers(activeFamily.id);
      loadInvitations();
    }
  }, [activeFamily, fetchFamilyMembers]);

  const loadInvitations = async () => {
    if (!activeFamily || !permissions?.canInvite) return;

    setLoadingInvitations(true);
    const result = await getPendingInvitations(activeFamily.id);
    if (result.data) {
      setInvitations(result.data);
    }
    setLoadingInvitations(false);
  };

  const handleRoleChange = async (memberId: string, newRole: FamilyRole) => {
    const result = await updateMemberRole(memberId, newRole);
    if (!result.error && activeFamily) {
      await fetchFamilyMembers(activeFamily.id);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    const result = await removeMember(memberId);
    if (!result.error && activeFamily) {
      await fetchFamilyMembers(activeFamily.id);
    }
  };

  const handleNicknameChange = async (memberId: string, nickname: string) => {
    const result = await updateMemberNickname(memberId, nickname);
    if (!result.error && activeFamily) {
      await fetchFamilyMembers(activeFamily.id);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;
    const result = await revokeInvitation(invitationId);
    if (!result.error) {
      await loadInvitations();
    }
  };

  const getRoleBadgeVariant = (role: FamilyRole): 'olive' | 'aegean' | 'terracotta' | 'sand' => {
    return ROLE_COLORS[role] as 'olive' | 'aegean' | 'terracotta' | 'sand';
  };

  // Loading state
  if (authLoading) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-sand-50"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </motion.div>
    );
  }

  // Not logged in
  if (!user) {
    router.push('/family');
    return null;
  }

  // No active family
  if (!familyModeEnabled || !activeFamily) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-sand-50"
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="
            bg-white rounded-2xl shadow-lg shadow-sand-200/50
            p-8 text-center
          ">
            <div className="
              w-20 h-20 mx-auto mb-6 rounded-full
              bg-sand-100 text-sand-600
              flex items-center justify-center
            ">
              <IconUsers size={40} />
            </div>
            <h1 className="font-display text-2xl font-bold text-olive-900 mb-3">
              No Family Selected
            </h1>
            <p className="text-sand-600 mb-6">
              Please select or create a family to access settings.
            </p>
            <Link href="/family">
              <Button variant="primary">Go to Family</Button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-sand-50"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/family"
          className="
            inline-flex items-center gap-2 mb-6
            text-sand-600 hover:text-olive-700 transition-colors
          "
        >
          <IconArrowLeft size={20} />
          <span>Back to Family</span>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold text-olive-900 mb-2">
            Family Settings
          </h1>
          <p className="text-sand-600">
            Manage settings for <strong>{activeFamily.name}</strong>
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Settings Form */}
          <motion.div variants={staggerItem}>
            <FamilySettingsForm
              family={activeFamily}
              canEdit={permissions?.canUpdateSettings || false}
            />
          </motion.div>

          {/* Members Section */}
          <motion.div variants={staggerItem}>
            <Card padding="lg">
              <FamilyMemberList
                members={activeFamilyMembers}
                currentUserId={user.id}
                ownerId={activeFamily.ownerId}
                permissions={permissions}
                maxMembers={activeFamily.maxMembers}
                isLoading={isLoadingMembers}
                onInvite={() => setShowInviteModal(true)}
                onUpdateRole={permissions?.canManageMembers ? handleRoleChange : undefined}
                onRemove={permissions?.canManageMembers ? handleRemoveMember : undefined}
                onEditNickname={handleNicknameChange}
              />
            </Card>
          </motion.div>

          {/* Pending Invitations */}
          {permissions?.canInvite && (
            <motion.div variants={staggerItem}>
              <Card padding="lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <IconMail size={20} className="text-olive-600" />
                    <CardTitle>Pending Invitations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingInvitations ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full rounded-lg" />
                      <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                  ) : invitations.length === 0 ? (
                    <div className="
                      py-8 text-center
                      text-sand-500
                    ">
                      <IconMail size={32} className="mx-auto mb-2 text-sand-400" />
                      <p>No pending invitations</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {invitations.map((invitation) => (
                        <div
                          key={invitation.id}
                          className="
                            flex items-center justify-between gap-4 p-4
                            bg-sand-50 rounded-xl
                          "
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-olive-900 truncate">
                              {invitation.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getRoleBadgeVariant(invitation.role)} size="sm">
                                {ROLE_LABELS[invitation.role]}
                              </Badge>
                              <span className="text-xs text-sand-500">
                                Sent {new Date(invitation.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRevokeInvitation(invitation.id)}
                            className="
                              p-2 rounded-lg text-terracotta-500
                              hover:bg-terracotta-50 transition-colors
                            "
                            title="Revoke invitation"
                          >
                            <IconTrash size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Invite Modal */}
        <InviteMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          familyId={activeFamily.id}
          familyName={activeFamily.name}
          onSuccess={() => {
            setShowInviteModal(false);
            loadInvitations();
          }}
        />
      </div>
    </motion.div>
  );
}
