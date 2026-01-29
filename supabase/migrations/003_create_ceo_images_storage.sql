-- Migration: Create storage bucket for CEO images
-- Run this after 002_add_indexes_fix_rls.sql

-- Create storage bucket for CEO images (public for display)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ceo-images',
  'ceo-images',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'];

-- Allow public read access to CEO images
CREATE POLICY "Public read access for CEO images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ceo-images');

-- Allow service role to upload/update/delete CEO images
CREATE POLICY "Service role can upload CEO images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ceo-images'
    AND auth.role() = 'service_role'
  );

CREATE POLICY "Service role can update CEO images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'ceo-images'
    AND auth.role() = 'service_role'
  );

CREATE POLICY "Service role can delete CEO images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ceo-images'
    AND auth.role() = 'service_role'
  );

-- Add comment for documentation
COMMENT ON COLUMN applications.generated_image_url IS 'Permanent Supabase Storage URL for the generated CEO image';
