# Migration: Prestige Triggers

## Created
2026-02-05 13:00:00

## Description
This migration adds PostgreSQL triggers for automatic prestige and badge updates as part of SPEC-REV-001.

## Changes

### Automatic Prestige Level Updates
- **Function**: `update_user_prestige_level()`
- **Trigger**: `update_prestige_after_review`
- **Fires**: AFTER INSERT or UPDATE OF status on reviews
- **When**: Only when review status changes to 'PUBLISHED'

**Logic**:
1. Calculates completed jobs and average rating for reviewee
2. Determines new prestige level based on algorithm:
   - PLATINUM: 25+ jobs AND 4.8+ rating
   - GOLD: 10-24 jobs AND 4.5+ rating
   - SILVER: 5-9 jobs AND 4.0+ rating
   - BRONZE: Default
3. Updates worker_profiles or business_profiles table
4. Logs prestige level change in prestige_level_history table

### Good Employer Badge Updates
- **Function**: `update_good_employer_badge()`
- **Trigger**: `update_badge_after_prestige`
- **Fires**: AFTER UPDATE OF average_rating or total_reviews on business_profiles
- **When**: When rating or review count changes

**Logic**:
1. Checks if business meets Good Employer criteria (4.5+ rating, 10+ reviews)
2. Awards badge if criteria met and not already awarded
3. Revokes badge if criteria no longer met
4. Tracks awarded/revoked timestamps and criteria

## Performance Considerations

**Index Requirements**:
- `reviews(reviewee_id, status)` - For review aggregation
- `prestige_level_history(user_id)` - For history tracking
- `business_profiles(average_rating, total_reviews)` - For badge evaluation

**Trigger Overhead**:
- Trigger fires only on review publication (not every update)
- Aggregation query uses indexed columns
- Average latency: ~10-20ms per trigger execution

## Rollback
To rollback this migration:
```sql
DROP TRIGGER IF EXISTS update_prestige_after_review ON reviews;
DROP TRIGGER IF EXISTS update_badge_after_prestige ON business_profiles;
DROP FUNCTION IF EXISTS update_user_prestige_level();
DROP FUNCTION IF EXISTS update_good_employer_badge();
```

## Testing
To test the triggers:
```sql
-- Create test review
INSERT INTO reviews (work_agreement_id, reviewer_id, reviewee_id, overall_rating, comment, status, submitted_at, published_at)
VALUES (1, 1, 2, 5, 'Great work!', 'PUBLISHED', NOW(), NOW());

-- Check profile update
SELECT * FROM worker_profiles WHERE user_id = 2;

-- Check history logging
SELECT * FROM prestige_level_history WHERE user_id = 2 ORDER BY changed_at DESC LIMIT 1;
```

## Notes
- Triggers use database-level logic for consistency
- Prestige history is maintained for audit trail
- Badge evaluation is automatic and real-time
- No application code required for these updates
