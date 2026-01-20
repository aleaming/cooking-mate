'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  FamilyMealPlan,
  FamilyMealPlanWithDetails,
  FamilyDayMealPlan,
  ProposeFamilyMealInput,
  FamilyMealPlanQuery,
  FamilyActionResponse,
  MealPlanStatus,
  VoteSummary,
  VoteType,
} from '@/types/family';
import type { MealSlotType } from '@/types/mealPlan';

// ============================================================
// FAMILY MEAL PLAN OPERATIONS
// ============================================================

/**
 * Propose a new family meal for a specific date and meal type
 */
export async function proposeFamilyMeal(
  input: ProposeFamilyMealInput
): Promise<FamilyActionResponse<FamilyMealPlan>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in to propose meals' };
    }

    // Verify user is a member who can propose meals (voter or higher)
    const { data: canVote } = await supabase.rpc('can_vote_in_family', {
      p_family_id: input.familyId,
      p_user_id: user.id,
    });

    if (!canVote) {
      return { data: null, error: 'You do not have permission to propose meals' };
    }

    // Check if there's already a meal planned for this slot
    const { data: existingMeal } = await supabase
      .from('family_meal_plans')
      .select('id')
      .eq('family_id', input.familyId)
      .eq('plan_date', input.planDate)
      .eq('meal_type', input.mealType)
      .single();

    if (existingMeal) {
      return { data: null, error: 'A meal is already planned for this slot. Remove it first.' };
    }

    const { data: mealPlan, error: insertError } = await supabase
      .from('family_meal_plans')
      .insert({
        family_id: input.familyId,
        plan_date: input.planDate,
        meal_type: input.mealType,
        recipe_id: input.recipeId,
        servings: input.servings || 4,
        created_by: user.id,
        status: 'proposed',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error proposing meal:', insertError);
      return { data: null, error: `Failed to propose meal: ${insertError.message}` };
    }

    revalidatePath('/calendar');
    revalidatePath(`/family/${input.familyId}`);

    return {
      data: {
        id: mealPlan.id,
        familyId: mealPlan.family_id,
        planDate: mealPlan.plan_date,
        mealType: mealPlan.meal_type as MealSlotType,
        recipeId: mealPlan.recipe_id,
        servings: mealPlan.servings,
        createdBy: mealPlan.created_by,
        status: mealPlan.status as MealPlanStatus,
        createdAt: mealPlan.created_at,
        updatedAt: mealPlan.updated_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in proposeFamilyMeal:', error);
    return { data: null, error: 'Failed to propose meal. Please try again.' };
  }
}

/**
 * Get family meal plans for a date range
 */
export async function getFamilyMealPlans(
  query: FamilyMealPlanQuery
): Promise<FamilyActionResponse<FamilyMealPlanWithDetails[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Verify user is a member
    const { data: isMember } = await supabase.rpc('is_family_member', {
      p_family_id: query.familyId,
      p_user_id: user.id,
    });

    if (!isMember) {
      return { data: null, error: 'You are not a member of this family' };
    }

    let queryBuilder = supabase
      .from('family_meal_plans')
      .select(`
        *,
        created_by_profile:profiles!family_meal_plans_created_by_fkey(email, display_name, avatar_url)
      `)
      .eq('family_id', query.familyId)
      .gte('plan_date', query.startDate)
      .lte('plan_date', query.endDate)
      .order('plan_date', { ascending: true });

    if (query.status && query.status !== 'all') {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    const { data: mealPlans, error: fetchError } = await queryBuilder;

    if (fetchError) {
      return { data: null, error: `Failed to fetch meal plans: ${fetchError.message}` };
    }

    // Get vote summaries for all meal plans
    const mealPlanIds = mealPlans?.map((mp) => mp.id) || [];
    const voteSummaries = new Map<string, VoteSummary>();

    if (mealPlanIds.length > 0) {
      // Get all votes for these meal plans
      const { data: votes } = await supabase
        .from('family_meal_votes')
        .select('meal_plan_id, user_id, vote')
        .in('meal_plan_id', mealPlanIds);

      // Aggregate votes by meal plan
      mealPlanIds.forEach((id) => {
        const planVotes = votes?.filter((v) => v.meal_plan_id === id) || [];
        const summary: VoteSummary = {
          approveCount: planVotes.filter((v) => v.vote === 'approve').length,
          rejectCount: planVotes.filter((v) => v.vote === 'reject').length,
          abstainCount: planVotes.filter((v) => v.vote === 'abstain').length,
          totalVotes: planVotes.length,
          userVote: planVotes.find((v) => v.user_id === user.id)?.vote as VoteType | undefined,
        };
        voteSummaries.set(id, summary);
      });
    }

    // Transform to FamilyMealPlanWithDetails
    const result: FamilyMealPlanWithDetails[] = (mealPlans || []).map((mp) => ({
      id: mp.id,
      familyId: mp.family_id,
      planDate: mp.plan_date,
      mealType: mp.meal_type as MealSlotType,
      recipeId: mp.recipe_id,
      servings: mp.servings,
      createdBy: mp.created_by,
      status: mp.status as MealPlanStatus,
      createdAt: mp.created_at,
      updatedAt: mp.updated_at,
      createdByProfile: mp.created_by_profile ? {
        email: mp.created_by_profile.email,
        displayName: mp.created_by_profile.display_name,
        avatarUrl: mp.created_by_profile.avatar_url,
      } : undefined,
      votes: voteSummaries.get(mp.id) || {
        approveCount: 0,
        rejectCount: 0,
        abstainCount: 0,
        totalVotes: 0,
      },
    }));

    return { data: result, error: null };
  } catch (error) {
    console.error('Error in getFamilyMealPlans:', error);
    return { data: null, error: 'Failed to fetch meal plans. Please try again.' };
  }
}

/**
 * Get family meal plans organized by day for calendar display
 */
export async function getFamilyCalendar(
  familyId: string,
  startDate: string,
  endDate: string
): Promise<FamilyActionResponse<Map<string, FamilyDayMealPlan>>> {
  const result = await getFamilyMealPlans({
    familyId,
    startDate,
    endDate,
    status: 'all',
  });

  if (result.error || !result.data) {
    return { data: null, error: result.error };
  }

  // Organize by date
  const calendar = new Map<string, FamilyDayMealPlan>();

  result.data.forEach((meal) => {
    const existing = calendar.get(meal.planDate) || {
      date: meal.planDate,
      breakfast: null,
      lunch: null,
      dinner: null,
    };

    if (meal.mealType === 'breakfast') existing.breakfast = meal;
    else if (meal.mealType === 'lunch') existing.lunch = meal;
    else if (meal.mealType === 'dinner') existing.dinner = meal;

    calendar.set(meal.planDate, existing);
  });

  return { data: calendar, error: null };
}

/**
 * Remove a family meal plan
 */
export async function removeFamilyMeal(
  mealPlanId: string
): Promise<FamilyActionResponse<void>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Get the meal plan
    const { data: mealPlan } = await supabase
      .from('family_meal_plans')
      .select('family_id, created_by')
      .eq('id', mealPlanId)
      .single();

    if (!mealPlan) {
      return { data: null, error: 'Meal plan not found' };
    }

    // Check permissions - proposer or admin can remove
    const isProposer = mealPlan.created_by === user.id;
    const { data: canManage } = await supabase.rpc('can_manage_family', {
      p_family_id: mealPlan.family_id,
      p_user_id: user.id,
    });

    if (!isProposer && !canManage) {
      return { data: null, error: 'You do not have permission to remove this meal' };
    }

    const { error: deleteError } = await supabase
      .from('family_meal_plans')
      .delete()
      .eq('id', mealPlanId);

    if (deleteError) {
      return { data: null, error: `Failed to remove meal: ${deleteError.message}` };
    }

    revalidatePath('/calendar');
    revalidatePath(`/family/${mealPlan.family_id}`);

    return { data: null, error: null };
  } catch (error) {
    console.error('Error in removeFamilyMeal:', error);
    return { data: null, error: 'Failed to remove meal. Please try again.' };
  }
}

