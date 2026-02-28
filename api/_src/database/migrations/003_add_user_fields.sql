-- Migration: Add email and full_name to users table
-- Date: 2026-02-17

-- Add email column (nullable initially for existing users)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Add unique constraint on email
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email) WHERE email IS NOT NULL;

-- For production: Update existing users with placeholder values if needed
-- UPDATE users SET email = username || '@example.com' WHERE email IS NULL;
-- UPDATE users SET full_name = username WHERE full_name IS NULL;

-- Optional: Make columns NOT NULL after updating existing data
-- ALTER TABLE users ALTER COLUMN email SET NOT NULL;
-- ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;
