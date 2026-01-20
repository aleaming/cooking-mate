'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  IconUsers,
  IconSettings,
  IconCalendar,
  IconMail,
  IconUserPlus,
  IconDoorExit,
  IconTrash,
} from '@tabler/icons-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { FamilyMemberList } from './FamilyMemberList';
import { FamilySelector } from './FamilySelector';
import { CreateFamilyModal } from './CreateFamilyModal';
import { InviteMemberModal } from './InviteMemberModal';
import { PendingInvitationsPanel } from './PendingInvitationsPanel';
import { useFamilyStore } from '@/stores/useFamilyStore';
import { updateMemberRole, removeMember, updateMemberNickname } from '@/lib/actions/familyMembers';
import { ROLE_LABELS, ROLE_COLORS, type FamilyRole } from '@/types/family';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/constants/animations';

interface FamilyDashboardProps {
  userId: string;
}

export function FamilyDashboard({ userId }: FamilyDashboardProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    myFamilies,
    activeFamily,
    activeFamilyMembers,
    familyModeEnabled,
    userRole,
    permissions,
    isLoading,
    isLoadingFamilies,
    isLoadingMembers,
    isSyncing,
    error,
    fetchMyFamilies,
    fetchFamilyContext,
    fetchFamilyMembers,
    leaveFamily,
    deleteFamily,
    setActiveFamily,
    clearError,
  } = useFamilyStore();

  useEffect(() => {
    fetchMyFamilies();
    fetchFamilyContext();
  }, [fetchMyFamilies, fetchFamilyContext]);

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

  const handleLeaveFamily = async () => {
    if (!activeFamily) return;
    const result = await leaveFamily(activeFamily.id);
    if (result.success) {
      setConfirmLeave(false);
    }
  };

  const handleDeleteFamily = async () => {
    if (!activeFamily) return;
    const result = await deleteFamily(activeFamily.id);
    if (result.success) {
      setConfirmDelete(false);
    }
  };

  const handleFamilyCreated = async (familyId: string) => {
    await setActiveFamily(familyId);
    await fetchFamilyMembers(familyId);
  };

  const getRoleBadgeVariant = (role: FamilyRole): 'olive' | 'aegean' | 'terracotta' | 'sand' => {
    return ROLE_COLORS[role] as 'olive' | 'aegean' | 'terracotta' | 'sand';
  };

  // No families state
  if (!isLoadingFamilies && myFamilies.length === 0) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        className="max-w-2xl mx-auto"
      >
        <Card padding="lg" className="text-center">
          <div className="py-8">
            <div className="
              w-20 h-20 mx-auto mb-6 rounded-full
              bg-olive-100 text-olive-600
              flex items-center justify-center
            ">
              <IconUsers size={40} />
            </div>
            <h2 className="font-display text-2xl font-bold text-olive-900 mb-3">
              Welcome to Family Mode
            </h2>
            <p className="text-sand-600 mb-6 max-w-md mx-auto">
              Create a family to share meal plans, coordinate cooking, and vote on meals together
              with your household.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowCreateModal(true)}
              className="gap-2"
            >
              <IconUsers size={20} />
              Create Your Family
            </Button>
          </div>
        </Card>

        <CreateFamilyModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleFamilyCreated}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Error Alert */}
      {error && (
        <div className="
          p-4 rounded-xl
          bg-red-50 border border-red-200
          flex items-center justify-between
        ">
          <p className="text-red-700">{error}</p>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pending Invitations */}
      <PendingInvitationsPanel onAccepted={() => fetchMyFamilies()} />

      {/* Family Selector */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Select Family</CardTitle>
        </CardHeader>
        <CardContent>
          <FamilySelector onCreateFamily={() => setShowCreateModal(true)} />
        </CardContent>
      </Card>

      {/* Active Family Details */}
      {familyModeEnabled && activeFamily && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid lg:grid-cols-3 gap-6"
        >
          {/* Main Content - Members */}
          <motion.div variants={staggerItem} className="lg:col-span-2">
            <Card padding="lg">
              <FamilyMemberList
                members={activeFamilyMembers}
                currentUserId={userId}
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

          {/* Sidebar */}
          <motion.div variants={staggerItem} className="space-y-4">
            {/* Family Info */}
            <Card padding="md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-olive-100 text-olive-600">
                  <IconUsers size={24} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-olive-900">
                    {activeFamily.name}
                  </h3>
                  <p className="text-sm text-sand-500">
                    {activeFamilyMembers.length} member{activeFamilyMembers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {userRole && (
                <div className="flex items-center gap-2 text-sm text-sand-600">
                  <span>Your role:</span>
                  <Badge variant={getRoleBadgeVariant(userRole)}>
                    {ROLE_LABELS[userRole]}
                  </Badge>
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card padding="md">
              <h4 className="font-medium text-olive-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <Link
                  href="/calendar"
                  className="
                    flex items-center gap-3 w-full p-3 rounded-lg
                    text-sand-700 hover:bg-sand-50 transition-colors
                  "
                >
                  <IconCalendar size={20} className="text-olive-500" />
                  <span>View Family Calendar</span>
                </Link>

                {permissions?.canInvite && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="
                      flex items-center gap-3 w-full p-3 rounded-lg
                      text-sand-700 hover:bg-sand-50 transition-colors
                    "
                  >
                    <IconUserPlus size={20} className="text-olive-500" />
                    <span>Invite Member</span>
                  </button>
                )}

                {permissions?.canUpdateSettings && (
                  <Link
                    href={`/family/settings`}
                    className="
                      flex items-center gap-3 w-full p-3 rounded-lg
                      text-sand-700 hover:bg-sand-50 transition-colors
                    "
                  >
                    <IconSettings size={20} className="text-olive-500" />
                    <span>Family Settings</span>
                  </Link>
                )}
              </div>
            </Card>

            {/* Danger Zone */}
            <Card padding="md">
              <h4 className="font-medium text-terracotta-700 mb-3">Danger Zone</h4>
              <div className="space-y-2">
                {userRole !== 'owner' && (
                  <button
                    onClick={() => setConfirmLeave(true)}
                    disabled={isSyncing}
                    className="
                      flex items-center gap-3 w-full p-3 rounded-lg
                      text-terracotta-600 hover:bg-terracotta-50 transition-colors
                      disabled:opacity-50
                    "
                  >
                    <IconDoorExit size={20} />
                    <span>Leave Family</span>
                  </button>
                )}

                {permissions?.canDeleteFamily && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={isSyncing}
                    className="
                      flex items-center gap-3 w-full p-3 rounded-lg
                      text-red-600 hover:bg-red-50 transition-colors
                      disabled:opacity-50
                    "
                  >
                    <IconTrash size={20} />
                    <span>Delete Family</span>
                  </button>
                )}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Modals */}
      <CreateFamilyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleFamilyCreated}
      />

      {activeFamily && (
        <InviteMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          familyId={activeFamily.id}
          familyName={activeFamily.name}
          onSuccess={() => {
            setShowInviteModal(false);
          }}
        />
      )}

      {/* Leave Confirmation */}
      {confirmLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card padding="lg" className="max-w-md mx-4">
            <h3 className="font-display text-xl font-semibold text-olive-900 mb-3">
              Leave Family?
            </h3>
            <p className="text-sand-600 mb-6">
              Are you sure you want to leave <strong>{activeFamily?.name}</strong>?
              You&apos;ll need a new invitation to rejoin.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmLeave(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleLeaveFamily}
                disabled={isSyncing}
                className="flex-1 bg-terracotta-500 hover:bg-terracotta-600"
              >
                Leave Family
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card padding="lg" className="max-w-md mx-4">
            <h3 className="font-display text-xl font-semibold text-red-700 mb-3">
              Delete Family?
            </h3>
            <p className="text-sand-600 mb-6">
              This will permanently delete <strong>{activeFamily?.name}</strong> and remove
              all members. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmDelete(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteFamily}
                disabled={isSyncing}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Delete Forever
              </Button>
            </div>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
