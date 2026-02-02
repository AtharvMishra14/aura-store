# Phase 2 Specification: Developer Dashboard (Web)

## Goal
Build a web-based dashboard where developers can log in, view their apps, and upload new versions (APK/IPA files).

## Tech Stack
- Framework: Next.js (App Router)
- Styling: Tailwind CSS (use "shadcn/ui" style aesthetics)
- Backend: Supabase (Auth + Database + Storage)

## Pages & Features

### 1. Authentication (`/login`)
- Simple login page using Supabase Auth.
- Support "Sign in with Email" (Magic Link) or Password.
- Once logged in, redirect to `/dashboard`.

### 2. Dashboard Home (`/dashboard`)
- Fetch the user's profile.
- If `is_developer` is false, show a "Become a Developer" button that updates the profile.
- Display a Grid of the user's uploaded apps (fetch from `apps` table).
- "Create New App" button at the top right.

### 3. Upload App Flow (`/dashboard/new`)
- A form with fields:
  - App Name (Text)
  - Description (Text Area)
  - Category (Dropdown)
  - Platform (Dropdown: Android/iOS)
  - Icon (File Upload -> Uploads to 'app-files' bucket)
  - App File (File Upload -> Uploads to 'app-files' bucket)
- **Logic:**
  1. Upload the files to Supabase Storage first.
  2. Get the public URLs.
  3. Insert a record into the `apps` table.
  4. Insert a record into the `app_versions` table with the file URL.

## Important Vibe Coding Rules
- Use `lucide-react` for icons.
- Ensure the Supabase client is initialized correctly in a `@/utils/supabase/client.ts` file.
- Handle file upload states (show a progress bar or "Uploading..." spinner).