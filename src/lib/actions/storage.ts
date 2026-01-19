'use server';

import sharp from 'sharp';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Image size configurations
const IMAGE_SIZES = {
  thumbnail: { width: 300, height: 300 },
  standard: { width: 800, height: 600 },
  full: { width: 1920, height: 1440 },
} as const;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface ProcessedImages {
  thumbnail: Buffer;
  standard: Buffer;
  full: Buffer;
}

export interface UploadedImageUrls {
  thumbnailUrl: string;
  standardUrl: string;
  fullUrl: string;
}

/**
 * Validate uploaded file
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPG, PNG, WebP, or HEIC images.',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 10MB.',
    };
  }

  return { valid: true };
}

/**
 * Process image with Sharp to create multiple sizes
 */
async function processImage(buffer: Buffer): Promise<ProcessedImages> {
  // Convert to JPEG for consistency and smaller file sizes
  const baseImage = sharp(buffer).jpeg({ quality: 85 });

  const [thumbnail, standard, full] = await Promise.all([
    // Thumbnail - square crop, cover fit
    baseImage
      .clone()
      .resize(IMAGE_SIZES.thumbnail.width, IMAGE_SIZES.thumbnail.height, {
        fit: 'cover',
        position: 'center',
      })
      .toBuffer(),

    // Standard - maintain aspect ratio, fit within bounds
    baseImage
      .clone()
      .resize(IMAGE_SIZES.standard.width, IMAGE_SIZES.standard.height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer(),

    // Full - maintain aspect ratio, fit within max bounds
    baseImage
      .clone()
      .resize(IMAGE_SIZES.full.width, IMAGE_SIZES.full.height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer(),
  ]);

  return { thumbnail, standard, full };
}

/**
 * Generate unique filename for storage
 */
function generateFilename(userId: string, prefix: string, size: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${userId}/${prefix}-${size}-${timestamp}-${random}.jpg`;
}

/**
 * Upload recipe image with processing
 */
export async function uploadRecipeImage(
  recipeId: string,
  formData: FormData
): Promise<{ data?: UploadedImageUrls; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'You must be logged in to upload images' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { error: 'No file provided' };
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { error: validation.error };
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image into multiple sizes
    const processed = await processImage(buffer);

    // Generate filenames
    const prefix = `recipe-${recipeId}`;
    const thumbnailPath = generateFilename(user.id, prefix, 'thumb');
    const standardPath = generateFilename(user.id, prefix, 'std');
    const fullPath = generateFilename(user.id, prefix, 'full');

    // Upload all sizes in parallel
    const [thumbnailUpload, standardUpload, fullUpload] = await Promise.all([
      supabase.storage
        .from('recipe-images')
        .upload(thumbnailPath, processed.thumbnail, {
          contentType: 'image/jpeg',
          upsert: false,
        }),
      supabase.storage
        .from('recipe-images')
        .upload(standardPath, processed.standard, {
          contentType: 'image/jpeg',
          upsert: false,
        }),
      supabase.storage
        .from('recipe-images')
        .upload(fullPath, processed.full, {
          contentType: 'image/jpeg',
          upsert: false,
        }),
    ]);

    // Check for upload errors
    if (thumbnailUpload.error || standardUpload.error || fullUpload.error) {
      const error = thumbnailUpload.error || standardUpload.error || fullUpload.error;
      return { error: `Upload failed: ${error?.message}` };
    }

    // Get public URLs
    const { data: { publicUrl: thumbnailUrl } } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(thumbnailPath);

    const { data: { publicUrl: standardUrl } } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(standardPath);

    const { data: { publicUrl: fullUrl } } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(fullPath);

    revalidatePath(`/recipes/${recipeId}`);

    return {
      data: {
        thumbnailUrl,
        standardUrl,
        fullUrl,
      },
    };
  } catch (error) {
    console.error('Error uploading recipe image:', error);
    return { error: 'Failed to upload image. Please try again.' };
  }
}

/**
 * Delete recipe image from storage
 */
export async function deleteRecipeImage(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be logged in to delete images' };
    }

    // Extract path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/storage/v1/object/public/recipe-images/');
    if (pathParts.length !== 2) {
      return { success: false, error: 'Invalid image URL' };
    }

    const filePath = pathParts[1];

    // Verify user owns this file (path should start with user ID)
    if (!filePath.startsWith(user.id)) {
      return { success: false, error: 'You can only delete your own images' };
    }

    const { error } = await supabase.storage
      .from('recipe-images')
      .remove([filePath]);

    if (error) {
      return { success: false, error: `Delete failed: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting recipe image:', error);
    return { success: false, error: 'Failed to delete image. Please try again.' };
  }
}

/**
 * Upload cooking session photo
 */
export async function uploadCookingPhoto(
  sessionId: string,
  formData: FormData
): Promise<{ data?: UploadedImageUrls; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'You must be logged in to upload photos' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { error: 'No file provided' };
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { error: validation.error };
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image into multiple sizes
    const processed = await processImage(buffer);

    // Generate filenames
    const prefix = `cooking-${sessionId}`;
    const thumbnailPath = generateFilename(user.id, prefix, 'thumb');
    const standardPath = generateFilename(user.id, prefix, 'std');
    const fullPath = generateFilename(user.id, prefix, 'full');

    // Upload all sizes in parallel
    const [thumbnailUpload, standardUpload, fullUpload] = await Promise.all([
      supabase.storage
        .from('cooking-photos')
        .upload(thumbnailPath, processed.thumbnail, {
          contentType: 'image/jpeg',
          upsert: false,
        }),
      supabase.storage
        .from('cooking-photos')
        .upload(standardPath, processed.standard, {
          contentType: 'image/jpeg',
          upsert: false,
        }),
      supabase.storage
        .from('cooking-photos')
        .upload(fullPath, processed.full, {
          contentType: 'image/jpeg',
          upsert: false,
        }),
    ]);

    // Check for upload errors
    if (thumbnailUpload.error || standardUpload.error || fullUpload.error) {
      const error = thumbnailUpload.error || standardUpload.error || fullUpload.error;
      return { error: `Upload failed: ${error?.message}` };
    }

    // Get public URLs
    const { data: { publicUrl: thumbnailUrl } } = supabase.storage
      .from('cooking-photos')
      .getPublicUrl(thumbnailPath);

    const { data: { publicUrl: standardUrl } } = supabase.storage
      .from('cooking-photos')
      .getPublicUrl(standardPath);

    const { data: { publicUrl: fullUrl } } = supabase.storage
      .from('cooking-photos')
      .getPublicUrl(fullPath);

    revalidatePath('/cooking-history');

    return {
      data: {
        thumbnailUrl,
        standardUrl,
        fullUrl,
      },
    };
  } catch (error) {
    console.error('Error uploading cooking photo:', error);
    return { error: 'Failed to upload photo. Please try again.' };
  }
}

/**
 * Delete cooking photo from storage
 */
export async function deleteCookingPhoto(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'You must be logged in to delete photos' };
    }

    // Extract path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/storage/v1/object/public/cooking-photos/');
    if (pathParts.length !== 2) {
      return { success: false, error: 'Invalid photo URL' };
    }

    const filePath = pathParts[1];

    // Verify user owns this file
    if (!filePath.startsWith(user.id)) {
      return { success: false, error: 'You can only delete your own photos' };
    }

    const { error } = await supabase.storage
      .from('cooking-photos')
      .remove([filePath]);

    if (error) {
      return { success: false, error: `Delete failed: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting cooking photo:', error);
    return { success: false, error: 'Failed to delete photo. Please try again.' };
  }
}
