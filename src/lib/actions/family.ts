'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  Family,
  FamilyWithDetails,
  FamilyMemberWithProfile,
  CreateFamilyInput,
  UpdateFamilyInput,
  FamilyActionResponse,
  FamilyPermissions,
  FamilyRole,
} from '@/types/family';

// ============================================================
// FAMILY CRUD OPERATIONS
// ============================================================

/**
 * Create a new family - user becomes owner and first member
 */
export async function createFamily(
  input: CreateFamilyInput
): Promise<FamilyActionResponse<Family>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in to create a family' };
    }

    // Create the family
    const { data: family, error: createError } = await supabase
      .from('families')
      .insert({
        name: input.name,
        owner_id: user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating family:', createError);
      return { data: null, error: `Failed to create family: ${createError.message}` };
    }

    // Add owner as first member
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_id: family.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) {
      console.error('Error adding owner as member:', memberError);
      // Try to clean up the family
      await supabase.from('families').delete().eq('id', family.id);
      return { data: null, error: 'Failed to set up family membership' };
    }

    revalidatePath('/family');

    return {
      data: {
        id: family.id,
        name: family.name,
        ownerId: family.owner_id,
        maxMembers: family.max_members,
        createdAt: family.created_at,
        updatedAt: family.updated_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in createFamily:', error);
    return { data: null, error: 'Failed to create family. Please try again.' };
  }
}

/**
 * Get all families the current user belongs to
 */
export async function getMyFamilies(): Promise<FamilyActionResponse<FamilyWithDetails[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in to view families' };
    }

    // Get families where user is a member
    const { data: memberships, error: memberError } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id);

    if (memberError) {
      return { data: null, error: `Failed to fetch memberships: ${memberError.message}` };
    }

    if (!memberships || memberships.length === 0) {
      return { data: [], error: null };
    }

    const familyIds = memberships.map((m) => m.family_id);

    // Get family details with owner profile and member count
    const { data: families, error: familyError } = await supabase
      .from('families')
      .select(`
        *,
        owner:profiles!families_owner_id_fkey(email, display_name, avatar_url)
      `)
      .in('id', familyIds);

    if (familyError) {
      return { data: null, error: `Failed to fetch families: ${familyError.message}` };
    }

    // Get member counts for each family
    const familiesWithDetails: FamilyWithDetails[] = await Promise.all(
      families.map(async (family) => {
        const { count } = await supabase
          .from('family_members')
          .select('*', { count: 'exact', head: true })
          .eq('family_id', family.id);

        return {
          id: family.id,
          name: family.name,
          ownerId: family.owner_id,
          maxMembers: family.max_members,
          createdAt: family.created_at,
          updatedAt: family.updated_at,
          memberCount: count || 0,
          ownerProfile: family.owner ? {
            email: family.owner.email,
            displayName: family.owner.display_name,
            avatarUrl: family.owner.avatar_url,
          } : undefined,
        };
      })
    );

    return { data: familiesWithDetails, error: null };
  } catch (error) {
    console.error('Error in getMyFamilies:', error);
    return { data: null, error: 'Failed to fetch families. Please try again.' };
  }
}

/**
 * Get a single family by ID with full details including members
 */
