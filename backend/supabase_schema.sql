-- Supabase PostgreSQL Schema
-- Migration from Firestore to PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT users_role_check CHECK (role IN ('admin', 'qa_manager', 'qa_engineer', 'developer', 'viewer'))
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Folders table
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(name, project_id, parent_id)
);

-- Test cases table
CREATE TABLE testcases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    preconditions TEXT,
    steps TEXT,
    expected_result TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    test_type TEXT NOT NULL DEFAULT 'functional',
    tags TEXT[] DEFAULT '{}',
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT testcases_priority_check CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT testcases_type_check CHECK (test_type IN ('functional', 'regression', 'smoke', 'integration', 'performance', 'security'))
);

-- Test case history table
CREATE TABLE testcase_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    testcase_id UUID NOT NULL REFERENCES testcases(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    preconditions TEXT,
    steps TEXT,
    expected_result TEXT,
    priority TEXT NOT NULL,
    test_type TEXT NOT NULL,
    tags TEXT[],
    modified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(testcase_id, version)
);

-- Test runs table
CREATE TABLE testruns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'planned',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    environment TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT testruns_status_check CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled', 'blocked'))
);

-- Test run test cases (junction table)
CREATE TABLE testrun_testcases (
    testrun_id UUID NOT NULL REFERENCES testruns(id) ON DELETE CASCADE,
    testcase_id UUID NOT NULL REFERENCES testcases(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (testrun_id, testcase_id)
);

-- Test results table
CREATE TABLE testresults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    testrun_id UUID NOT NULL REFERENCES testruns(id) ON DELETE CASCADE,
    testcase_id UUID NOT NULL REFERENCES testcases(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'untested',
    comment TEXT,
    executed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    execution_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT testresults_status_check CHECK (status IN ('passed', 'failed', 'blocked', 'skipped', 'untested')),
    UNIQUE(testrun_id, testcase_id)
);

-- Test result history table
CREATE TABLE testresult_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    testresult_id UUID NOT NULL REFERENCES testresults(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    comment TEXT,
    executed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    execution_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issues table
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'medium',
    issue_type TEXT NOT NULL DEFAULT 'bug',
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    testcase_id UUID REFERENCES testcases(id) ON DELETE SET NULL,
    testrun_id UUID REFERENCES testruns(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution TEXT,
    attachments TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT issues_status_check CHECK (status IN ('todo', 'in_progress', 'in_review', 'done')),
    CONSTRAINT issues_priority_check CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT issues_type_check CHECK (issue_type IN ('bug', 'improvement', 'task'))
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_projects_key ON projects(key);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_folders_project ON folders(project_id);
CREATE INDEX idx_folders_parent ON folders(parent_id);
CREATE INDEX idx_testcases_project ON testcases(project_id);
CREATE INDEX idx_testcases_folder ON testcases(folder_id);
CREATE INDEX idx_testcases_created_by ON testcases(created_by);
CREATE INDEX idx_testcase_history_testcase ON testcase_history(testcase_id);
CREATE INDEX idx_testruns_project ON testruns(project_id);
CREATE INDEX idx_testruns_status ON testruns(status);
CREATE INDEX idx_testruns_assigned ON testruns(assigned_to);
CREATE INDEX idx_testrun_testcases_testrun ON testrun_testcases(testrun_id);
CREATE INDEX idx_testrun_testcases_testcase ON testrun_testcases(testcase_id);
CREATE INDEX idx_testresults_testrun ON testresults(testrun_id);
CREATE INDEX idx_testresults_testcase ON testresults(testcase_id);
CREATE INDEX idx_testresults_status ON testresults(status);
CREATE INDEX idx_testresult_history_result ON testresult_history(testresult_id);
CREATE INDEX idx_issues_project ON issues(project_id);
CREATE INDEX idx_issues_testcase ON issues(testcase_id);
CREATE INDEX idx_issues_testrun ON issues(testrun_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_assigned ON issues(assigned_to);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_testcases_updated_at BEFORE UPDATE ON testcases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_testruns_updated_at BEFORE UPDATE ON testruns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_testresults_updated_at BEFORE UPDATE ON testresults FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE testcases ENABLE ROW LEVEL SECURITY;
ALTER TABLE testcase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE testruns ENABLE ROW LEVEL SECURITY;
ALTER TABLE testrun_testcases ENABLE ROW LEVEL SECURITY;
ALTER TABLE testresults ENABLE ROW LEVEL SECURITY;
ALTER TABLE testresult_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be managed by backend API (service_role key)
-- For now, allow all operations with service_role key