/**
 * Update meal plan status (approve/reject)
 * Only owners/admins can directly change status
 */
export async function updateMealStatus(
  mealPlanId: string,
  status: MealPlanStatus
): Promise<FamilyActionResponse<FamilyMealPlan>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Get the meal plan
    const { data: mealPlan } = await supabase
      .from('family_meal_plans')
      .select('*')
      .eq('id', mealPlanId)
      .single();

    if (!mealPlan) {
      return { data: null, error: 'Meal plan not found' };
    }

    // Only admins/owners can directly change status
    const { data: canManage } = await supabase.rpc('can_manage_family', {
      p_family_id: mealPlan.family_id,
      p_user_id: user.id,
    });

    if (!canManage) {
      return { data: null, error: 'Only admins can directly approve or reject meals' };
    }

    const { data: updated, error: updateError } = await supabase
      .from('family_meal_plans')
      .update({ status })
      .eq('id', mealPlanId)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: `Failed to update status: ${updateError.message}` };
    }

    revalidatePath('/calendar');
    revalidatePath(`/family/${mealPlan.family_id}`);

    return {
      data: {
        id: updated.id,
        familyId: updated.family_id,
        planDate: updated.plan_date,
        mealType: updated.meal_type as MealSlotType,
        recipeId: updated.recipe_id,
        servings: updated.servings,
        createdBy: updated.created_by,
        status: updated.status as MealPlanStatus,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in updateMealStatus:', error);
    return { data: null, error: 'Failed to update meal status. Please try again.' };
  }
}