export async function getFamilyById(
  familyId: string
): Promise<FamilyActionResponse<{ family: FamilyWithDetails; members: FamilyMemberWithProfile[]; userRole: FamilyRole | null }>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in to view family details' };
    }

    // Verify user is a member of this family
    const { data: membership } = await supabase
      .from('family_members')
      .select('role')
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return { data: null, error: 'You are not a member of this family' };
    }

    // Get family details
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select(`
        *,
        owner:profiles!families_owner_id_fkey(email, display_name, avatar_url)
      `)
      .eq('id', familyId)
      .single();

    if (familyError || !family) {
      return { data: null, error: 'Family not found' };
    }

    // Get all members with profiles
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select(`
        *,
        profile:profiles!family_members_user_id_fkey(email, display_name, avatar_url)
      `)
      .eq('family_id', familyId)
      .order('joined_at', { ascending: true });

    if (membersError) {
      return { data: null, error: `Failed to fetch members: ${membersError.message}` };
    }

    const familyWithDetails: FamilyWithDetails = {
      id: family.id,
      name: family.name,
      ownerId: family.owner_id,
      maxMembers: family.max_members,
      createdAt: family.created_at,
      updatedAt: family.updated_at,
      memberCount: members?.length || 0,
      ownerProfile: family.owner ? {
        email: family.owner.email,
        displayName: family.owner.display_name,
        avatarUrl: family.owner.avatar_url,
      } : undefined,
    };

    const membersWithProfiles: FamilyMemberWithProfile[] = (members || []).map((m) => ({
      id: m.id,
      familyId: m.family_id,
      userId: m.user_id,
      role: m.role as FamilyRole,
      nickname: m.nickname,
      joinedAt: m.joined_at,
      invitedBy: m.invited_by,
      profile: {
        email: m.profile?.email || '',
        displayName: m.profile?.display_name,
        avatarUrl: m.profile?.avatar_url,
      },
    }));

    return {
      data: {
        family: familyWithDetails,
        members: membersWithProfiles,
        userRole: membership.role as FamilyRole,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in getFamilyById:', error);
    return { data: null, error: 'Failed to fetch family details. Please try again.' };
  }
}

/**
 * Update family settings (owner/admin only)
 */
export async function updateFamily(
  familyId: string,
  input: UpdateFamilyInput
): Promise<FamilyActionResponse<Family>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in to update family settings' };
    }

    // Check if user can manage this family (owner or admin)
    const { data: canManage } = await supabase.rpc('can_manage_family', {
      p_family_id: familyId,
      p_user_id: user.id,
    });

    if (!canManage) {
      return { data: null, error: 'You do not have permission to update this family' };
    }

    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.maxMembers !== undefined) updates.max_members = input.maxMembers;

    const { data: family, error: updateError } = await supabase
      .from('families')
      .update(updates)
      .eq('id', familyId)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: `Failed to update family: ${updateError.message}` };
    }

    revalidatePath('/family');
    revalidatePath(`/family/${familyId}`);

    return {
      data: {
        id: family.id,
        name: family.name,
        ownerId: family.owner_id,
        maxMembers: family.max_members,
        createdAt: family.created_at,
        updatedAt: family.updated_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in updateFamily:', error);
    return { data: null, error: 'Failed to update family. Please try again.' };
  }
}

/**
 * Delete a family (owner only)
 */
export async function deleteFamily(
  familyId: string
): Promise<FamilyActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in to delete a family' };
    }

    // Verify user is the owner
    const { data: family } = await supabase
      .from('families')
      .select('owner_id')
      .eq('id', familyId)
      .single();

    if (!family || family.owner_id !== user.id) {
      return { data: null, error: 'Only the family owner can delete the family' };
    }

    // Delete the family (cascade will handle members, invitations, etc.)
    const { error: deleteError } = await supabase
      .from('families')
      .delete()
      .eq('id', familyId);

    if (deleteError) {
      return { data: null, error: `Failed to delete family: ${deleteError.message}` };
    }

    revalidatePath('/family');

    return { data: null, error: null };
  } catch (error) {
    console.error('Error in deleteFamily:', error);
    return { data: null, error: 'Failed to delete family. Please try again.' };
  }
}

/**
 * Leave a family (non-owners)
 */
