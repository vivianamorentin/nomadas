-- Migration: prestige_triggers
-- Created: 2026-02-05
-- Description: Add PostgreSQL triggers for automatic prestige updates (SPEC-REV-001)

-- Create PostgreSQL function for prestige calculation
CREATE OR REPLACE FUNCTION update_user_prestige_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level TEXT;
  old_level TEXT;
  user_rec RECORD;
BEGIN
  -- Only trigger on PUBLISHED reviews
  IF NEW.status != 'PUBLISHED' THEN
    RETURN NEW;
  END IF;

  -- Get user statistics
  SELECT
    u.type,
    u.id,
    COUNT(DISTINCT r.work_agreement_id) AS completed_jobs,
    AVG(r.overall_rating) AS avg_rating
  INTO user_rec
  FROM users u
  LEFT JOIN reviews r ON r.reviewee_id = NEW.reviewee_id AND r.status = 'PUBLISHED'
  WHERE u.id = NEW.reviewee_id
  GROUP BY u.id, u.type;

  -- Calculate new prestige level
  IF user_rec.completed_jobs >= 25 AND user_rec.avg_rating >= 4.8 THEN
    new_level := 'PLATINUM';
  ELSIF user_rec.completed_jobs >= 10 AND user_rec.avg_rating >= 4.5 THEN
    new_level := 'GOLD';
  ELSIF user_rec.completed_jobs >= 5 AND user_rec.avg_rating >= 4.0 THEN
    new_level := 'SILVER';
  ELSE
    new_level := 'BRONZE';
  END IF;

  -- Get old prestige level
  IF user_rec.type = 'WORKER' THEN
    SELECT prestige_level INTO old_level
    FROM worker_profiles
    WHERE user_id = NEW.reviewee_id;

    -- Update worker profile
    UPDATE worker_profiles
    SET
      prestige_level = new_level::PrestigeLevel,
      average_rating = ROUND(user_rec.avg_rating::numeric, 2),
      total_reviews = user_rec.completed_jobs
    WHERE user_id = NEW.reviewee_id;
  ELSIF user_rec.type = 'BUSINESS' THEN
    SELECT prestige_level INTO old_level
    FROM business_profiles
    WHERE user_id = NEW.reviewee_id
    LIMIT 1;

    -- Update all business profiles for this user
    UPDATE business_profiles
    SET
      prestige_level = new_level::PrestigeLevel,
      average_rating = ROUND(user_rec.avg_rating::numeric, 2),
      total_reviews = user_rec.completed_jobs
    WHERE user_id = NEW.reviewee_id;
  END IF;

  -- Log prestige level change if changed
  IF old_level IS DISTINCT FROM new_level THEN
    INSERT INTO prestige_level_history (
      user_id, old_level, new_level,
      completed_jobs_at_time, rating_at_time
    ) VALUES (
      NEW.reviewee_id, old_level::PrestigeLevel, new_level::PrestigeLevel,
      user_rec.completed_jobs, ROUND(user_rec.avg_rating::numeric, 2)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic prestige updates
DROP TRIGGER IF EXISTS update_prestige_after_review ON reviews;
CREATE TRIGGER update_prestige_after_review
AFTER INSERT OR UPDATE OF status ON reviews
FOR EACH ROW
WHEN (NEW.status = 'PUBLISHED')
EXECUTE FUNCTION update_user_prestige_level();

-- Create function to update Good Employer badge
CREATE OR REPLACE FUNCTION update_good_employer_badge()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  total_reviews INTEGER;
  has_badge BOOLEAN;
  meets_criteria BOOLEAN;
BEGIN
  -- Only process for businesses
  IF TG_TABLE_NAME = 'business_profiles' THEN
    -- Get current metrics
    SELECT average_rating, total_reviews, has_good_employer_badge
    INTO avg_rating, total_reviews, has_badge
    FROM business_profiles
    WHERE id = NEW.id;

    -- Check if meets Good Employer criteria
    meets_criteria := (avg_rating >= 4.5 AND total_reviews >= 10);

    -- Update badge status
    IF meets_criteria AND NOT has_badge THEN
      UPDATE business_profiles
      SET
        has_good_employer_badge = true,
        good_employer_badge_awarded_at = NOW(),
        good_employer_badge_criteria = jsonb_build_object(
          'rating', avg_rating,
          'reviews', total_reviews
        )
      WHERE id = NEW.id;
    ELSIF NOT meets_criteria AND has_badge THEN
      UPDATE business_profiles
      SET
        has_good_employer_badge = false,
        good_employer_badge_revoked_at = NOW()
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for Good Employer badge updates
DROP TRIGGER IF EXISTS update_badge_after_prestige ON business_profiles;
CREATE TRIGGER update_badge_after_prestige
AFTER UPDATE OF average_rating, total_reviews ON business_profiles
FOR EACH ROW
WHEN (OLD.average_rating IS DISTINCT FROM NEW.average_rating OR OLD.total_reviews IS DISTINCT FROM NEW.total_reviews)
EXECUTE FUNCTION update_good_employer_badge();
