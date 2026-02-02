# Phase 1 Specification: App Marketplace Infrastructure

## Project Overview
We are building a cross-platform App Marketplace (Android/iOS) with an AI security layer.
This phase focuses strictly on setting up the Database Schema and Storage Buckets using Supabase.

## Tech Stack
- **Database:** PostgreSQL (via Supabase)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage

## 1. Database Schema Requirements
Please write a SQL script to generate the following tables. Use UUIDs for primary keys.

### Table: `profiles`
- Links to `auth.users` (One-to-One).
- `username` (text, unique).
- `is_developer` (boolean, default false).
- `website_url` (text, nullable).

### Table: `apps`
- `id` (UUID).
- `developer_id` (UUID, Foreign Key to profiles).
- `title` (text).
- `description` (text).
- `icon_url` (text).
- `category` (text).
- `platform` (text - 'ANDROID', 'IOS', or 'BOTH').
- `created_at` (timestamp).

### Table: `app_versions`
- `id` (UUID).
- `app_id` (UUID, Foreign Key to apps).
- `version_string` (text, e.g., "1.0.2").
- `file_url` (text - link to the APK/IPA file).
- `file_size_bytes` (bigint).
- `ai_safety_score` (int, nullable - reserved for Phase 4).
- `ai_safety_summary` (text, nullable - reserved for Phase 4).
- `download_count` (int, default 0).

## 2. Row Level Security (RLS) Policies
- **Public Access:** Anyone can READ `apps` and `app_versions`.
- **Developer Access:** Only the `developer_id` owner can UPDATE or DELETE their own app.
- **Upload Access:** Only users with `is_developer = true` can INSERT into `apps`.

## 3. Storage Buckets
- Create a bucket named `app-files`.
- Policy: Public READ access.
- Policy: Authenticated Uploads only (restricted to specific file types: .apk, .ipa).