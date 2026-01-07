-- =============================================
-- Issue History and Resolved Date Migration
-- =============================================
-- This migration adds:
-- 1. resolved_at field to issues table
-- 2. issue_history table for tracking status changes

-- Add resolved_at column to issues table
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Create index for faster queries on resolved issues
CREATE INDEX IF NOT EXISTS idx_issues_resolved_at ON issues(resolved_at);

-- Create issue_history table
-- Note: Using TEXT for issue_id and changed_by to match existing table structure
CREATE TABLE IF NOT EXISTS issue_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    changed_by TEXT NOT NULL REFERENCES users(id),
    field_name VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    comment TEXT
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_issue_history_issue_id ON issue_history(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_history_changed_at ON issue_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_history_changed_by ON issue_history(changed_by);

-- Enable Row Level Security (RLS)
ALTER TABLE issue_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view history for issues they can access
CREATE POLICY "Users can view issue history"
    ON issue_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM issues
            WHERE issues.id = issue_history.issue_id
        )
    );

-- RLS Policy: Authenticated users can insert history
CREATE POLICY "Authenticated users can insert issue history"
    ON issue_history
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Comment on table and columns
COMMENT ON TABLE issue_history IS 'Tracks all changes made to issues, especially status changes';
COMMENT ON COLUMN issue_history.issue_id IS 'Reference to the issue that was changed';
COMMENT ON COLUMN issue_history.changed_by IS 'User who made the change';
COMMENT ON COLUMN issue_history.field_name IS 'Name of the field that changed (e.g., status, priority, assigned_to)';
COMMENT ON COLUMN issue_history.old_value IS 'Previous value before change';
COMMENT ON COLUMN issue_history.new_value IS 'New value after change';
COMMENT ON COLUMN issue_history.changed_at IS 'Timestamp when change occurred';
COMMENT ON COLUMN issue_history.comment IS 'Optional comment about the change';

COMMENT ON COLUMN issues.resolved_at IS 'Timestamp when issue was marked as Done';
