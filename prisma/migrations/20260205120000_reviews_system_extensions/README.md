# Migration: Reviews System Extensions

## Created
2026-02-05 12:00:00

## Description
This migration adds the extensions required for SPEC-REV-001 (Reviews & Reputation System).

## Changes

### Review Model Extensions
- Added `status` column (ReviewStatus enum: PENDING, PUBLISHED, FLAGGED, HIDDEN)
- Added `submitted_at` timestamp
- Added `published_at` timestamp
- Added `response` text column for review responses
- Added `response_submitted_at` timestamp
- Added `flag_count` integer (default: 0)
- Added `flag_reasons` JSONB column for flag details
- Added `moderation_status` (ModerationStatus enum)
- Added `audit_log` JSONB column for change tracking
- Created indexes: status, reviewee_id + status, moderation_status

### BusinessProfile Badge Metadata
- Added `good_employer_badge_awarded_at` timestamp
- Added `good_employer_badge_revoked_at` timestamp
- Added `good_employer_badge_criteria` JSONB column
- Created index: has_good_employer_badge

### PrestigeLevelHistory Table (New)
- Tracks prestige level changes over time
- Columns: id, user_id, old_level, new_level, completed_jobs_at_time, rating_at_time, changed_at
- Foreign key to users table with CASCADE delete
- Indexes: user_id, changed_at

## Rollback
To rollback this migration, you will need to:
1. Drop indexes
2. Drop PrestigeLevelHistory table
3. Remove columns from BusinessProfile
4. Remove columns from Review
5. Drop enum types

## Notes
- This migration supports the full Reviews & Reputation System specification
- PostgreSQL triggers for automatic prestige updates will be added in a separate migration
- The `visible` column on Review is retained for backward compatibility
