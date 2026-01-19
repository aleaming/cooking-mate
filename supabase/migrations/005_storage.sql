-- Migration: 005_storage.sql
-- Description: Create storage buckets for recipe images and user photos
-- Date: 2026-01-18

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'recipe-images',
    'recipe-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'cooking-photos',
    'cooking-photos',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  )
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS Policies for recipe-images bucket

-- Allow public read access to all recipe images
CREATE POLICY "Recipe images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipe-images');

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload recipe images to their folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recipe-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own images
CREATE POLICY "Users can update their own recipe images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'recipe-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own recipe images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recipe-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policies for cooking-photos bucket

-- Allow public read access to all cooking photos
CREATE POLICY "Cooking photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'cooking-photos');

-- Allow authenticated users to upload photos to their own folder
CREATE POLICY "Users can upload cooking photos to their folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cooking-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own photos
CREATE POLICY "Users can update their own cooking photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cooking-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own cooking photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cooking-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
