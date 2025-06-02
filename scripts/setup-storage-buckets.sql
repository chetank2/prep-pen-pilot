-- Setup Storage Buckets for prep-pen-pilot
-- Run this in your Supabase SQL editor

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('knowledge-base-files', 'knowledge-base-files', true, 104857600, ARRAY[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/webm',
    'audio/mp3',
    'audio/wav',
    'audio/m4a',
    'audio/ogg'
  ]),
  ('user-content', 'user-content', true, 52428800, ARRAY[
    'application/json',
    'text/plain',
    'text/markdown',
    'image/jpeg',
    'image/png',
    'image/svg+xml'
  ]),
  ('thumbnails', 'thumbnails', true, 5242880, ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]),
  ('exports', 'exports', true, 104857600, ARRAY[
    'application/pdf',
    'application/json',
    'text/plain',
    'text/csv',
    'application/zip'
  ])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for storage buckets
-- Knowledge base files - authenticated users can manage their own files
CREATE POLICY "Users can upload knowledge base files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'knowledge-base-files');

CREATE POLICY "Users can view knowledge base files" ON storage.objects
  FOR SELECT USING (bucket_id = 'knowledge-base-files');

CREATE POLICY "Users can update knowledge base files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'knowledge-base-files');

CREATE POLICY "Users can delete knowledge base files" ON storage.objects
  FOR DELETE USING (bucket_id = 'knowledge-base-files');

-- User content - users can manage their own content
CREATE POLICY "Users can upload user content" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-content');

CREATE POLICY "Users can view user content" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-content');

CREATE POLICY "Users can update user content" ON storage.objects
  FOR UPDATE USING (bucket_id = 'user-content');

CREATE POLICY "Users can delete user content" ON storage.objects
  FOR DELETE USING (bucket_id = 'user-content');

-- Thumbnails - public read, authenticated write
CREATE POLICY "Anyone can view thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can upload thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Users can update thumbnails" ON storage.objects
  FOR UPDATE USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can delete thumbnails" ON storage.objects
  FOR DELETE USING (bucket_id = 'thumbnails');

-- Exports - users can manage their own exports
CREATE POLICY "Users can upload exports" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'exports');

CREATE POLICY "Users can view exports" ON storage.objects
  FOR SELECT USING (bucket_id = 'exports');

CREATE POLICY "Users can update exports" ON storage.objects
  FOR UPDATE USING (bucket_id = 'exports');

CREATE POLICY "Users can delete exports" ON storage.objects
  FOR DELETE USING (bucket_id = 'exports');

-- Enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create default user for demo purposes
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'demo@prep-pen-pilot.com',
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "system", "providers": ["system"]}',
  '{"name": "Demo User", "role": "demo"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Optionally create user profile entry
INSERT INTO public.user_profiles (
  id,
  email,
  full_name,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'demo@prep-pen-pilot.com',
  'Demo User',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON storage.buckets TO postgres, anon, authenticated, service_role;
GRANT ALL ON storage.objects TO postgres, anon, authenticated, service_role; 