/*
# Add unique constraint on app_releases (platform, version)

## Why
The GitHub Actions workflow re-runs with the same version number (e.g. when rebuilding 1.0.0).
Without a unique constraint, each run inserts a duplicate row instead of updating the existing one.
The unique constraint on (platform, version) enables PostgREST upsert with resolution=merge-duplicates.

## Changes
- Adds UNIQUE constraint on (platform, version) to public.app_releases.
*/

-- Clean up any existing duplicates before adding the constraint
DELETE FROM public.app_releases a USING public.app_releases b
WHERE a.id > b.id AND a.platform = b.platform AND a.version = b.version;

ALTER TABLE public.app_releases
  ADD CONSTRAINT app_releases_platform_version_key UNIQUE (platform, version);
