'use client';

import { useState } from 'react';
import { IconUsers, IconHome } from '@tabler/icons-react';
import { Modal, Button, Input } from '@/components/ui';
import { useFamilyStore } from '@/stores/useFamilyStore';

interface CreateFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (familyId: string) => void;
}

export function CreateFamilyModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateFamilyModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { createFamily, isSyncing } = useFamilyStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a family name');
      return;
    }

    if (name.trim().length < 2) {
      setError('Family name must be at least 2 characters');
      return;
    }

    if (name.trim().length > 50) {
      setError('Family name must be less than 50 characters');
      return;
    }

    const result = await createFamily(name.trim());

    if (result.success && result.familyId) {
      setName('');
      onSuccess?.(result.familyId);
      onClose();
    } else {
      setError(result.error || 'Failed to create family');
    }
  };

  const handleClose = () => {
    setName('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create a Family">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="
            p-4 rounded-full
            bg-olive-100 text-olive-600
          ">
            <IconUsers size={32} />
          </div>
        </div>

        {/* Description */}
        <p className="text-center text-sand-600">
          Create a family to share meal plans and collaborate with your household.
        </p>

        {/* Family Name Input */}
        <Input
          label="Family Name"
          placeholder="e.g., The Johnsons, Our Home"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          error={error}
          leftIcon={<IconHome size={18} />}
          autoFocus
          disabled={isSyncing}
        />

        {/* Info */}
        <div className="
          p-3 rounded-lg
          bg-sand-50 border border-sand-200
          text-sm text-sand-600
        ">
          <p className="font-medium text-olive-900 mb-1">What happens next:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>You&apos;ll become the family owner</li>
            <li>You can invite up to 5 members</li>
            <li>Plan meals together and vote on proposals</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSyncing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSyncing || !name.trim()}
            className="flex-1"
          >
            {isSyncing ? 'Creating...' : 'Create Family'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
