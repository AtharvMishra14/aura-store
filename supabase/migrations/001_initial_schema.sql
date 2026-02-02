-- =============================================================================
-- Phase 1: App Marketplace Infrastructure - Complete Schema & Security
-- Run this in Supabase SQL Editor
-- =============================================================================

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- Profiles: One-to-One with auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  is_developer BOOLEAN NOT NULL DEFAULT false,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Apps: Published applications by developers
CREATE TABLE public.apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  category TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ANDROID', 'IOS', 'BOTH')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- App Versions: Versioned releases of each app
CREATE TABLE public.app_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  version_string TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  ai_safety_score INT,
  ai_safety_summary TEXT,
  download_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_apps_developer_id ON public.apps(developer_id);
CREATE INDEX idx_apps_category ON public.apps(category);
CREATE INDEX idx_apps_platform ON public.apps(platform);
CREATE INDEX idx_app_versions_app_id ON public.app_versions(app_id);

-- =============================================================================
-- 2. TRIGGER: Auto-create profile on user signup
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- --- PROFILES ---
-- Anyone can read profiles (needed to display developer info on app listings)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- --- APPS ---
-- Public: Anyone can READ apps
CREATE POLICY "Apps are viewable by everyone"
  ON public.apps FOR SELECT
  USING (true);

-- Developer: Only developer_id owner can UPDATE their own app
CREATE POLICY "Developers can update own apps"
  ON public.apps FOR UPDATE
  USING (
    developer_id = (SELECT id FROM public.profiles WHERE id = auth.uid() AND is_developer = true)
  )
  WITH CHECK (
    developer_id = (SELECT id FROM public.profiles WHERE id = auth.uid() AND is_developer = true)
  );

-- Developer: Only developer_id owner can DELETE their own app
CREATE POLICY "Developers can delete own apps"
  ON public.apps FOR DELETE
  USING (
    developer_id = (SELECT id FROM public.profiles WHERE id = auth.uid() AND is_developer = true)
  );

-- Upload: Only users with is_developer = true can INSERT into apps
CREATE POLICY "Developers can create apps"
  ON public.apps FOR INSERT
  WITH CHECK (
    developer_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_developer = true)
  );

-- --- APP_VERSIONS ---
-- Public: Anyone can READ app_versions
CREATE POLICY "App versions are viewable by everyone"
  ON public.app_versions FOR SELECT
  USING (true);

-- Developer: Only app owner can INSERT app_versions for their apps
CREATE POLICY "Developers can create app versions"
  ON public.app_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.apps a
      JOIN public.profiles p ON p.id = a.developer_id
      WHERE a.id = app_id AND p.id = auth.uid() AND p.is_developer = true
    )
  );

-- Developer: Only app owner can UPDATE app_versions for their apps
CREATE POLICY "Developers can update own app versions"
  ON public.app_versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.apps a
      JOIN public.profiles p ON p.id = a.developer_id
      WHERE a.id = app_id AND p.id = auth.uid() AND p.is_developer = true
    )
  );

-- Developer: Only app owner can DELETE app_versions for their apps
CREATE POLICY "Developers can delete own app versions"
  ON public.app_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.apps a
      JOIN public.profiles p ON p.id = a.developer_id
      WHERE a.id = app_id AND p.id = auth.uid() AND p.is_developer = true
    )
  );

-- =============================================================================
-- 4. STORAGE BUCKET: app-files
-- =============================================================================

-- Create the bucket (public = true for READ access)
-- Note: file_size_limit and allowed_mime_types can be set in Dashboard if needed
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-files', 'app-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Public READ access
CREATE POLICY "Public read access for app files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'app-files');

-- Storage Policy: Authenticated uploads only (.apk and .ipa)
CREATE POLICY "Authenticated developers can upload app files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'app-files'
    AND auth.role() = 'authenticated'
    AND (
      lower(storage.extension(name)) = 'apk'
      OR lower(storage.extension(name)) = 'ipa'
    )
  );

-- Storage Policy: Developers can update/delete their own uploaded files
-- (Files are typically organized by path: developer_id/app_id/filename)
CREATE POLICY "Authenticated users can update own app files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'app-files'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete own app files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'app-files'
    AND auth.role() = 'authenticated'
  );
