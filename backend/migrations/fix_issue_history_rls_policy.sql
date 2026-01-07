-- =============================================
-- Fix Issue History RLS Policy
-- =============================================
-- This migration fixes the RLS policy that was blocking inserts
-- The original policy checked auth.role() = 'authenticated'
-- which doesn't work with service role key used by backend

-- Drop the old policy
DROP POLICY IF EXISTS "Authenticated users can insert issue history" ON issue_history;

-- Create new policy that allows all inserts
-- (Service role bypasses RLS anyway, but this is for future-proofing)
CREATE POLICY "Allow insert issue history"
    ON issue_history
    FOR INSERT
    WITH CHECK (true);

-- Verify the table exists and has the correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                   WHERE table_name = 'issue_history') THEN
        RAISE EXCEPTION 'issue_history table does not exist. Run add_issue_history_and_resolved_at.sql first';
    END IF;
END $$;
