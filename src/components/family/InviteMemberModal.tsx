'use client';

import { useState } from 'react';
import { IconMail, IconUserPlus, IconCopy, IconCheck } from '@tabler/icons-react';
import { Modal, Button, Input, Badge } from '@/components/ui';
import { sendInvitation } from '@/lib/actions/familyInvitations';
import {
  FamilyRole,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
} from '@/types/family';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  familyName: string;
  onSuccess?: () => void;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  familyId,
  familyName,
  onSuccess,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<FamilyRole>('voter');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const availableRoles: FamilyRole[] = ['admin', 'voter', 'viewer'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    const result = await sendInvitation({
      familyId,
      email: email.trim(),
      role,
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setInviteToken(result.data.token);
    }
  };

  const getInviteUrl = () => {
    if (typeof window !== 'undefined' && inviteToken) {
      return `${window.location.origin}/family/join/${inviteToken}`;
    }
    return '';
  };

  const handleCopyLink = async () => {
    const url = getInviteUrl();
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('voter');
    setError('');
    setInviteToken(null);
    setCopied(false);
    onClose();
    if (inviteToken) {
      onSuccess?.();
    }
  };

  const handleSendAnother = () => {
    setEmail('');
    setRole('voter');
    setError('');
    setInviteToken(null);
    setCopied(false);
  };

  const getRoleBadgeVariant = (r: FamilyRole): 'olive' | 'aegean' | 'terracotta' | 'sand' => {
    return ROLE_COLORS[r] as 'olive' | 'aegean' | 'terracotta' | 'sand';
  };

  // Success state - show invite link
  if (inviteToken) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Invitation Sent">
        <div className="space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-olive-100 text-olive-600">
              <IconCheck size={32} />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center">
            <p className="text-olive-900 font-medium mb-1">
              Invitation created for {email}
            </p>
            <p className="text-sand-600 text-sm">
              Share the link below to invite them to join <strong>{familyName}</strong> as a{' '}
              <Badge variant={getRoleBadgeVariant(role)} size="sm">
                {ROLE_LABELS[role]}
              </Badge>
            </p>
          </div>

          {/* Invite Link */}
          <div className="space-y-2">
            <p className="text-sm text-sand-600">
              Or share this link directly:
            </p>
            <div className="
              flex items-center gap-2 p-3 rounded-lg
              bg-sand-50 border border-sand-200
            ">
              <input
                type="text"
                value={getInviteUrl()}
                readOnly
                className="
                  flex-1 text-sm text-sand-700 bg-transparent
                  outline-none truncate
                "
              />
              <button
                onClick={handleCopyLink}
                className="
                  p-2 rounded-lg text-sand-500
                  hover:bg-sand-200 hover:text-olive-700
                  transition-colors
                "
                title="Copy link"
              >
                {copied ? (
                  <IconCheck size={18} className="text-olive-500" />
                ) : (
                  <IconCopy size={18} />
                )}
              </button>
            </div>
            <p className="text-xs text-sand-500">
              This link expires in 7 days
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSendAnother}
              className="flex-1"
            >
              Send Another
            </Button>
            <Button
              variant="primary"
              onClick={handleClose}
              className="flex-1"
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Form state
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Family Member">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-olive-100 text-olive-600">
            <IconUserPlus size={32} />
          </div>
        </div>

        {/* Description */}
        <p className="text-center text-sand-600">
          Invite someone to join <strong>{familyName}</strong>
        </p>

        {/* Email Input */}
        <Input
          label="Email Address"
          type="email"
          placeholder="member@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          error={error}
          leftIcon={<IconMail size={18} />}
          autoFocus
          disabled={isSubmitting}
        />

        {/* Role Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-olive-900">
            Role
          </label>
          <div className="space-y-2">
            {availableRoles.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`
                  flex items-center justify-between w-full p-3 rounded-lg
                  border-2 transition-all
                  ${role === r
                    ? 'border-olive-400 bg-olive-50'
                    : 'border-sand-200 hover:border-sand-300'
                  }
                `}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-olive-900">
                      {ROLE_LABELS[r]}
                    </span>
                    <Badge variant={getRoleBadgeVariant(r)} size="sm">
                      {ROLE_LABELS[r]}
                    </Badge>
                  </div>
                  <p className="text-sm text-sand-600 mt-0.5">
                    {ROLE_DESCRIPTIONS[r]}
                  </p>
                </div>
                <div className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${role === r
                    ? 'border-olive-500 bg-olive-500'
                    : 'border-sand-300'
                  }
                `}>
                  {role === r && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !email.trim()}
            className="flex-1"
          >
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
