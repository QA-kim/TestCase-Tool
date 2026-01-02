-- Add resolution column to issues table
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS resolution TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN issues.resolution IS 'Resolution details when issue is marked as done';
