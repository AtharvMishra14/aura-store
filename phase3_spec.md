# Phase 3 Specification: Consumer Storefront & iOS API

## Goal
Build the public-facing "App Store" where users can download apps without logging in.
Build the "AltStore Source" API endpoint to support iOS sideloading.

## 1. Public Storefront (`/`)
- **Route:** Change the root page (`/`) to be the Storefront.
- **Features:**
  - **Hero Section:** "Welcome to Aura Store - The Open App Market."
  - **Search Bar:** Real-time search by app name.
  - **App Grid:** specific cards for each app.
  - **Download Logic:** When user clicks "Download":
    - If Android: Direct download of the .apk file.
    - If iOS: Show a modal saying "To install on iOS, add this source to AltStore" and provide the `/api/altstore/source.json` URL.
    - **Increment Counter:** Update the `download_count` in the `app_versions` table.

## 2. App Details Page (`/app/[id]`)
- Display full description, version history, and "AI Safety Rating" (placeholder for Phase 4).
- Big "Download" button.

## 3. iOS AltStore API (`/api/altstore/source.json`)
- **Route:** Create a Next.js Route Handler at `app/api/altstore/source.json/route.ts`.
- **Logic:**
  - Fetch all apps where `platform` is 'iOS' or 'BOTH'.
  - Output a JSON strictly following the AltStore Source format:
    ```json
    {
      "name": "Aura Store",
      "identifier": "com.aura.store",
      "apps": [
        {
          "name": "App Name",
          "bundleIdentifier": "com.example.app",
          "developerName": "Dev Name",
          "versions": [
            {
              "version": "1.0.0",
              "date": "2023-01-01",
              "downloadURL": "https://...",
              "size": 123456
            }
          ]
        }
      ]
    }
    ```
- **Important:** Use the public URL from Supabase Storage for `downloadURL`.

## 4. UI/UX
- Use the same "shadcn/ui" dark theme.
- The storefront must look like a consumer product (Netflix/App Store vibes), not a dashboard.