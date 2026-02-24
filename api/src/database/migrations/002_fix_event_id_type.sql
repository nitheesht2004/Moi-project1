-- Fix for event_id out of range error
-- This allows frontend-generated timestamps as event IDs

-- Drop existing foreign key constraint
ALTER TABLE entries DROP CONSTRAINT IF EXISTS entries_event_id_fkey;

-- Change event_id to BIGINT to support timestamps
ALTER TABLE entries ALTER COLUMN event_id TYPE BIGINT;
ALTER TABLE events ALTER COLUMN id TYPE BIGINT;

-- Recreate foreign key constraint
ALTER TABLE entries 
ADD CONSTRAINT entries_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Verify changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'entries' AND column_name = 'event_id';
