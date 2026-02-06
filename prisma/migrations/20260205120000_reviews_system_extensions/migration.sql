-- Migration: reviews_system_extensions
-- Created: 2026-02-05
-- Description: Add Review model extensions for SPEC-REV-001

-- Create ReviewStatus and ModerationStatus enums
DO $$ BEGIN
    CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FLAGGED', 'HIDDEN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ModerationStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'HIDDEN', 'SUSPENDED_USER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to Review model
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP(3);
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "response" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "response_submitted_at" TIMESTAMP(3);
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "flag_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "flag_reasons" JSONB;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "moderation_status" "ModerationStatus";
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "audit_log" JSONB;

-- Create indexes for Review model
CREATE INDEX IF NOT EXISTS "reviews_status_idx" ON "reviews"("status");
CREATE INDEX IF NOT EXISTS "reviews_reviewee_status_idx" ON "reviews"("reviewee_id", "status");
CREATE INDEX IF NOT EXISTS "reviews_moderation_status_idx" ON "reviews"("moderation_status");

-- Add badge metadata columns to BusinessProfile
ALTER TABLE "business_profiles" ADD COLUMN IF NOT EXISTS "good_employer_badge_awarded_at" TIMESTAMP(3);
ALTER TABLE "business_profiles" ADD COLUMN IF NOT EXISTS "good_employer_badge_revoked_at" TIMESTAMP(3);
ALTER TABLE "business_profiles" ADD COLUMN IF NOT EXISTS "good_employer_badge_criteria" JSONB;

-- Create index for BusinessProfile badge
CREATE INDEX IF NOT EXISTS "business_profiles_has_good_employer_badge_idx" ON "business_profiles"("has_good_employer_badge");

-- Create PrestigeLevelHistory table
CREATE TABLE IF NOT EXISTS "prestige_level_history" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "old_level" "PrestigeLevel",
  "new_level" "PrestigeLevel" NOT NULL,
  "completed_jobs_at_time" INTEGER NOT NULL,
  "rating_at_time" DECIMAL(3,2) NOT NULL,
  "changed_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "prestige_level_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create indexes for PrestigeLevelHistory
CREATE INDEX IF NOT EXISTS "prestige_level_history_user_id_idx" ON "prestige_level_history"("user_id");
CREATE INDEX IF NOT EXISTS "prestige_level_history_changed_at_idx" ON "prestige_level_history"("changed_at");
