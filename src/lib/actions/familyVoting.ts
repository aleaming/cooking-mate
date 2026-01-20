'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  FamilyMealVote,
  FamilyMealVoteWithProfile,
  CastVoteInput,
  FamilyActionResponse,
  VoteSummary,
  VoteType,
} from '@/types/family';

// ============================================================
// VOTING SYSTEM
// ============================================================

/**
 * Cast a vote on a family meal proposal
 */
export async function castVote(
  input: CastVoteInput
): Promise<FamilyActionResponse<FamilyMealVote>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in to vote' };
    }

    // Get the meal plan to check permissions
    const { data: mealPlan } = await supabase
      .from('family_meal_plans')
      .select('family_id, status')
      .eq('id', input.mealPlanId)
      .single();

    if (!mealPlan) {
      return { data: null, error: 'Meal plan not found' };
    }

    // Only proposed meals can be voted on
    if (mealPlan.status !== 'proposed') {
      return { data: null, error: 'This meal has already been approved or rejected' };
    }

    // Verify user can vote in this family
    const { data: canVote } = await supabase.rpc('can_vote_in_family', {
      p_family_id: mealPlan.family_id,
      p_user_id: user.id,
    });

    if (!canVote) {
      return { data: null, error: 'You do not have permission to vote in this family' };
    }

    // Check if user already voted (upsert)
    const { data: existingVote } = await supabase
      .from('family_meal_votes')
      .select('id')
      .eq('meal_plan_id', input.mealPlanId)
      .eq('user_id', user.id)
      .single();

    let vote: Record<string, unknown>;

    if (existingVote) {
      // Update existing vote
      const { data: updated, error: updateError } = await supabase
        .from('family_meal_votes')
        .update({
          vote: input.vote,
          comment: input.comment || null,
          voted_at: new Date().toISOString(),
        })
        .eq('id', existingVote.id)
        .select()
        .single();

      if (updateError) {
        return { data: null, error: `Failed to update vote: ${updateError.message}` };
      }
      vote = updated;
    } else {
      // Create new vote
      const { data: created, error: insertError } = await supabase
        .from('family_meal_votes')
        .insert({
          meal_plan_id: input.mealPlanId,
          user_id: user.id,
          vote: input.vote,
          comment: input.comment || null,
        })
        .select()
        .single();

      if (insertError) {
        return { data: null, error: `Failed to cast vote: ${insertError.message}` };
      }
      vote = created;
    }

    revalidatePath('/calendar');
    revalidatePath(`/family/${mealPlan.family_id}`);

    return {
      data: {
        id: vote.id as string,
        mealPlanId: vote.meal_plan_id as string,
        userId: vote.user_id as string,
        vote: vote.vote as VoteType,
        comment: vote.comment as string | undefined,
        votedAt: vote.voted_at as string,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in castVote:', error);
    return { data: null, error: 'Failed to cast vote. Please try again.' };
  }
}

/**
 * Get all votes for a meal plan
 */
export async function getVotesForMeal(
  mealPlanId: string
): Promise<FamilyActionResponse<FamilyMealVoteWithProfile[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Get the meal plan to check membership
    const { data: mealPlan } = await supabase
      .from('family_meal_plans')
      .select('family_id')
      .eq('id', mealPlanId)
      .single();

    if (!mealPlan) {
      return { data: null, error: 'Meal plan not found' };
    }

    // Verify user is a member
    const { data: isMember } = await supabase.rpc('is_family_member', {
      p_family_id: mealPlan.family_id,
      p_user_id: user.id,
    });

    if (!isMember) {
      return { data: null, error: 'You are not a member of this family' };
    }

    const { data: votes, error: fetchError } = await supabase
      .from('family_meal_votes')
      .select(`
        *,
        profile:profiles!family_meal_votes_user_id_fkey(email, display_name, avatar_url)
      `)
      .eq('meal_plan_id', mealPlanId)
      .order('voted_at', { ascending: true });

    if (fetchError) {
      return { data: null, error: `Failed to fetch votes: ${fetchError.message}` };
    }

    const result: FamilyMealVoteWithProfile[] = (votes || []).map((v) => ({
      id: v.id,
      mealPlanId: v.meal_plan_id,
      userId: v.user_id,
      vote: v.vote as VoteType,
      comment: v.comment,
      votedAt: v.voted_at,
      profile: {
        email: v.profile?.email || '',
        displayName: v.profile?.display_name,
        avatarUrl: v.profile?.avatar_url,
      },
    }));

    return { data: result, error: null };
  } catch (error) {
    console.error('Error in getVotesForMeal:', error);
    return { data: null, error: 'Failed to fetch votes. Please try again.' };
  }
}

/**
 * Get vote summary for a meal plan
 */
