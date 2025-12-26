-- ============================================================
-- Supabase Complete Reset and Schema Creation
-- ============================================================
-- This script will:
-- 1. Drop all existing tables
-- 2. Create fresh tables with correct schema
-- 3. Disable RLS for development
-- ============================================================

-- Drop all tables (in reverse order of dependencies)
DROP TABLE IF EXISTS testresult_history CASCADE;
DROP TABLE IF EXISTS testresults CASCADE;
DROP TABLE IF EXISTS testrun_testcases CASCADE;
DROP TABLE IF EXISTS testruns CASCADE;
DROP TABLE IF EXISTS testcase_history CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS testcases CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. Users Table
-- ============================================================
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    is_temp_password BOOLEAN DEFAULT FALSE,
    password_reset_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. Projects Table
-- ============================================================
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    description TEXT,
    owner_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- ============================================================
-- 3. Folders Table (for organizing test cases)
-- ============================================================
CREATE TABLE folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    project_id TEXT NOT NULL,
    parent_id TEXT,
    owner_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- ============================================================
-- 4. Test Cases Table
-- ============================================================
CREATE TABLE testcases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    preconditions TEXT,
    steps TEXT NOT NULL,
    expected_result TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    test_type TEXT NOT NULL DEFAULT 'functional',
    tags TEXT[],
    project_id TEXT NOT NULL,
    folder_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);

-- ============================================================
-- 5. Test Case History Table
-- ============================================================
CREATE TABLE testcase_history (
    id TEXT PRIMARY KEY,
    testcase_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    preconditions TEXT,
    steps TEXT NOT NULL,
    expected_result TEXT NOT NULL,
    priority TEXT NOT NULL,
    test_type TEXT NOT NULL,
    modified_by TEXT NOT NULL,
    change_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (testcase_id) REFERENCES testcases(id) ON DELETE CASCADE,
    FOREIGN KEY (modified_by) REFERENCES users(id)
);

-- ============================================================
-- 6. Test Runs Table
-- ============================================================
CREATE TABLE testruns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    project_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned',
    environment TEXT,
    assignee_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(id)
);

-- ============================================================
-- 7. Test Run - Test Cases Junction Table
-- ============================================================
CREATE TABLE testrun_testcases (
    id TEXT PRIMARY KEY,
    testrun_id TEXT NOT NULL,
    testcase_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (testrun_id) REFERENCES testruns(id) ON DELETE CASCADE,
    FOREIGN KEY (testcase_id) REFERENCES testcases(id) ON DELETE CASCADE,
    UNIQUE(testrun_id, testcase_id)
);

-- ============================================================
-- 8. Test Results Table
-- ============================================================
CREATE TABLE testresults (
    id TEXT PRIMARY KEY,
    testrun_id TEXT NOT NULL,
    testcase_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'untested',
    actual_result TEXT,
    comment TEXT,
    executed_by TEXT,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (testrun_id) REFERENCES testruns(id) ON DELETE CASCADE,
    FOREIGN KEY (testcase_id) REFERENCES testcases(id) ON DELETE CASCADE,
    FOREIGN KEY (executed_by) REFERENCES users(id)
);

-- ============================================================
-- 9. Test Result History Table
-- ============================================================
CREATE TABLE testresult_history (
    id TEXT PRIMARY KEY,
    testresult_id TEXT NOT NULL,
    status TEXT NOT NULL,
    actual_result TEXT,
    comment TEXT,
    executed_by TEXT,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (testresult_id) REFERENCES testresults(id) ON DELETE CASCADE,
    FOREIGN KEY (executed_by) REFERENCES users(id)
);

-- ============================================================
-- 10. Issues Table
-- ============================================================
CREATE TABLE issues (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    issue_type TEXT NOT NULL DEFAULT 'bug',
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'todo',
    project_id TEXT NOT NULL,
    testrun_id TEXT,
    testcase_id TEXT,
    assigned_to TEXT,
    created_by TEXT,
    attachments TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (testrun_id) REFERENCES testruns(id) ON DELETE SET NULL,
    FOREIGN KEY (testcase_id) REFERENCES testcases(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================
-- Disable Row Level Security (RLS) for all tables
-- ============================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE testcases DISABLE ROW LEVEL SECURITY;
ALTER TABLE testcase_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE testruns DISABLE ROW LEVEL SECURITY;
ALTER TABLE testrun_testcases DISABLE ROW LEVEL SECURITY;
ALTER TABLE testresults DISABLE ROW LEVEL SECURITY;
ALTER TABLE testresult_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE issues DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Create indexes for better performance
-- ============================================================
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_folders_project ON folders(project_id);
CREATE INDEX idx_folders_parent ON folders(parent_id);
CREATE INDEX idx_testcases_project ON testcases(project_id);
CREATE INDEX idx_testcases_folder ON testcases(folder_id);
CREATE INDEX idx_testcase_history_testcase ON testcase_history(testcase_id);
CREATE INDEX idx_testruns_project ON testruns(project_id);
CREATE INDEX idx_testrun_testcases_testrun ON testrun_testcases(testrun_id);
CREATE INDEX idx_testrun_testcases_testcase ON testrun_testcases(testcase_id);
CREATE INDEX idx_testresults_testrun ON testresults(testrun_id);
CREATE INDEX idx_testresults_testcase ON testresults(testcase_id);
CREATE INDEX idx_testresult_history_result ON testresult_history(testresult_id);
CREATE INDEX idx_issues_project ON issues(project_id);
CREATE INDEX idx_issues_testrun ON issues(testrun_id);
CREATE INDEX idx_issues_testcase ON issues(testcase_id);
CREATE INDEX idx_issues_status ON issues(status);

-- ============================================================
-- Success message
-- ============================================================
SELECT 'Schema created successfully! Ready for data import.' AS message;
