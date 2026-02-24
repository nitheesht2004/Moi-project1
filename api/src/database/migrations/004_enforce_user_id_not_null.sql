-- ========================================
-- Migration: Fix NULL user_id in Events
-- ========================================
-- This migration assigns user_id to old events and enforces NOT NULL constraint

-- STEP 1: Check current state
-- Run this first to see what needs to be fixed
SELECT 
    COUNT(*) as total_events,
    COUNT(user_id) as events_with_user,
    COUNT(*) - COUNT(user_id) as events_without_user
FROM events;

-- STEP 2: View events with NULL user_id
SELECT id, name, user_id, created_at 
FROM events 
WHERE user_id IS NULL
ORDER BY created_at;

-- STEP 3: View all users
SELECT id, username, created_at 
FROM users 
ORDER BY id;

-- ========================================
-- MIGRATION OPTIONS (Choose ONE)
-- ========================================

-- OPTION 1: Assign all NULL events to first user (user_id = 1)
-- Use this if you want all old events to belong to the first user
UPDATE events 
SET user_id = 1 
WHERE user_id IS NULL;

-- OPTION 2: Assign to specific users based on event name pattern
-- Uncomment and modify as needed
-- UPDATE events SET user_id = 1 WHERE user_id IS NULL AND name LIKE '%Wedding%';
-- UPDATE events SET user_id = 2 WHERE user_id IS NULL AND name LIKE '%Birthday%';

-- OPTION 3: Delete old test events (WARNING: Permanent deletion)
-- Only use if old events are test data you don't need
-- DELETE FROM events WHERE user_id IS NULL;

-- ========================================
-- STEP 4: Verify migration
-- ========================================
-- This should return 0 after successful migration
SELECT COUNT(*) as remaining_null_events
FROM events 
WHERE user_id IS NULL;

-- ========================================
-- STEP 5: Enforce NOT NULL constraint
-- ========================================
-- Only run this AFTER all events have user_id assigned
ALTER TABLE events 
ALTER COLUMN user_id SET NOT NULL;

-- ========================================
-- STEP 6: Verify constraint
-- ========================================
SELECT 
    column_name, 
    is_nullable, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'user_id';

-- Expected result: is_nullable = 'NO'

-- ========================================
-- ROLLBACK (if needed)
-- ========================================
-- If something goes wrong, you can remove the NOT NULL constraint
-- ALTER TABLE events ALTER COLUMN user_id DROP NOT NULL;
