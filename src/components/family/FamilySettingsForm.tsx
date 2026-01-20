'use client';

import { useState } from 'react';
import { IconHome, IconUsers, IconCheck } from '@tabler/icons-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { updateFamily } from '@/lib/actions/family';
import type { FamilyWithDetails } from '@/types/family';

interface FamilySettingsFormProps {
  family: FamilyWithDetails;
  canEdit: boolean;
  onUpdate?: (updatedFamily: FamilyWithDetails) => void;
}

export function FamilySettingsForm({
  family,
  canEdit,
  onUpdate,
}: FamilySettingsFormProps) {
  const [name, setName] = useState(family.name);
  const [maxMembers, setMaxMembers] = useState(family.maxMembers);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = name !== family.name || maxMembers !== family.maxMembers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name.trim()) {
      setError('Family name is required');
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

    if (maxMembers < family.memberCount) {
      setError(`Max members cannot be less than current member count (${family.memberCount})`);
      return;
    }

    if (maxMembers < 2 || maxMembers > 20) {
      setError('Max members must be between 2 and 20');
      return;
    }

    setIsSaving(true);

    const result = await updateFamily(family.id, {
      name: name.trim(),
      maxMembers,
    });

    setIsSaving(false);

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onUpdate?.({
        ...family,
        name: result.data.name,
        maxMembers: result.data.maxMembers,
      });
    }
  };

  const handleReset = () => {
    setName(family.name);
    setMaxMembers(family.maxMembers);
    setError('');
    setSuccess(false);
  };

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Family Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Family Name */}
          <Input
            label="Family Name"
            placeholder="e.g., The Johnsons"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
              setSuccess(false);
            }}
            leftIcon={<IconHome size={18} />}
            disabled={!canEdit || isSaving}
            error={error && error.includes('name') ? error : undefined}
          />

          {/* Max Members */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-olive-900">
              Maximum Members
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMaxMembers(Math.max(family.memberCount, maxMembers - 1))}
                  disabled={!canEdit || isSaving || maxMembers <= family.memberCount}
                  className="
                    w-10 h-10 rounded-lg
                    bg-sand-100 text-sand-600
                    hover:bg-sand-200 hover:text-olive-700
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors
                    flex items-center justify-center
                    font-bold text-lg
                  "
                >
                  -
                </button>
                <div className="
                  w-16 h-10 rounded-lg
                  bg-sand-50 border border-sand-200
                  flex items-center justify-center
                  font-medium text-olive-900
                ">
                  {maxMembers}
                </div>
                <button
                  type="button"
                  onClick={() => setMaxMembers(Math.min(20, maxMembers + 1))}
                  disabled={!canEdit || isSaving || maxMembers >= 20}
                  className="
                    w-10 h-10 rounded-lg
                    bg-sand-100 text-sand-600
                    hover:bg-sand-200 hover:text-olive-700
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors
                    flex items-center justify-center
                    font-bold text-lg
                  "
                >
                  +
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-sand-500">
                <IconUsers size={16} />
                <span>{family.memberCount} current</span>
              </div>
            </div>
            <p className="text-sm text-sand-500">
              Set the maximum number of members allowed in your family (2-20)
            </p>
          </div>

          {/* Error Message */}
          {error && !error.includes('name') && (
            <div className="
              p-3 rounded-lg
              bg-red-50 border border-red-200
              text-sm text-red-700
            ">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="
              p-3 rounded-lg
              bg-olive-50 border border-olive-200
              text-sm text-olive-700
              flex items-center gap-2
            ">
              <IconCheck size={16} />
              Settings saved successfully
            </div>
          )}

          {/* Actions */}
          {canEdit && (
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges || isSaving}
                className="flex-1"
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!hasChanges || isSaving}
                className="flex-1"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}

          {!canEdit && (
            <p className="text-sm text-sand-500 text-center py-2">
              Only family owners and admins can edit settings
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
