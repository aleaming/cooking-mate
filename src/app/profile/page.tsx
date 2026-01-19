'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  IconUser,
  IconMail,
  IconCalendar,
  IconSettings,
  IconEdit,
  IconCheck,
  IconX,
  IconChefHat,
  IconCalendarEvent,
  IconStar,
} from '@tabler/icons-react';
import { useAuth } from '@/providers/AuthProvider';
import { getProfile, updateProfile, type Profile } from '@/lib/actions/profile';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Skeleton } from '@/components/ui';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/constants/animations';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, authLoading, router]);

  async function loadProfile() {
    setIsLoading(true);
    const { data, error } = await getProfile();
    if (error) {
      setError(error);
    } else if (data) {
      setProfile(data);
      setDisplayName(data.display_name || '');
    }
    setIsLoading(false);
  }

  async function handleSave() {
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    const { data, error } = await updateProfile({ display_name: displayName.trim() });

    if (error) {
      setError(error);
    } else if (data) {
      setProfile(data);
      setIsEditing(false);
    }
    setIsSaving(false);
  }

  function handleCancel() {
    setDisplayName(profile?.display_name || '');
    setIsEditing(false);
    setError(null);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (authLoading || (isLoading && !profile)) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen"
      >
        <div className="bg-gradient-to-br from-olive-50 to-sand-50 py-12 lg:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-6 w-64" />
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-20 h-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
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
      className="min-h-screen"
    >
      {/* Page Header */}
      <div className="bg-gradient-to-br from-olive-50 to-sand-50 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl lg:text-4xl font-bold text-olive-900"
          >
            Your Profile
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-lg text-sand-600"
          >
            Manage your account information
          </motion.p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Row 1: Profile Card + Quick Links */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Profile Card */}
            <motion.div variants={staggerItem} className="flex">
              <Card className="flex-1 flex flex-col">
                <CardContent className="p-6 flex-1">
                  {/* Avatar and Basic Info */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-20 h-20 rounded-full bg-olive-100 flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.display_name || 'Profile'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <IconUser size={36} className="text-olive-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-3">
                          <Input
                            label="Display Name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your display name"
                            error={error || undefined}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSave}
                              isLoading={isSaving}
                              leftIcon={<IconCheck size={16} />}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancel}
                              disabled={isSaving}
                              leftIcon={<IconX size={16} />}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <h2 className="font-display text-xl font-semibold text-olive-900 truncate">
                              {profile?.display_name || 'User'}
                            </h2>
                            <button
                              onClick={() => setIsEditing(true)}
                              className="p-1.5 rounded-lg hover:bg-sand-100 transition-colors"
                              aria-label="Edit display name"
                            >
                              <IconEdit size={16} className="text-sand-500" />
                            </button>
                          </div>
                          <p className="text-sand-500 truncate">{profile?.email}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Info List */}
                  <div className="space-y-4 border-t border-sand-200 pt-6">
                    <div className="flex items-center gap-3 text-sand-700">
                      <IconMail size={20} className="text-sand-400 flex-shrink-0" />
                      <span className="truncate">{profile?.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sand-700">
                      <IconCalendar size={20} className="text-sand-400 flex-shrink-0" />
                      <span>
                        Member since {profile?.created_at && formatDate(profile.created_at)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Links Card */}
            <motion.div variants={staggerItem} className="flex">
              <Card className="flex-1 flex flex-col">
                <CardHeader className="p-6 pb-0">
                  <CardTitle>Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex-1 space-y-3">
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 p-3 rounded-xl bg-sand-50 hover:bg-sand-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-olive-100 flex items-center justify-center">
                      <IconSettings size={20} className="text-olive-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-olive-900">Settings</h3>
                      <p className="text-sm text-sand-500">Preferences & notifications</p>
                    </div>
                  </Link>
                  <Link
                    href="/calendar"
                    className="flex items-center gap-3 p-3 rounded-xl bg-sand-50 hover:bg-sand-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-aegean-100 flex items-center justify-center">
                      <IconCalendarEvent size={20} className="text-aegean-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-olive-900">Meal Plan</h3>
                      <p className="text-sm text-sand-500">View your calendar</p>
                    </div>
                  </Link>
                  <Link
                    href="/cooking-history"
                    className="flex items-center gap-3 p-3 rounded-xl bg-sand-50 hover:bg-sand-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-terracotta-100 flex items-center justify-center">
                      <IconChefHat size={20} className="text-terracotta-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-olive-900">Cooking History</h3>
                      <p className="text-sm text-sand-500">View your cooking log</p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Row 2: Activity Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <motion.div variants={staggerItem}>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-olive-100 flex items-center justify-center mx-auto mb-3">
                    <IconCalendarEvent size={24} className="text-olive-600" />
                  </div>
                  <p className="text-2xl font-bold text-olive-900">--</p>
                  <p className="text-sm text-sand-500">Meals Planned</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={staggerItem}>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-terracotta-100 flex items-center justify-center mx-auto mb-3">
                    <IconChefHat size={24} className="text-terracotta-600" />
                  </div>
                  <p className="text-2xl font-bold text-olive-900">--</p>
                  <p className="text-sm text-sand-500">Meals Cooked</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={staggerItem}>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-aegean-100 flex items-center justify-center mx-auto mb-3">
                    <IconStar size={24} className="text-aegean-600" />
                  </div>
                  <p className="text-2xl font-bold text-olive-900">--</p>
                  <p className="text-sm text-sand-500">Avg Rating</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
