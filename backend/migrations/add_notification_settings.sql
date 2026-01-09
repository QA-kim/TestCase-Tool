-- =============================================
-- Add notification_settings to users table
-- =============================================
-- This migration adds notification preference columns to the users table

-- Add notification setting columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS notify_issue_assigned BOOLEAN DEFAULT true;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS notify_issue_updated BOOLEAN DEFAULT true;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS notify_testrun_completed BOOLEAN DEFAULT true;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS notify_testrun_assigned BOOLEAN DEFAULT true;

-- Create index for faster queries on notification preferences
CREATE INDEX IF NOT EXISTS idx_users_email_notifications ON users(email_notifications);

-- Verify columns were added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email_notifications'
    ) THEN
        RAISE EXCEPTION 'Failed to add email_notifications column to users';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'notify_issue_assigned'
    ) THEN
        RAISE EXCEPTION 'Failed to add notify_issue_assigned column to users';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'notify_issue_updated'
    ) THEN
        RAISE EXCEPTION 'Failed to add notify_issue_updated column to users';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'notify_testrun_completed'
    ) THEN
        RAISE EXCEPTION 'Failed to add notify_testrun_completed column to users';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'notify_testrun_assigned'
    ) THEN
        RAISE EXCEPTION 'Failed to add notify_testrun_assigned column to users';
    END IF;
END $$;

-- Comment on columns
COMMENT ON COLUMN users.email_notifications IS 'Master switch for all email notifications';
COMMENT ON COLUMN users.notify_issue_assigned IS 'Notify when an issue is assigned to user';
COMMENT ON COLUMN users.notify_issue_updated IS 'Notify when an assigned issue is updated';
COMMENT ON COLUMN users.notify_testrun_completed IS 'Notify when a test run is completed';
COMMENT ON COLUMN users.notify_testrun_assigned IS 'Notify when a test run is assigned to user';
