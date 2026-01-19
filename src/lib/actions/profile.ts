'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  // Notification preferences
  emailNotifications?: boolean;
  weeklyDigest?: boolean;
  mealReminders?: boolean;

  // Display preferences
  theme?: 'light' | 'dark' | 'system';
  defaultServings?: number;

  // Privacy preferences
  profileVisibility?: 'public' | 'private';
}

/**
 * Get the current user's profile
 */
export async function getProfile() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error getting profile:', error);
    return { data: null, error: error.message };
  }

  return { data: data as Profile, error: null };
}

/**
 * Update the current user's profile
 */
export async function updateProfile(updates: {
  display_name?: string;
  avatar_url?: string;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: updates.display_name,
      avatar_url: updates.avatar_url,
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath('/settings');
  return { data: data as Profile, error: null };
}

/**
 * Update user preferences
 */
export async function updatePreferences(preferences: Partial<UserPreferences>) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  // First get current preferences
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single();

  const currentPrefs = (currentProfile?.preferences as UserPreferences) || {};
  const mergedPrefs = { ...currentPrefs, ...preferences };

  const { data, error } = await supabase
    .from('profiles')
    .update({ preferences: mergedPrefs })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating preferences:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/settings');
  return { data: data as Profile, error: null };
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error('Error updating password:', error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Delete user account and all associated data
 */
export async function deleteAccount() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Delete profile (cascades to related data due to ON DELETE CASCADE)
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id);

  if (profileError) {
    console.error('Error deleting profile:', profileError);
    return { success: false, error: profileError.message };
  }

  // Sign out the user after deletion
  await supabase.auth.signOut();

  return { success: true, error: null };
}
