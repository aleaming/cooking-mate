'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  IconUsers,
  IconCheck,
  IconX,
  IconLogin,
  IconAlertCircle,
  IconClock,
} from '@tabler/icons-react';
import { useAuth } from '@/providers/AuthProvider';
import { getInvitationByToken, acceptInvitation } from '@/lib/actions/familyInvitations';
import { Button, Card, Badge, Skeleton } from '@/components/ui';
import { pageVariants } from '@/lib/constants/animations';
import {
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
  type FamilyRole,
  type InvitationPreview,
} from '@/types/family';

type PageState = 'loading' | 'valid' | 'expired' | 'invalid' | 'accepted' | 'error';

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptedFamilyName, setAcceptedFamilyName] = useState<string | null>(null);

  const token = params.token as string;

  useEffect(() => {
    if (!token) {
      setPageState('invalid');
      return;
    }

    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    setPageState('loading');
    const result = await getInvitationByToken(token);

    if (result.error) {
      if (result.error.toLowerCase().includes('expired')) {
        setPageState('expired');
      } else if (result.error.toLowerCase().includes('not found') ||
                 result.error.toLowerCase().includes('invalid')) {
        setPageState('invalid');
      } else {
        setError(result.error);
        setPageState('error');
      }
      return;
    }

    if (result.data) {
      // Check if expired
      const expiresAt = new Date(result.data.expiresAt);
      if (expiresAt < new Date()) {
        setPageState('expired');
        return;
      }

      setInvitation(result.data);
      setPageState('valid');
    }
  };

  const handleAccept = async () => {
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/family/join/${token}`);
      router.push(`/login?returnTo=${returnUrl}`);
      return;
    }

    setIsAccepting(true);
    setError(null);

    const result = await acceptInvitation(token);

    setIsAccepting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.data) {
      setAcceptedFamilyName(result.data.familyName);
      setPageState('accepted');
    }
  };

  const getRoleBadgeVariant = (role: FamilyRole): 'olive' | 'aegean' | 'terracotta' | 'sand' => {
    return ROLE_COLORS[role] as 'olive' | 'aegean' | 'terracotta' | 'sand';
  };

  const formatExpiryDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Loading state
  if (authLoading || pageState === 'loading') {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-sand-50 flex items-center justify-center"
      >
        <div className="max-w-md w-full mx-4">
          <Card padding="lg" className="text-center">
            <Skeleton className="w-20 h-20 rounded-full mx-auto mb-6" />
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-5 w-64 mx-auto mb-6" />
            <Skeleton className="h-12 w-full" />
          </Card>
        </div>
      </motion.div>
    );
  }

  // Invalid invitation
  if (pageState === 'invalid') {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-sand-50 flex items-center justify-center"
      >
        <div className="max-w-md w-full mx-4">
          <Card padding="lg" className="text-center">
            <div className="
              w-20 h-20 mx-auto mb-6 rounded-full
              bg-red-100 text-red-600
              flex items-center justify-center
            ">
              <IconX size={40} />
            </div>
            <h1 className="font-display text-2xl font-bold text-olive-900 mb-3">
              Invalid Invitation
            </h1>
            <p className="text-sand-600 mb-6">
              This invitation link is invalid or has already been used.
              Please ask for a new invitation.
            </p>
            <Link href="/family">
              <Button variant="primary">Go to Family</Button>
            </Link>
          </Card>
        </div>
      </motion.div>
    );
  }

  // Expired invitation
  if (pageState === 'expired') {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-sand-50 flex items-center justify-center"
      >
        <div className="max-w-md w-full mx-4">
          <Card padding="lg" className="text-center">
            <div className="
              w-20 h-20 mx-auto mb-6 rounded-full
              bg-amber-100 text-amber-600
              flex items-center justify-center
            ">
              <IconClock size={40} />
            </div>
            <h1 className="font-display text-2xl font-bold text-olive-900 mb-3">
              Invitation Expired
            </h1>
            <p className="text-sand-600 mb-6">
              This invitation has expired. Please ask the family admin
              to send you a new invitation.
            </p>
            <Link href="/family">
              <Button variant="primary">Go to Family</Button>
            </Link>
          </Card>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (pageState === 'error') {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-sand-50 flex items-center justify-center"
      >
        <div className="max-w-md w-full mx-4">
          <Card padding="lg" className="text-center">
            <div className="
              w-20 h-20 mx-auto mb-6 rounded-full
              bg-red-100 text-red-600
              flex items-center justify-center
            ">
              <IconAlertCircle size={40} />
            </div>
            <h1 className="font-display text-2xl font-bold text-olive-900 mb-3">
              Something Went Wrong
            </h1>
            <p className="text-sand-600 mb-6">
              {error || 'Unable to load invitation. Please try again.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={loadInvitation}>
                Try Again
              </Button>
              <Link href="/family">
                <Button variant="primary">Go to Family</Button>
              </Link>
            </div>
          </Card>
        </div>
      </motion.div>
    );
  }

  // Accepted state
  if (pageState === 'accepted') {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-sand-50 flex items-center justify-center"
      >
        <div className="max-w-md w-full mx-4">
          <Card padding="lg" className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="
                w-20 h-20 mx-auto mb-6 rounded-full
                bg-olive-100 text-olive-600
                flex items-center justify-center
              "
            >
              <IconCheck size={40} />
            </motion.div>
            <h1 className="font-display text-2xl font-bold text-olive-900 mb-3">
              Welcome to the Family!
            </h1>
            <p className="text-sand-600 mb-6">
              You&apos;ve successfully joined <strong>{acceptedFamilyName}</strong>.
              You can now view shared meal plans and collaborate with your family.
            </p>
            <Link href="/family">
              <Button variant="primary" size="lg">
                Go to Family Dashboard
              </Button>
            </Link>
          </Card>
        </div>
      </motion.div>
    );
  }

  // Valid invitation - show accept form
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-sand-50 flex items-center justify-center"
    >
      <div className="max-w-md w-full mx-4">
        <Card padding="lg">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="
              w-20 h-20 mx-auto mb-6 rounded-full
              bg-olive-100 text-olive-600
              flex items-center justify-center
            ">
              <IconUsers size={40} />
            </div>
            <h1 className="font-display text-2xl font-bold text-olive-900 mb-2">
              You&apos;re Invited!
            </h1>
            <p className="text-sand-600">
              {invitation?.inviterName || invitation?.inviterEmail} has invited you to join
            </p>
          </div>

          {/* Family Info */}
          <div className="
            p-4 rounded-xl mb-6
            bg-olive-50 border border-olive-200
          ">
            <h2 className="font-display text-xl font-semibold text-olive-900 mb-2">
              {invitation?.familyName}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-sand-600">Your role:</span>
              <Badge variant={getRoleBadgeVariant(invitation?.role || 'viewer')} size="md">
                {ROLE_LABELS[invitation?.role || 'viewer']}
              </Badge>
            </div>
            <p className="text-sm text-sand-500 mt-2">
              {ROLE_DESCRIPTIONS[invitation?.role || 'viewer']}
            </p>
          </div>

          {/* Expiry Notice */}
          {invitation?.expiresAt && (
            <p className="text-sm text-sand-500 text-center mb-6">
              This invitation expires on {formatExpiryDate(invitation.expiresAt)}
            </p>
          )}

          {/* Error Message */}
          {error && (
            <div className="
              p-3 rounded-lg mb-4
              bg-red-50 border border-red-200
              text-sm text-red-700
            ">
              {error}
            </div>
          )}

          {/* Actions */}
          {user ? (
            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAccept}
                disabled={isAccepting}
                className="w-full"
              >
                {isAccepting ? 'Joining...' : 'Accept Invitation'}
              </Button>
              <Link href="/family" className="block">
                <Button variant="outline" size="lg" className="w-full">
                  Decline
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-sand-600 text-center">
                Sign in to accept this invitation
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={handleAccept}
                className="w-full gap-2"
              >
                <IconLogin size={20} />
                Sign In to Join
              </Button>
              <p className="text-xs text-sand-500 text-center">
                Don&apos;t have an account?{' '}
                <Link
                  href={`/signup?returnTo=${encodeURIComponent(`/family/join/${token}`)}`}
                  className="text-olive-600 hover:text-olive-700 font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