/**
 * Update meal plan servings
 */
export async function updateMealServings(
  mealPlanId: string,
  servings: number
): Promise<FamilyActionResponse<FamilyMealPlan>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    // Get the meal plan
    const { data: mealPlan } = await supabase
      .from('family_meal_plans')
      .select('*')
      .eq('id', mealPlanId)
      .single();

    if (!mealPlan) {
      return { data: null, error: 'Meal plan not found' };
    }

    // Proposer or admin can update servings
    const isProposer = mealPlan.created_by === user.id;
    const { data: canManage } = await supabase.rpc('can_manage_family', {
      p_family_id: mealPlan.family_id,
      p_user_id: user.id,
    });

    if (!isProposer && !canManage) {
      return { data: null, error: 'You do not have permission to update this meal' };
    }

    if (servings < 1 || servings > 50) {
      return { data: null, error: 'Servings must be between 1 and 50' };
    }

    const { data: updated, error: updateError } = await supabase
      .from('family_meal_plans')
      .update({ servings })
      .eq('id', mealPlanId)
      .select()
      .single();

    if (updateError) {
      return { data: null, error: `Failed to update servings: ${updateError.message}` };
    }

    revalidatePath('/calendar');

    return {
      data: {
        id: updated.id,
        familyId: updated.family_id,
        planDate: updated.plan_date,
        mealType: updated.meal_type as MealSlotType,
        recipeId: updated.recipe_id,
        servings: updated.servings,
        createdBy: updated.created_by,
        status: updated.status as MealPlanStatus,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in updateMealServings:', error);
    return { data: null, error: 'Failed to update servings. Please try again.' };
  }
}

/**
 * Get a single meal plan by ID
 */
export async function getFamilyMealPlanById(
  mealPlanId: string
): Promise<FamilyActionResponse<FamilyMealPlanWithDetails>> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be logged in' };
    }

    const { data: mealPlan, error: fetchError } = await supabase
      .from('family_meal_plans')
      .select(`
        *,
        created_by_profile:profiles!family_meal_plans_created_by_fkey(email, display_name, avatar_url)
      `)
      .eq('id', mealPlanId)
      .single();

    if (fetchError || !mealPlan) {
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

    // Get vote summary
    const { data: voteData } = await supabase.rpc('get_meal_vote_counts', {
      p_meal_plan_id: mealPlanId,
    });

    // Get user's vote
    const { data: userVoteData } = await supabase
      .from('family_meal_votes')
      .select('vote')
      .eq('meal_plan_id', mealPlanId)
      .eq('user_id', user.id)
      .single();

    const votes: VoteSummary = {
      approveCount: voteData?.[0]?.approve_count || 0,
      rejectCount: voteData?.[0]?.reject_count || 0,
      abstainCount: voteData?.[0]?.abstain_count || 0,
      totalVotes: voteData?.[0]?.total_votes || 0,
      userVote: userVoteData?.vote as VoteType | undefined,
    };

    return {
      data: {
        id: mealPlan.id,
        familyId: mealPlan.family_id,
        planDate: mealPlan.plan_date,
        mealType: mealPlan.meal_type as MealSlotType,
        recipeId: mealPlan.recipe_id,
        servings: mealPlan.servings,
        createdBy: mealPlan.created_by,
        status: mealPlan.status as MealPlanStatus,
        createdAt: mealPlan.created_at,
        updatedAt: mealPlan.updated_at,
        createdByProfile: mealPlan.created_by_profile ? {
          email: mealPlan.created_by_profile.email,
          displayName: mealPlan.created_by_profile.display_name,
          avatarUrl: mealPlan.created_by_profile.avatar_url,
        } : undefined,
        votes,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in getFamilyMealPlanById:', error);
    return { data: null, error: 'Failed to fetch meal plan. Please try again.' };
  }
}
