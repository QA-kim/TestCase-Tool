-- =============================================
-- Add created_at and updated_at to issue_history
-- =============================================
-- This migration adds timestamp columns to issue_history table
-- to match the standard schema used by other tables

-- Add created_at column (using changed_at as default for existing records)
ALTER TABLE issue_history
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

-- Add updated_at column (using changed_at as default for existing records)
ALTER TABLE issue_history
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Update existing records to use changed_at for created_at and updated_at
UPDATE issue_history
SET created_at = changed_at,
    updated_at = changed_at
WHERE created_at IS NULL OR updated_at IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE issue_history
ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE issue_history
ALTER COLUMN updated_at SET NOT NULL;

-- Set default for future inserts
ALTER TABLE issue_history
ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE issue_history
ALTER COLUMN updated_at SET DEFAULT NOW();

-- Verify columns were added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'issue_history' AND column_name = 'created_at'
    ) THEN
        RAISE EXCEPTION 'Failed to add created_at column to issue_history';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'issue_history' AND column_name = 'updated_at'
    ) THEN
        RAISE EXCEPTION 'Failed to add updated_at column to issue_history';
    END IF;
END $$;