export async function getVoteSummary(
  mealPlanId: string
): Promise<FamilyActionResponse<VoteSummary>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Get the meal plan to check membership
    const { data: mealPlan } = await supabase
      .from('family_meal_plans')
      .select('family_id')
      .eq('id', mealPlanId)
      .single();

    if (!mealPlan) {
      return { data: null, error: 'Meal plan not found' };
    }

    // Verify user is a member
    const { data: isMember } = await supabase.rpc('is_family_member', {
      p_family_id: mealPlan.family_id,
      p_user_id: user.id,
    });

    if (!isMember) {
      return { data: null, error: 'You are not a member of this family' };
    }

    // Get vote counts using database function
    const { data: voteData, error: countError } = await supabase.rpc('get_meal_vote_counts', {
      p_meal_plan_id: mealPlanId,
    });

    if (countError) {
      return { data: null, error: `Failed to get vote counts: ${countError.message}` };
    }

    // Get user's vote
    const { data: userVoteData } = await supabase
      .from('family_meal_votes')
      .select('vote')
      .eq('meal_plan_id', mealPlanId)
      .eq('user_id', user.id)
      .single();

    const summary: VoteSummary = {
      approveCount: voteData?.[0]?.approve_count || 0,
      rejectCount: voteData?.[0]?.reject_count || 0,
      abstainCount: voteData?.[0]?.abstain_count || 0,
      totalVotes: voteData?.[0]?.total_votes || 0,
      userVote: userVoteData?.vote as VoteType | undefined,
    };

    return { data: summary, error: null };
  } catch (error) {
    console.error('Error in getVoteSummary:', error);
    return { data: null, error: 'Failed to get vote summary. Please try again.' };
  }
}

/**
 * Remove user's vote from a meal plan
 */
export async function removeVote(
  mealPlanId: string
): Promise<FamilyActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Get the meal plan to check status
    const { data: mealPlan } = await supabase
      .from('family_meal_plans')
      .select('family_id, status')
      .eq('id', mealPlanId)
      .single();

    if (!mealPlan) {
      return { data: null, error: 'Meal plan not found' };
    }

    // Can only remove vote from proposed meals
    if (mealPlan.status !== 'proposed') {
      return { data: null, error: 'Cannot change vote on finalized meals' };
    }

    const { error: deleteError } = await supabase
      .from('family_meal_votes')
      .delete()
      .eq('meal_plan_id', mealPlanId)
      .eq('user_id', user.id);

    if (deleteError) {
      return { data: null, error: `Failed to remove vote: ${deleteError.message}` };
    }

    revalidatePath('/calendar');
    revalidatePath(`/family/${mealPlan.family_id}`);

    return { data: null, error: null };
  } catch (error) {
    console.error('Error in removeVote:', error);
    return { data: null, error: 'Failed to remove vote. Please try again.' };
  }
}

/**
 * Get user's vote for a specific meal plan
 */
export async function getMyVote(
  mealPlanId: string
): Promise<FamilyActionResponse<FamilyMealVote | null>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    const { data: vote, error: fetchError } = await supabase
      .from('family_meal_votes')
      .select('*')
      .eq('meal_plan_id', mealPlanId)
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      return { data: null, error: `Failed to fetch vote: ${fetchError.message}` };
    }

    if (!vote) {
      return { data: null, error: null };
    }

    return {
      data: {
        id: vote.id,
        mealPlanId: vote.meal_plan_id,
        userId: vote.user_id,
        vote: vote.vote as VoteType,
        comment: vote.comment,
        votedAt: vote.voted_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in getMyVote:', error);
    return { data: null, error: 'Failed to fetch your vote. Please try again.' };
  }
}

/**
 * Check if voting threshold is met and auto-approve/reject
 * This should be called after each vote
 */
export async function checkVotingThreshold(
  mealPlanId: string
): Promise<FamilyActionResponse<{ autoApproved: boolean; autoRejected: boolean }>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Get meal plan
    const { data: mealPlan } = await supabase
      .from('family_meal_plans')
      .select('family_id, status')
      .eq('id', mealPlanId)
      .single();

    if (!mealPlan || mealPlan.status !== 'proposed') {
      return { data: { autoApproved: false, autoRejected: false }, error: null };
    }

    // Get vote counts
    const { data: voteData } = await supabase.rpc('get_meal_vote_counts', {
      p_meal_plan_id: mealPlanId,
    });

    // Get total voting members count
    const { count: voterCount } = await supabase
      .from('family_members')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', mealPlan.family_id)
      .in('role', ['owner', 'admin', 'voter']);

    const approves = voteData?.[0]?.approve_count || 0;
    const rejects = voteData?.[0]?.reject_count || 0;
    const totalVoters = voterCount || 0;

    // Auto-approve if majority approves (>50%)
    // Auto-reject if majority rejects (>50%)
    const majorityThreshold = Math.floor(totalVoters / 2) + 1;

    if (approves >= majorityThreshold) {
      await supabase
        .from('family_meal_plans')
        .update({ status: 'approved' })
        .eq('id', mealPlanId);

      revalidatePath('/calendar');
      return { data: { autoApproved: true, autoRejected: false }, error: null };
    }

    if (rejects >= majorityThreshold) {
      await supabase
        .from('family_meal_plans')
        .update({ status: 'rejected' })
        .eq('id', mealPlanId);

      revalidatePath('/calendar');
      return { data: { autoApproved: false, autoRejected: true }, error: null };
    }

    return { data: { autoApproved: false, autoRejected: false }, error: null };
  } catch (error) {
    console.error('Error in checkVotingThreshold:', error);
    return { data: null, error: 'Failed to check voting threshold' };
  }
}

/**
 * Cast vote and check threshold in one action
 */
export async function castVoteAndCheckThreshold(
  input: CastVoteInput
): Promise<FamilyActionResponse<{
  vote: FamilyMealVote;
  autoApproved: boolean;
  autoRejected: boolean;
}>> {
  const voteResult = await castVote(input);

  if (voteResult.error || !voteResult.data) {
    return { data: null, error: voteResult.error };
  }

  const thresholdResult = await checkVotingThreshold(input.mealPlanId);

  return {
    data: {
      vote: voteResult.data,
      autoApproved: thresholdResult.data?.autoApproved || false,
      autoRejected: thresholdResult.data?.autoRejected || false,
    },
    error: null,
  };
}
