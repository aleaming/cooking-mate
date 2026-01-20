'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  FamilyMember,
  FamilyMemberWithProfile,
  UpdateMemberInput,
  FamilyActionResponse,
  FamilyRole,
} from '@/types/family';

// ============================================================
// MEMBER MANAGEMENT
// ============================================================

/**
 * Get all members of a family
 */
export async function getFamilyMembers(
  familyId: string
): Promise<FamilyActionResponse<FamilyMemberWithProfile[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Verify user is a member
    const { data: isMember } = await supabase.rpc('is_family_member', {
      p_family_id: familyId,
      p_user_id: user.id,
    });

    if (!isMember) {
      return { data: null, error: 'You are not a member of this family' };
    }

    const { data: members, error: fetchError } = await supabase
      .from('family_members')
      .select(`
        *,
        profile:profiles!family_members_user_id_fkey(email, display_name, avatar_url)
      `)
      .eq('family_id', familyId)
      .order('joined_at', { ascending: true });

    if (fetchError) {
      return { data: null, error: `Failed to fetch members: ${fetchError.message}` };
    }

    const result: FamilyMemberWithProfile[] = (members || []).map((m) => ({
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

    return { data: result, error: null };
  } catch (error) {
    console.error('Error in getFamilyMembers:', error);
    return { data: null, error: 'Failed to fetch members. Please try again.' };
  }
}

/**
 * Update a member's role (owner/admin only)
 * Cannot demote the owner or promote to owner
 */
export async function updateMemberRole(
  memberId: string,
  newRole: FamilyRole
): Promise<FamilyActionResponse<FamilyMember>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Get the member to update
    const { data: member } = await supabase
      .from('family_members')
      .select('*, family:families!family_members_family_id_fkey(owner_id)')
      .eq('id', memberId)
      .single();

    if (!member) {
      return { data: null, error: 'Member not found' };
    }

    // Check if user can manage this family
    const { data: canManage } = await supabase.rpc('can_manage_family', {
      p_family_id: member.family_id,
      p_user_id: user.id,
    });

    if (!canManage) {
      return { data: null, error: 'You do not have permission to change roles' };
    }

    // Cannot change owner's role
    if (member.user_id === member.family?.owner_id) {
      return { data: null, error: 'Cannot change the owner\'s role' };
    }

    // Cannot promote to owner (must use transfer ownership instead)
    if (newRole === 'owner') {
      return { data: null, error: 'Cannot promote to owner. Use transfer ownership instead.' };
    }

    // Admins can only assign voter or viewer roles
    const { data: userRole } = await supabase.rpc('get_family_role', {
      p_family_id: member.family_id,
      p_user_id: user.id,
    });

    if (userRole === 'admin' && newRole === 'admin') {
      return { data: null, error: 'Only the owner can promote members to admin' };
    }

    const { data: updated, error: updateError } = await supabase
      .from('family_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: `Failed to update role: ${updateError.message}` };
    }

    revalidatePath(`/family/${member.family_id}`);

    return {
      data: {
        id: updated.id,
        familyId: updated.family_id,
        userId: updated.user_id,
        role: updated.role as FamilyRole,
        nickname: updated.nickname,
        joinedAt: updated.joined_at,
        invitedBy: updated.invited_by,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in updateMemberRole:', error);
    return { data: null, error: 'Failed to update role. Please try again.' };
  }
}

/**
 * Remove a member from the family (owner/admin only)
 * Cannot remove the owner
 */
export async function removeMember(
  memberId: string
): Promise<FamilyActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Get the member to remove
    const { data: member } = await supabase
      .from('family_members')
      .select('*, family:families!family_members_family_id_fkey(owner_id)')
      .eq('id', memberId)
      .single();

    if (!member) {
      return { data: null, error: 'Member not found' };
    }

    // Cannot remove the owner
    if (member.user_id === member.family?.owner_id) {
      return { data: null, error: 'Cannot remove the family owner' };
    }

    // Check if user can manage this family
    const { data: canManage } = await supabase.rpc('can_manage_family', {
      p_family_id: member.family_id,
      p_user_id: user.id,
    });

    if (!canManage) {
      return { data: null, error: 'You do not have permission to remove members' };
    }

    // Admins cannot remove other admins
    const { data: userRole } = await supabase.rpc('get_family_role', {
      p_family_id: member.family_id,
      p_user_id: user.id,
    });

    if (userRole === 'admin' && member.role === 'admin') {
      return { data: null, error: 'Admins cannot remove other admins' };
    }

    const { error: deleteError } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      return { data: null, error: `Failed to remove member: ${deleteError.message}` };
    }

    // Clear their active family if it was this family
    await supabase
      .from('profiles')
      .update({ active_family_id: null, family_mode_enabled: false })
      .eq('id', member.user_id)
      .eq('active_family_id', member.family_id);

    revalidatePath(`/family/${member.family_id}`);

    return { data: null, error: null };
  } catch (error) {
    console.error('Error in removeMember:', error);
    return { data: null, error: 'Failed to remove member. Please try again.' };
  }
}