export async function leaveFamily(
  familyId: string
): Promise<FamilyActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in to leave a family' };
    }

    // Check that user is not the owner
    const { data: family } = await supabase
      .from('families')
      .select('owner_id')
      .eq('id', familyId)
      .single();

    if (!family) {
      return { data: null, error: 'Family not found' };
    }

    if (family.owner_id === user.id) {
      return { data: null, error: 'Family owners cannot leave. Transfer ownership or delete the family instead.' };
    }

    // Remove membership
    const { error: deleteError } = await supabase
      .from('family_members')
      .delete()
      .eq('family_id', familyId)
      .eq('user_id', user.id);

    if (deleteError) {
      return { data: null, error: `Failed to leave family: ${deleteError.message}` };
    }

    // Clear active family if this was it
    await supabase
      .from('profiles')
      .update({ active_family_id: null })
      .eq('id', user.id)
      .eq('active_family_id', familyId);

    revalidatePath('/family');

    return { data: null, error: null };
  } catch (error) {
    console.error('Error in leaveFamily:', error);
    return { data: null, error: 'Failed to leave family. Please try again.' };
  }
}

// ============================================================
// FAMILY MODE & ACTIVE FAMILY
// ============================================================

/**
 * Set the user's active family for family mode
 */
export async function setActiveFamily(
  familyId: string | null
): Promise<FamilyActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // If setting a family, verify membership
    if (familyId) {
      const { data: isMember } = await supabase.rpc('is_family_member', {
        p_family_id: familyId,
        p_user_id: user.id,
      });

      if (!isMember) {
        return { data: null, error: 'You are not a member of this family' };
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        active_family_id: familyId,
        family_mode_enabled: familyId !== null,
      })
      .eq('id', user.id);

    if (updateError) {
      return { data: null, error: `Failed to update active family: ${updateError.message}` };
    }

    revalidatePath('/family');
    revalidatePath('/calendar');
    revalidatePath('/shopping-list');

    return { data: null, error: null };
  } catch (error) {
    console.error('Error in setActiveFamily:', error);
    return { data: null, error: 'Failed to set active family. Please try again.' };
  }
}

/**
 * Toggle family mode on/off
 */
export async function toggleFamilyMode(): Promise<FamilyActionResponse<boolean>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('family_mode_enabled, active_family_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return { data: null, error: 'Profile not found' };
    }

    // Can only enable family mode if there's an active family
    const newMode = !profile.family_mode_enabled;
    if (newMode && !profile.active_family_id) {
      return { data: null, error: 'Please select a family first' };
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ family_mode_enabled: newMode })
      .eq('id', user.id);

    if (updateError) {
      return { data: null, error: `Failed to toggle family mode: ${updateError.message}` };
    }

    revalidatePath('/family');
    revalidatePath('/calendar');
    revalidatePath('/shopping-list');

    return { data: newMode, error: null };
  } catch (error) {
    console.error('Error in toggleFamilyMode:', error);
    return { data: null, error: 'Failed to toggle family mode. Please try again.' };
  }
}

/**
 * Get user's current family context (active family, mode, permissions)
 */
export async function getFamilyContext(): Promise<FamilyActionResponse<{
  activeFamily: FamilyWithDetails | null;
  familyModeEnabled: boolean;
  permissions: FamilyPermissions | null;
  role: FamilyRole | null;
}>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Get profile with active family
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_family_id, family_mode_enabled')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.active_family_id) {
      return {
        data: {
          activeFamily: null,
          familyModeEnabled: false,
          permissions: null,
          role: null,
        },
        error: null,
      };
    }

    // Get family details and user's role
    const result = await getFamilyById(profile.active_family_id);

    if (result.error || !result.data) {
      // Family might have been deleted, clear the active family
      await supabase
        .from('profiles')
        .update({ active_family_id: null, family_mode_enabled: false })
        .eq('id', user.id);

      return {
        data: {
          activeFamily: null,
          familyModeEnabled: false,
          permissions: null,
          role: null,
        },
        error: null,
      };
    }

    // Import the permissions helper
    const { getPermissionsForRole } = await import('@/types/family');

    return {
      data: {
        activeFamily: result.data.family,
        familyModeEnabled: profile.family_mode_enabled,
        permissions: result.data.userRole ? getPermissionsForRole(result.data.userRole) : null,
        role: result.data.userRole,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in getFamilyContext:', error);
    return { data: null, error: 'Failed to fetch family context. Please try again.' };
  }
}
