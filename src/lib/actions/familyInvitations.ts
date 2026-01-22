'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  FamilyInvitation,
  FamilyInvitationWithDetails,
  SendInvitationInput,
  FamilyActionResponse,
  AcceptInvitationResponse,
  InvitationPreview,
  FamilyRole,
} from '@/types/family';

// ============================================================
// INVITATION MANAGEMENT
// ============================================================

/**
 * Send an invitation to join a family
 */
export async function sendInvitation(
  input: SendInvitationInput
): Promise<FamilyActionResponse<FamilyInvitation>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in to send invitations' };
    }

    // Check if user can manage this family
    const { data: canManage } = await supabase.rpc('can_manage_family', {
      p_family_id: input.familyId,
      p_user_id: user.id,
    });

    if (!canManage) {
      return { data: null, error: 'You do not have permission to invite members' };
    }

    // Check if family has room for more members
    const { data: family } = await supabase
      .from('families')
      .select('max_members')
      .eq('id', input.familyId)
      .single();

    if (!family) {
      return { data: null, error: 'Family not found' };
    }

    const { count: memberCount } = await supabase
      .from('family_members')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', input.familyId);

    if ((memberCount || 0) >= family.max_members) {
      return { data: null, error: 'Family has reached maximum members' };
    }

    // Check if email is already a member
    const { data: existingMember } = await supabase
      .from('family_members')
      .select('id, user_id')
      .eq('family_id', input.familyId)
      .eq('user_id', (
        await supabase
          .from('profiles')
          .select('id')
          .eq('email', input.email.toLowerCase())
          .single()
      ).data?.id)
      .single();

    if (existingMember) {
      return { data: null, error: 'This user is already a member of the family' };
    }

    // Check for pending invitation to same email
    const { data: existingInvite } = await supabase
      .from('family_invitations')
      .select('id')
      .eq('family_id', input.familyId)
      .eq('email', input.email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return { data: null, error: 'An invitation is already pending for this email' };
    }

    // Cannot invite with a role higher than your own (except owner inviting admin)
    const { data: userRole } = await supabase.rpc('get_family_role', {
      p_family_id: input.familyId,
      p_user_id: user.id,
    });

    if (userRole === 'admin' && input.role === 'owner') {
      return { data: null, error: 'Admins cannot invite owners' };
    }

    // Create the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('family_invitations')
      .insert({
        family_id: input.familyId,
        inviter_id: user.id,
        email: input.email.toLowerCase(),
        role: input.role,
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return { data: null, error: `Failed to create invitation: ${inviteError.message}` };
    }

    // TODO: Send invitation email via Supabase Edge Function
    // For now, the token can be shared manually or via the UI

    revalidatePath(`/family/${input.familyId}`);

    return {
      data: {
        id: invitation.id,
        familyId: invitation.family_id,
        inviterId: invitation.inviter_id,
        email: invitation.email,
        role: invitation.role as FamilyRole,
        token: invitation.token,
        status: invitation.status,
        createdAt: invitation.created_at,
        expiresAt: invitation.expires_at,
        acceptedAt: invitation.accepted_at,
        acceptedBy: invitation.accepted_by,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in sendInvitation:', error);
    return { data: null, error: 'Failed to send invitation. Please try again.' };
  }
}

/**
 * Get invitation preview by token (for acceptance page)
 * This uses a SECURITY DEFINER function to bypass RLS
 */
export async function getInvitationByToken(
  token: string
): Promise<FamilyActionResponse<InvitationPreview>> {
  try {
    const supabase = await createServerSupabaseClient();

    // Use the database function that bypasses RLS
    const { data, error } = await supabase.rpc('get_invitation_by_token', {
      p_token: token,
    });

    if (error) {
      console.error('Error getting invitation:', error);
      return { data: null, error: 'Failed to look up invitation' };
    }

    if (data?.error) {
      return { data: null, error: data.error };
    }

    return {
      data: {
        id: data.id,
        familyId: data.family_id,
        familyName: data.family_name,
        inviterName: data.inviter_name,
        inviterEmail: data.inviter_email,
        role: data.role as FamilyRole,
        expiresAt: data.expires_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in getInvitationByToken:', error);
    return { data: null, error: 'Failed to look up invitation. Please try again.' };
  }
}

/**
 * Accept an invitation and join the family
 * This uses a SECURITY DEFINER function to handle the transaction
 */
export async function acceptInvitation(
  token: string
): Promise<FamilyActionResponse<AcceptInvitationResponse>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in to accept an invitation' };
    }

    // Use the database function that handles the full acceptance flow
    const { data, error } = await supabase.rpc('accept_family_invitation', {
      p_token: token,
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error accepting invitation:', error);
      return { data: null, error: 'Failed to accept invitation' };
    }

    if (data?.error) {
      return { data: null, error: data.error };
    }

    // Set this family as the user's active family (makes it the default)
    await supabase
      .from('profiles')
      .update({
        active_family_id: data.family_id,
        family_mode_enabled: true,
      })
      .eq('id', user.id);

    revalidatePath('/family');
    revalidatePath('/calendar');

    return {
      data: {
        familyId: data.family_id,
        familyName: data.family_name,
        role: data.role as FamilyRole,
        memberId: data.member_id,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in acceptInvitation:', error);
    return { data: null, error: 'Failed to accept invitation. Please try again.' };
  }
}

/**
 * Get all pending invitations for a family
 */
export async function getPendingInvitations(
  familyId: string
): Promise<FamilyActionResponse<FamilyInvitationWithDetails[]>> {
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

    const { data: invitations, error: fetchError } = await supabase
      .from('family_invitations')
      .select(`
        *,
        family:families!family_invitations_family_id_fkey(name),
        inviter:profiles!family_invitations_inviter_id_fkey(email, display_name)
      `)
      .eq('family_id', familyId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (fetchError) {
      return { data: null, error: `Failed to fetch invitations: ${fetchError.message}` };
    }

    const result: FamilyInvitationWithDetails[] = (invitations || []).map((inv) => ({
      id: inv.id,
      familyId: inv.family_id,
      inviterId: inv.inviter_id,
      email: inv.email,
      role: inv.role as FamilyRole,
      token: inv.token,
      status: inv.status,
      createdAt: inv.created_at,
      expiresAt: inv.expires_at,
      acceptedAt: inv.accepted_at,
      acceptedBy: inv.accepted_by,
      family: {
        name: inv.family?.name || '',
      },
      inviter: {
        email: inv.inviter?.email || '',
        displayName: inv.inviter?.display_name,
      },
    }));

    return { data: result, error: null };
  } catch (error) {
    console.error('Error in getPendingInvitations:', error);
    return { data: null, error: 'Failed to fetch invitations. Please try again.' };
  }
}

/**
 * Revoke a pending invitation
 */
export async function revokeInvitation(
  invitationId: string
): Promise<FamilyActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Get the invitation to check permissions
    const { data: invitation } = await supabase
      .from('family_invitations')
      .select('family_id, status')
      .eq('id', invitationId)
      .single();

    if (!invitation) {
      return { data: null, error: 'Invitation not found' };
    }

    if (invitation.status !== 'pending') {
      return { data: null, error: 'Only pending invitations can be revoked' };
    }

    // Check if user can manage this family
    const { data: canManage } = await supabase.rpc('can_manage_family', {
      p_family_id: invitation.family_id,
      p_user_id: user.id,
    });

    if (!canManage) {
      return { data: null, error: 'You do not have permission to revoke invitations' };
    }

    const { error: updateError } = await supabase
      .from('family_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId);

    if (updateError) {
      return { data: null, error: `Failed to revoke invitation: ${updateError.message}` };
    }

    revalidatePath(`/family/${invitation.family_id}`);

    return { data: null, error: null };
  } catch (error) {
    console.error('Error in revokeInvitation:', error);
    return { data: null, error: 'Failed to revoke invitation. Please try again.' };
  }
}

/**
 * Resend an invitation (creates new token and resets expiry)
 */
export async function resendInvitation(
  invitationId: string
): Promise<FamilyActionResponse<FamilyInvitation>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Get the current invitation
    const { data: oldInvitation } = await supabase
      .from('family_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (!oldInvitation) {
      return { data: null, error: 'Invitation not found' };
    }

    if (oldInvitation.status !== 'pending' && oldInvitation.status !== 'expired') {
      return { data: null, error: 'Only pending or expired invitations can be resent' };
    }

    // Check if user can manage this family
    const { data: canManage } = await supabase.rpc('can_manage_family', {
      p_family_id: oldInvitation.family_id,
      p_user_id: user.id,
    });

    if (!canManage) {
      return { data: null, error: 'You do not have permission to resend invitations' };
    }

    // Revoke the old invitation
    await supabase
      .from('family_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId);

    // Create a new invitation
    const { data: newInvitation, error: createError } = await supabase
      .from('family_invitations')
      .insert({
        family_id: oldInvitation.family_id,
        inviter_id: user.id,
        email: oldInvitation.email,
        role: oldInvitation.role,
      })
      .select()
      .single();

    if (createError) {
      return { data: null, error: `Failed to create new invitation: ${createError.message}` };
    }

    // TODO: Send invitation email via Supabase Edge Function

    revalidatePath(`/family/${oldInvitation.family_id}`);

    return {
      data: {
        id: newInvitation.id,
        familyId: newInvitation.family_id,
        inviterId: newInvitation.inviter_id,
        email: newInvitation.email,
        role: newInvitation.role as FamilyRole,
        token: newInvitation.token,
        status: newInvitation.status,
        createdAt: newInvitation.created_at,
        expiresAt: newInvitation.expires_at,
        acceptedAt: newInvitation.accepted_at,
        acceptedBy: newInvitation.accepted_by,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in resendInvitation:', error);
    return { data: null, error: 'Failed to resend invitation. Please try again.' };
  }
}

/**
 * Get invitations sent to the current user's email
 */
export async function getMyPendingInvitations(): Promise<FamilyActionResponse<FamilyInvitationWithDetails[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Get user's email from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (!profile?.email) {
      return { data: [], error: null };
    }

    // Note: This requires service role or SECURITY DEFINER function
    // For now, we'll create a function to handle this
    const { data: invitations, error: fetchError } = await supabase
      .from('family_invitations')
      .select(`
        *,
        family:families!family_invitations_family_id_fkey(name),
        inviter:profiles!family_invitations_inviter_id_fkey(email, display_name)
      `)
      .eq('email', profile.email.toLowerCase())
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (fetchError) {
      // RLS might block this, which is expected
      return { data: [], error: null };
    }

    const result: FamilyInvitationWithDetails[] = (invitations || []).map((inv) => ({
      id: inv.id,
      familyId: inv.family_id,
      inviterId: inv.inviter_id,
      email: inv.email,
      role: inv.role as FamilyRole,
      token: inv.token,
      status: inv.status,
      createdAt: inv.created_at,
      expiresAt: inv.expires_at,
      acceptedAt: inv.accepted_at,
      acceptedBy: inv.accepted_by,
      family: {
        name: inv.family?.name || '',
      },
      inviter: {
        email: inv.inviter?.email || '',
        displayName: inv.inviter?.display_name,
      },
    }));

    return { data: result, error: null };
  } catch (error) {
    console.error('Error in getMyPendingInvitations:', error);
    return { data: null, error: 'Failed to fetch your invitations. Please try again.' };
  }
}