/**
 * Update a member's nickname (self or admin)
 */
export async function updateMemberNickname(
  memberId: string,
  nickname: string | null
): Promise<FamilyActionResponse<FamilyMember>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Get the member
    const { data: member } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (!member) {
      return { data: null, error: 'Member not found' };
    }

    // Check permissions - can update own nickname or if admin
    const isOwnMembership = member.user_id === user.id;

    if (!isOwnMembership) {
      const { data: canManage } = await supabase.rpc('can_manage_family', {
        p_family_id: member.family_id,
        p_user_id: user.id,
      });

      if (!canManage) {
        return { data: null, error: 'You can only update your own nickname' };
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('family_members')
      .update({ nickname: nickname || null })
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: `Failed to update nickname: ${updateError.message}` };
    }

    revalidatePath(`/family/${member.family_id}`);

    return {
      data: {
        id: updated.id,
        familyId: updated.family_id,
        userId: updated.user_id,
        role: updated.role as FamilyRole,
        nickname: updated.nickname,
        joinedAt: updated.joined_at,
        invitedBy: updated.invited_by,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in updateMemberNickname:', error);
    return { data: null, error: 'Failed to update nickname. Please try again.' };
  }
}

/**
 * Transfer family ownership to another admin member
 */
export async function transferOwnership(
  familyId: string,
  newOwnerId: string
): Promise<FamilyActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Verify user is the current owner
    const { data: family } = await supabase
      .from('families')
      .select('owner_id')
      .eq('id', familyId)
      .single();

    if (!family || family.owner_id !== user.id) {
      return { data: null, error: 'Only the current owner can transfer ownership' };
    }

    // Verify new owner is an admin member
    const { data: newOwnerMember } = await supabase
      .from('family_members')
      .select('id, role')
      .eq('family_id', familyId)
      .eq('user_id', newOwnerId)
      .single();

    if (!newOwnerMember) {
      return { data: null, error: 'New owner must be a member of the family' };
    }

    if (newOwnerMember.role !== 'admin') {
      return { data: null, error: 'New owner must be an admin' };
    }

    // Update family owner
    const { error: familyError } = await supabase
      .from('families')
      .update({ owner_id: newOwnerId })
      .eq('id', familyId);

    if (familyError) {
      return { data: null, error: `Failed to transfer ownership: ${familyError.message}` };
    }

    // Update member roles
    await supabase
      .from('family_members')
      .update({ role: 'owner' })
      .eq('family_id', familyId)
      .eq('user_id', newOwnerId);

    await supabase
      .from('family_members')
      .update({ role: 'admin' })
      .eq('family_id', familyId)
      .eq('user_id', user.id);

    revalidatePath(`/family/${familyId}`);
    revalidatePath('/family');

    return { data: null, error: null };
  } catch (error) {
    console.error('Error in transferOwnership:', error);
    return { data: null, error: 'Failed to transfer ownership. Please try again.' };
  }
}

/**
 * Get current user's membership info for a family
 */
export async function getMyMembership(
  familyId: string
): Promise<FamilyActionResponse<FamilyMember | null>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    const { data: member, error: fetchError } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      return { data: null, error: `Failed to fetch membership: ${fetchError.message}` };
    }

    if (!member) {
      return { data: null, error: null };
    }

    return {
      data: {
        id: member.id,
        familyId: member.family_id,
        userId: member.user_id,
        role: member.role as FamilyRole,
        nickname: member.nickname,
        joinedAt: member.joined_at,
        invitedBy: member.invited_by,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in getMyMembership:', error);
    return { data: null, error: 'Failed to fetch membership. Please try again.' };
  }
}
