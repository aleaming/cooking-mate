'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  Recipe,
  RecipePhoto,
  UserRecipe,
  CreateRecipeInput,
  UpdateRecipeInput,
  RecipeSourceType,
} from '@/types/recipe';

/**
 * Generate a URL-friendly slug from a recipe name
 */
function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const uniqueSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${uniqueSuffix}`;
}

/**
 * Generate a unique recipe ID
 */
function generateRecipeId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `user-${timestamp}-${random}`;
}

/**
 * Create a new user recipe
 */
export async function createUserRecipe(
  data: CreateRecipeInput
): Promise<{ data?: Recipe; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'You must be logged in to create recipes' };
    }

    const recipeId = generateRecipeId();
    const slug = data.slug || generateSlug(data.name);
    const now = new Date().toISOString();

    // Insert the recipe
    const { data: recipe, error: insertError } = await supabase
      .from('recipes')
      .insert({
        id: recipeId,
        slug,
        name: data.name,
        description: data.description,
        image_url: data.imageUrl || null,
        prep_time_minutes: data.prepTimeMinutes,
        cook_time_minutes: data.cookTimeMinutes,
        servings: data.servings,
        meal_type: data.mealType,
        cuisine: data.cuisine || 'Mediterranean',
        dietary_tags: data.dietaryTags || [],
        difficulty: data.difficulty || 'medium',
        instructions: data.instructions.map((inst) => ({
          step: inst.step,
          text: inst.text,
          duration: inst.duration,
          tip: inst.tip,
        })),
        tips: data.tips || null,
        nutrition: data.nutrition || null,
        owner_id: user.id,
        is_system: false,
        is_public: false,
        is_featured: false,
        source_url: data.sourceUrl || null,
        source_type: data.sourceType || 'manual',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating recipe:', insertError);
      return { error: `Failed to create recipe: ${insertError.message}` };
    }

    // Insert ingredients
    if (data.ingredients.length > 0) {
      const ingredientInserts = data.ingredients.map((ing, index) => ({
        recipe_id: recipeId,
        // Allow null for user-imported ingredients (no master ingredient link)
        ingredient_id: ing.ingredientId ?? null,
        display_name: ing.name,
        category: ing.category || 'other',
        quantity: ing.quantity,
        unit: ing.unit,
        preparation: ing.preparation || null,
        notes: ing.notes || null,
        sort_order: index,
      }));

      const { error: ingredientError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientInserts);

      if (ingredientError) {
        console.error('Error inserting ingredients:', ingredientError);
        return { error: `Failed to save ingredients: ${ingredientError.message}` };
      }
    }

    revalidatePath('/recipes');
    revalidatePath('/recipes/my-recipes');

    // Convert to Recipe type
    const createdRecipe: Recipe = {
      id: recipe.id,
      slug: recipe.slug,
      name: recipe.name,
      description: recipe.description,
      imageUrl: recipe.image_url || '',
      prepTimeMinutes: recipe.prep_time_minutes,
      cookTimeMinutes: recipe.cook_time_minutes,
      totalTimeMinutes: recipe.prep_time_minutes + recipe.cook_time_minutes,
      servings: recipe.servings,
      mealType: recipe.meal_type,
      cuisine: recipe.cuisine,
      dietaryTags: recipe.dietary_tags || [],
      difficulty: recipe.difficulty,
      ingredients: data.ingredients,
      instructions: data.instructions,
      tips: recipe.tips,
      nutrition: recipe.nutrition,
      isFeatured: false,
      createdAt: recipe.created_at,
      updatedAt: recipe.updated_at,
    };

    return { data: createdRecipe };
  } catch (error) {
    console.error('Error in createUserRecipe:', error);
    return { error: 'Failed to create recipe. Please try again.' };
  }
}

/**
 * Update a user recipe
 */
export async function updateUserRecipe(
  data: UpdateRecipeInput
): Promise<{ data?: Recipe; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'You must be logged in to update recipes' };
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('recipes')
      .select('owner_id, is_system')
      .eq('id', data.id)
      .single();

    if (!existing || existing.owner_id !== user.id || existing.is_system) {
      return { error: 'You can only update your own recipes' };
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.imageUrl !== undefined) updates.image_url = data.imageUrl;
    if (data.prepTimeMinutes !== undefined) updates.prep_time_minutes = data.prepTimeMinutes;
    if (data.cookTimeMinutes !== undefined) updates.cook_time_minutes = data.cookTimeMinutes;
    if (data.servings !== undefined) updates.servings = data.servings;
    if (data.mealType !== undefined) updates.meal_type = data.mealType;
    if (data.cuisine !== undefined) updates.cuisine = data.cuisine;
    if (data.dietaryTags !== undefined) updates.dietary_tags = data.dietaryTags;
    if (data.difficulty !== undefined) updates.difficulty = data.difficulty;
    if (data.tips !== undefined) updates.tips = data.tips;
    if (data.nutrition !== undefined) updates.nutrition = data.nutrition;

    if (data.instructions !== undefined) {
      updates.instructions = data.instructions.map((inst) => ({
        step: inst.step,
        text: inst.text,
        duration: inst.duration,
        tip: inst.tip,
      }));
    }

    const { data: recipe, error: updateError } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', data.id)
      .select()
      .single();

    if (updateError) {
      return { error: `Failed to update recipe: ${updateError.message}` };
    }

    // Update ingredients if provided
    if (data.ingredients !== undefined) {
      // Delete existing ingredients
      await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', data.id);

      // Insert new ingredients
      if (data.ingredients.length > 0) {
        const ingredientInserts = data.ingredients.map((ing, index) => ({
          recipe_id: data.id,
          // Allow null for user-imported ingredients (no master ingredient link)
          ingredient_id: ing.ingredientId ?? null,
          display_name: ing.name,
          category: ing.category || 'other',
          quantity: ing.quantity,
          unit: ing.unit,
          preparation: ing.preparation || null,
          notes: ing.notes || null,
          sort_order: index,
        }));

        const { error: ingredientError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientInserts);

        if (ingredientError) {
          console.error('Error updating ingredients:', ingredientError);
        }
      }
    }

    revalidatePath(`/recipes/${data.id}`);
    revalidatePath('/recipes/my-recipes');

    return {
      data: {
        id: recipe.id,
        slug: recipe.slug,
        name: recipe.name,
        description: recipe.description,
        imageUrl: recipe.image_url || '',
        prepTimeMinutes: recipe.prep_time_minutes,
        cookTimeMinutes: recipe.cook_time_minutes,
        totalTimeMinutes: recipe.prep_time_minutes + recipe.cook_time_minutes,
        servings: recipe.servings,
        mealType: recipe.meal_type,
        cuisine: recipe.cuisine,
        dietaryTags: recipe.dietary_tags || [],
        difficulty: recipe.difficulty,
        ingredients: data.ingredients || [],
        instructions: recipe.instructions || [],
        tips: recipe.tips,
        nutrition: recipe.nutrition,
        isFeatured: false,
        createdAt: recipe.created_at,
        updatedAt: recipe.updated_at,
      },
    };
  } catch (error) {
    console.error('Error in updateUserRecipe:', error);
    return { error: 'Failed to update recipe. Please try again.' };
  }
}

/**
 * Delete a user recipe
 */
export async function deleteUserRecipe(
  recipeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be logged in to delete recipes' };
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('recipes')
      .select('owner_id, is_system')
      .eq('id', recipeId)
      .single();

    if (!existing || existing.owner_id !== user.id || existing.is_system) {
      return { success: false, error: 'You can only delete your own recipes' };
    }

    // Delete recipe (cascade will handle ingredients and photos)
    const { error: deleteError } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (deleteError) {
      return { success: false, error: `Failed to delete recipe: ${deleteError.message}` };
    }

    revalidatePath('/recipes');
    revalidatePath('/recipes/my-recipes');

    return { success: true };
  } catch (error) {
    console.error('Error in deleteUserRecipe:', error);
    return { success: false, error: 'Failed to delete recipe. Please try again.' };
  }
}

/**
 * Get all recipes created by the current user
 */
export async function getUserRecipes(): Promise<{ data?: UserRecipe[]; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'You must be logged in to view your recipes' };
    }

    // Use the database function to get recipes with primary photos
    const { data: recipes, error } = await supabase.rpc('get_user_recipes', {
      p_user_id: user.id,
    });

    if (error) {
      return { error: `Failed to fetch recipes: ${error.message}` };
    }

    // Fetch ingredients for each recipe
    const recipeIds = recipes.map((r: { id: string }) => r.id);
    const { data: allIngredients } = await supabase
      .from('recipe_ingredients')
      .select('*')
      .in('recipe_id', recipeIds)
      .order('sort_order');

    // Group ingredients by recipe
    const ingredientsByRecipe = new Map<string, typeof allIngredients>();
    allIngredients?.forEach((ing) => {
      const existing = ingredientsByRecipe.get(ing.recipe_id) || [];
      existing.push(ing);
      ingredientsByRecipe.set(ing.recipe_id, existing);
    });

    // Transform to UserRecipe type
    const userRecipes: UserRecipe[] = recipes.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      slug: r.slug as string,
      name: r.name as string,
      description: r.description as string,
      imageUrl: (r.primary_photo_url || r.image_url || '') as string,
      prepTimeMinutes: r.prep_time_minutes as number,
      cookTimeMinutes: r.cook_time_minutes as number,
      totalTimeMinutes: r.total_time_minutes as number,
      servings: r.servings as number,
      mealType: r.meal_type as Recipe['mealType'],
      cuisine: 'Mediterranean',
      dietaryTags: (r.dietary_tags || []) as Recipe['dietaryTags'],
      difficulty: r.difficulty as Recipe['difficulty'],
      ingredients: (ingredientsByRecipe.get(r.id as string) || []).map((ing: Record<string, unknown>) => ({
        id: ing.id,
        ingredientId: ing.ingredient_id,
        name: ing.display_name,
        category: ing.category,
        quantity: ing.quantity,
        unit: ing.unit,
        preparation: ing.preparation,
        notes: ing.notes,
      })),
      instructions: [],
      isFeatured: false,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
      ownerId: user.id,
      sourceUrl: r.source_url as string | undefined,
      sourceType: (r.source_type || 'manual') as RecipeSourceType,
      photos: [],
      isSystem: false,
      isPublic: false,
    }));

    return { data: userRecipes };
  } catch (error) {
    console.error('Error in getUserRecipes:', error);
    return { error: 'Failed to fetch your recipes. Please try again.' };
  }
}

/**
 * Get all recipes from family members (excluding current user's own)
 * Returns recipes with owner attribution for display in the calendar sidebar
 */
export async function getFamilyRecipes(
  familyId: string
): Promise<{ data?: Array<Recipe & { ownerName: string }>; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'You must be logged in to view family recipes' };
    }

    const { data, error } = await supabase.rpc('get_family_recipes', {
      p_family_id: familyId,
    });

    if (error) {
      console.error('Error fetching family recipes:', error);
      return { error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [] };
    }

    // Fetch ingredients for all family recipes in one query
    const recipeIds = data.map((row: { recipe_id: string }) => row.recipe_id);
    const { data: allIngredients } = await supabase
      .from('recipe_ingredients')
      .select('*')
      .in('recipe_id', recipeIds)
      .order('sort_order');

    // Group ingredients by recipe
    const ingredientsByRecipe = new Map<string, typeof allIngredients>();
    allIngredients?.forEach((ing) => {
      const existing = ingredientsByRecipe.get(ing.recipe_id) || [];
      existing.push(ing);
      ingredientsByRecipe.set(ing.recipe_id, existing);
    });

    // Transform rows into Recipe objects with ownerName
    const recipes: Array<Recipe & { ownerName: string }> = data.map(
      (row: {
        recipe_id: string;
        recipe_data: Record<string, unknown>;
        owner_display_name: string;
      }) => {
        const rd = row.recipe_data;
        const ings = ingredientsByRecipe.get(row.recipe_id) || [];

        return {
          id: row.recipe_id,
          slug: (rd.slug || '') as string,
          name: (rd.name || '') as string,
          description: (rd.description || '') as string,
          imageUrl: (rd.image_url || '') as string,
          prepTimeMinutes: (rd.prep_time_minutes || 0) as number,
          cookTimeMinutes: (rd.cook_time_minutes || 0) as number,
          totalTimeMinutes: (rd.total_time_minutes || 0) as number,
          servings: (rd.servings || 4) as number,
          mealType: (rd.meal_type || 'dinner') as Recipe['mealType'],
          cuisine: (rd.cuisine || 'Mediterranean') as string,
          dietaryTags: (rd.dietary_tags || []) as Recipe['dietaryTags'],
          difficulty: (rd.difficulty || 'medium') as Recipe['difficulty'],
          ingredients: (ings as Record<string, unknown>[]).map((ing) => ({
            id: ing.id as string,
            ingredientId: ing.ingredient_id as string | null,
            name: ing.display_name as string,
            category: ing.category as string,
            quantity: ing.quantity as number | null,
            unit: ing.unit as string | null,
            preparation: ing.preparation as string | null,
            notes: ing.notes as string | null,
          })),
          instructions: [],
          isFeatured: false,
          ownerName: row.owner_display_name,
        };
      }
    );

    return { data: recipes };
  } catch (error) {
    console.error('Error in getFamilyRecipes:', error);
    return { error: 'Failed to fetch family recipes. Please try again.' };
  }
}

/**
 * Get a single user recipe by ID
 */
export async function getUserRecipeById(
  recipeId: string
): Promise<{ data?: UserRecipe; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'You must be logged in to view recipes' };
    }

    // Use the database function to get recipe with photos
    const { data, error } = await supabase.rpc('get_recipe_with_photos', {
      p_recipe_id: recipeId,
    });

    if (error || !data || data.length === 0) {
      return { error: 'Recipe not found' };
    }

    const result = data[0];
    const recipe = result.recipe;
    const photos = result.photos || [];

    // Verify ownership, public/system, or family membership
    if (recipe.owner_id !== user.id && !recipe.is_public && !recipe.is_system) {
      // Check if user shares a family with the recipe owner
      const { data: userFamilies } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id);

      const { data: ownerFamilies } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', recipe.owner_id);

      const userFamilyIds = new Set((userFamilies || []).map((f: { family_id: string }) => f.family_id));
      const isInSameFamily = (ownerFamilies || []).some((f: { family_id: string }) => userFamilyIds.has(f.family_id));

      if (!isInSameFamily) {
        return { error: 'You do not have access to this recipe' };
      }
    }

    // Fetch ingredients
    const { data: ingredients } = await supabase
      .from('recipe_ingredients')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('sort_order');

    const userRecipe: UserRecipe = {
      id: recipe.id,
      slug: recipe.slug,
      name: recipe.name,
      description: recipe.description,
      imageUrl: recipe.image_url || '',
      prepTimeMinutes: recipe.prep_time_minutes,
      cookTimeMinutes: recipe.cook_time_minutes,
      totalTimeMinutes: recipe.prep_time_minutes + recipe.cook_time_minutes,
      servings: recipe.servings,
      mealType: recipe.meal_type,
      cuisine: recipe.cuisine || 'Mediterranean',
      dietaryTags: recipe.dietary_tags || [],
      difficulty: recipe.difficulty,
      ingredients: (ingredients || []).map((ing) => ({
        id: ing.id,
        ingredientId: ing.ingredient_id,
        name: ing.display_name,
        category: ing.category,
        quantity: ing.quantity,
        unit: ing.unit,
        preparation: ing.preparation,
        notes: ing.notes,
      })),
      instructions: recipe.instructions || [],
      tips: recipe.tips,
      nutrition: recipe.nutrition,
      isFeatured: recipe.is_featured,
      createdAt: recipe.created_at,
      updatedAt: recipe.updated_at,
      ownerId: recipe.owner_id,
      sourceUrl: recipe.source_url,
      sourceType: recipe.source_type || 'manual',
      photos: photos.map((p: Record<string, unknown>) => ({
        id: p.id,
        url: p.url,
        thumbnailUrl: p.thumbnail_url,
        standardUrl: p.standard_url,
        isPrimary: p.is_primary,
        sortOrder: p.sort_order,
      })),
      isSystem: recipe.is_system,
      isPublic: recipe.is_public,
    };

    return { data: userRecipe };
  } catch (error) {
    console.error('Error in getUserRecipeById:', error);
    return { error: 'Failed to fetch recipe. Please try again.' };
  }
}

/**
 * Add a photo to a recipe
 */
export async function addRecipePhoto(
  recipeId: string,
  url: string,
  thumbnailUrl?: string,
  standardUrl?: string,
  isPrimary: boolean = false
): Promise<{ data?: RecipePhoto; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'You must be logged in to add photos' };
    }

    // Get current max sort order
    const { data: existing } = await supabase
      .from('recipe_photos')
      .select('sort_order')
      .eq('recipe_id', recipeId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const sortOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

    // If this is primary, unset other primaries first
    if (isPrimary) {
      await supabase
        .from('recipe_photos')
        .update({ is_primary: false })
        .eq('recipe_id', recipeId);
    }

    const { data: photo, error: insertError } = await supabase
      .from('recipe_photos')
      .insert({
        recipe_id: recipeId,
        url,
        thumbnail_url: thumbnailUrl,
        standard_url: standardUrl,
        is_primary: isPrimary,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (insertError) {
      return { error: `Failed to add photo: ${insertError.message}` };
    }

    revalidatePath(`/recipes/${recipeId}`);

    return {
      data: {
        id: photo.id,
        url: photo.url,
        thumbnailUrl: photo.thumbnail_url,
        standardUrl: photo.standard_url,
        isPrimary: photo.is_primary,
        sortOrder: photo.sort_order,
        createdAt: photo.created_at,
      },
    };
  } catch (error) {
    console.error('Error in addRecipePhoto:', error);
    return { error: 'Failed to add photo. Please try again.' };
  }
}

/**
 * Remove a photo from a recipe
 */
export async function removeRecipePhoto(
  recipeId: string,
  photoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be logged in to remove photos' };
    }

    const { error: deleteError } = await supabase
      .from('recipe_photos')
      .delete()
      .eq('id', photoId)
      .eq('recipe_id', recipeId);

    if (deleteError) {
      return { success: false, error: `Failed to remove photo: ${deleteError.message}` };
    }

    revalidatePath(`/recipes/${recipeId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in removeRecipePhoto:', error);
    return { success: false, error: 'Failed to remove photo. Please try again.' };
  }
}

/**
 * Set a photo as the primary photo for a recipe
 */
export async function setPrimaryPhoto(
  recipeId: string,
  photoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be logged in to update photos' };
    }

    // Use the database function
    const { error } = await supabase.rpc('set_primary_photo', {
      p_photo_id: photoId,
      p_recipe_id: recipeId,
    });

    if (error) {
      return { success: false, error: `Failed to set primary photo: ${error.message}` };
    }

    revalidatePath(`/recipes/${recipeId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in setPrimaryPhoto:', error);
    return { success: false, error: 'Failed to update photo. Please try again.' };
  }
}

/**
 * Reorder photos for a recipe
 */
export async function reorderPhotos(
  recipeId: string,
  photoIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be logged in to reorder photos' };
    }

    // Update sort order for each photo
    const updates = photoIds.map((id, index) =>
      supabase
        .from('recipe_photos')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('recipe_id', recipeId)
    );

    await Promise.all(updates);

    revalidatePath(`/recipes/${recipeId}`);

    return { success: true };
  } catch (error) {
    console.error('Error in reorderPhotos:', error);
    return { success: false, error: 'Failed to reorder photos. Please try again.' };
  }
}
