-- Cloudflare D1 Database Migration: 0010_email_uniqueness_and_registration_persistence.sql
-- ZANA Platform: Enforce Email Uniqueness, Backfill Legacy Subscriptions, Normalize Emails, and Persist Student Profiles

-- 1. Ensure email column exists on subscriptions table for authoritative email-level trial enforcement
ALTER TABLE subscriptions ADD COLUMN email TEXT;

-- 2. Safely handle legacy duplicate emails in students BEFORE normalization: preserve earliest created record
UPDATE students
SET email = NULL
WHERE id NOT IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY LOWER(TRIM(email))
             ORDER BY created_at ASC, rowid ASC
           ) as rn
    FROM students
    WHERE email IS NOT NULL AND TRIM(email) != ''
  )
  WHERE rn = 1
)
AND email IS NOT NULL AND TRIM(email) != '';

-- 3. Safely handle legacy duplicate emails in users BEFORE normalization (prevents UNIQUE(email) failure from 0006)
UPDATE users
SET email = NULL
WHERE id NOT IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY LOWER(TRIM(email))
             ORDER BY created_at ASC, rowid ASC
           ) as rn
    FROM users
    WHERE email IS NOT NULL AND TRIM(email) != ''
  )
  WHERE rn = 1
)
AND email IS NOT NULL AND TRIM(email) != '';

-- 4. Normalize all surviving emails across students, users, and subscriptions (trim whitespace & lowercase)
UPDATE students
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL AND TRIM(email) != '';

UPDATE users
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL AND TRIM(email) != '';

UPDATE subscriptions
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL AND TRIM(email) != '';

-- 5. Backfill subscriptions.email from authoritative students records (matching firebase_uid or id)
UPDATE subscriptions
SET email = (
  SELECT LOWER(TRIM(s.email))
  FROM students s
  WHERE (s.firebase_uid = subscriptions.user_id OR s.id = subscriptions.user_id)
    AND s.email IS NOT NULL AND TRIM(s.email) != ''
  ORDER BY s.created_at ASC, s.rowid ASC
  LIMIT 1
)
WHERE (email IS NULL OR TRIM(email) = '');

-- 6. Backfill remaining subscriptions.email from users table (matching id), excluding 0006 synthetic placeholders
UPDATE subscriptions
SET email = (
  SELECT LOWER(TRIM(u.email))
  FROM users u
  WHERE u.id = subscriptions.user_id
    AND u.email IS NOT NULL AND TRIM(u.email) != ''
    AND LOWER(TRIM(u.email)) != LOWER(TRIM(u.id || '@zana.edu.krd'))
  ORDER BY u.created_at ASC, u.rowid ASC
  LIMIT 1
)
WHERE (email IS NULL OR TRIM(email) = '');

-- 7. Safely handle conflicting duplicate emails in subscriptions: preserve earliest trial record (by trial_started_at ASC, rowid ASC)
UPDATE subscriptions
SET email = NULL
WHERE user_id NOT IN (
  SELECT user_id
  FROM (
    SELECT user_id,
           ROW_NUMBER() OVER (
             PARTITION BY LOWER(TRIM(email))
             ORDER BY trial_started_at ASC, rowid ASC
           ) as rn
    FROM subscriptions
    WHERE email IS NOT NULL AND TRIM(email) != ''
  )
  WHERE rn = 1
)
AND email IS NOT NULL AND TRIM(email) != '';

-- 8. Create UNIQUE expression indexes enforcing strictly one registration and one trial per normalized email
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_unique_email 
ON students(LOWER(TRIM(email))) 
WHERE email IS NOT NULL AND TRIM(email) != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_unique_email 
ON subscriptions(LOWER(TRIM(email))) 
WHERE email IS NOT NULL AND TRIM(email) != '';

CREATE INDEX IF NOT EXISTS idx_subscriptions_lookup_email 
ON subscriptions(email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_email 
ON users(LOWER(TRIM(email))) 
WHERE email IS NOT NULL AND TRIM(email) != '';
