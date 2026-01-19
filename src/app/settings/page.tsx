'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconBell,
  IconLock,
  IconEye,
  IconPalette,
  IconArrowLeft,
  IconAlertTriangle,
  IconTrash,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import {
  getProfile,
  updatePreferences,
  updatePassword,
  deleteAccount,
  type Profile,
  type UserPreferences,
} from '@/lib/actions/profile';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Modal, Toggle, Skeleton } from '@/components/ui';
import { SubscriptionStatus } from '@/components/subscription';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/constants/animations';
import type { SubscriptionInfo } from '@/types/subscription';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { theme: currentTheme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    status: 'inactive',
    tier: null,
    period: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    weeklyDigest: false,
    mealReminders: true,
    theme: 'system',
    defaultServings: 2,
    profileVisibility: 'private',
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
      // Merge saved preferences with defaults
      setPreferences((prev) => ({
        ...prev,
        ...data.preferences,
      }));
      // Set subscription info from profile (fields may not exist yet)
      const profileAny = data as unknown as Record<string, unknown>;
      setSubscription({
        status: (profileAny.subscription_status as SubscriptionInfo['status']) || 'inactive',
        tier: (profileAny.subscription_tier as SubscriptionInfo['tier']) || null,
        period: (profileAny.subscription_period as SubscriptionInfo['period']) || null,
        currentPeriodEnd: (profileAny.subscription_current_period_end as string) || null,
        cancelAtPeriodEnd: (profileAny.subscription_cancel_at_period_end as boolean) || false,
      });
    }
    setIsLoading(false);
  }

  async function handlePreferenceChange<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);

    setIsSavingPrefs(true);
    setError(null);

    const { data, error } = await updatePreferences({ [key]: value });

    if (error) {
      // Revert on error
      setPreferences(preferences);
      setError(error);
    } else if (data) {
      setProfile(data);
      showSuccess('Preference saved');
    }
    setIsSavingPrefs(false);
  }

  async function handlePasswordChange() {
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);

    const { success, error } = await updatePassword(newPassword);

    if (error) {
      setPasswordError(error);
    } else if (success) {
      setNewPassword('');
      setConfirmPassword('');
      showSuccess('Password updated successfully');
    }
    setIsChangingPassword(false);
  }

  async function handleDeleteAccount() {
    if (deleteConfirmation !== 'DELETE') {
      return;
    }

    setIsDeleting(true);

    const { success, error } = await deleteAccount();

    if (error) {
      setError(error);
      setIsDeleting(false);
    } else if (success) {
      router.push('/');
    }
  }

  function showSuccess(message: string) {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
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
            <Skeleton className="h-10 w-32 mb-2" />
            <Skeleton className="h-6 w-64" />
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-40 mb-4" />
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
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
          <Link
            href="/profile"
            className="inline-flex items-center gap-1 text-sand-600 hover:text-olive-700 mb-4 transition-colors"
          >
            <IconArrowLeft size={18} />
            <span>Back to Profile</span>
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl lg:text-4xl font-bold text-olive-900"
          >
            Settings
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-lg text-sand-600"
          >
            Manage your preferences and account settings
          </motion.p>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-olive-600 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Row 1: Notifications + Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Notifications */}
            <motion.div variants={staggerItem} className="flex">
              <Card className="flex-1 flex flex-col">
                <CardHeader className="p-6 pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-aegean-100 flex items-center justify-center">
                      <IconBell size={20} className="text-aegean-600" />
                    </div>
                    <CardTitle>Notifications</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4 flex-1">
                  <Toggle
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                    label="Email Notifications"
                    description="Receive email updates about your account"
                  />
                  <Toggle
                    checked={preferences.weeklyDigest}
                    onCheckedChange={(checked) => handlePreferenceChange('weeklyDigest', checked)}
                    label="Weekly Digest"
                    description="Get a weekly summary of your meal plans"
                  />
                  <Toggle
                    checked={preferences.mealReminders}
                    onCheckedChange={(checked) => handlePreferenceChange('mealReminders', checked)}
                    label="Meal Reminders"
                    description="Receive reminders for your planned meals"
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Display */}
            <motion.div variants={staggerItem} className="flex">
              <Card className="flex-1 flex flex-col">
                <CardHeader className="p-6 pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-terracotta-100 flex items-center justify-center">
                      <IconPalette size={20} className="text-terracotta-600" />
                    </div>
                    <CardTitle>Display</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4 flex-1">
                  <div>
                    <label className="block text-sm font-medium text-olive-800 mb-2">
                      Theme
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(['light', 'dark', 'system'] as const).map((themeOption) => (
                        <button
                          key={themeOption}
                          onClick={() => {
                            setTheme(themeOption);
                            handlePreferenceChange('theme', themeOption);
                          }}
                          className={`
                            px-4 py-2 rounded-xl text-sm font-medium transition-colors
                            ${currentTheme === themeOption
                              ? 'bg-olive-500 text-white'
                              : 'bg-sand-100 text-sand-700 hover:bg-sand-200'
                            }
                          `}
                        >
                          {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-olive-800 mb-2">
                      Default Servings
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 4, 6].map((servings) => (
                        <button
                          key={servings}
                          onClick={() => handlePreferenceChange('defaultServings', servings)}
                          className={`
                            w-12 h-12 rounded-xl text-sm font-medium transition-colors
                            ${preferences.defaultServings === servings
                              ? 'bg-olive-500 text-white'
                              : 'bg-sand-100 text-sand-700 hover:bg-sand-200'
                            }
                          `}
                        >
                          {servings}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Row 2: Privacy + Password */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Privacy */}
            <motion.div variants={staggerItem} className="flex">
              <Card className="flex-1 flex flex-col">
                <CardHeader className="p-6 pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-olive-100 flex items-center justify-center">
                      <IconEye size={20} className="text-olive-600" />
                    </div>
                    <CardTitle>Privacy</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4 flex-1">
                  <div>
                    <label className="block text-sm font-medium text-olive-800 mb-2">
                      Profile Visibility
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(['private', 'public'] as const).map((visibility) => (
                        <button
                          key={visibility}
                          onClick={() => handlePreferenceChange('profileVisibility', visibility)}
                          className={`
                            px-4 py-2 rounded-xl text-sm font-medium transition-colors
                            ${preferences.profileVisibility === visibility
                              ? 'bg-olive-500 text-white'
                              : 'bg-sand-100 text-sand-700 hover:bg-sand-200'
                            }
                          `}
                        >
                          {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-sand-500 mt-1">
                      {preferences.profileVisibility === 'private'
                        ? 'Your profile is only visible to you'
                        : 'Your profile can be seen by other users'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Password */}
            <motion.div variants={staggerItem} className="flex">
              <Card className="flex-1 flex flex-col">
                <CardHeader className="p-6 pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center">
                      <IconLock size={20} className="text-sand-600" />
                    </div>
                    <CardTitle>Password</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4 flex-1">
                  <Input
                    type="password"
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    helperText="At least 8 characters"
                  />
                  <Input
                    type="password"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    error={passwordError || undefined}
                  />
                  <Button
                    onClick={handlePasswordChange}
                    isLoading={isChangingPassword}
                    disabled={!newPassword || !confirmPassword}
                  >
                    Update Password
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Row 3: Subscription (full width) */}
          <motion.div variants={staggerItem}>
            <SubscriptionStatus subscription={subscription} />
          </motion.div>

          {/* Row 4: Danger Zone (full width) */}
          <motion.div variants={staggerItem}>
            <Card className="border-2 border-error/30">
              <CardHeader className="p-6 pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
                    <IconAlertTriangle size={20} className="text-error" />
                  </div>
                  <CardTitle className="text-error">Danger Zone</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-olive-900">Delete Account</h4>
                    <p className="text-sand-600 text-sm">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-error/50 text-error hover:bg-error/10 shrink-0"
                    leftIcon={<IconTrash size={18} />}
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmation('');
        }}
        title="Delete Account"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-error/10 rounded-xl text-error">
            <IconAlertTriangle size={24} />
            <p className="text-sm">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
          </div>
          <p className="text-sand-600">
            To confirm, type <strong>DELETE</strong> in the box below:
          </p>
          <Input
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="Type DELETE to confirm"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmation('');
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-error hover:bg-error/90"
              onClick={handleDeleteAccount}
              isLoading={isDeleting}
              disabled={deleteConfirmation !== 'DELETE'}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
