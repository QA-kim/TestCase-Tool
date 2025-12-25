# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **fully implemented and deployed** Test Case Management System (TCMS) - a modern test management platform similar to TMS, with Phase 1 and Phase 2 complete and running in production.

**Current Status**: Phase 2 complete - Core functionality deployed and operational.

## Repository Structure

- `backend/` - FastAPI backend with Firebase Firestore
  - `app/api/v1/` - API endpoints (auth, users, projects, testcases, folders, testruns, testresults, issues, statistics)
  - `app/core/` - Security, configuration, and permissions
  - `app/db/` - Firestore database helpers
  - `app/schemas/` - Pydantic schemas with enums
  - `create_admin.py` - Admin account creation script
  - `requirements.txt` - Python dependencies
- `frontend/` - React 19 + TypeScript + Tailwind CSS v4
  - `src/pages/` - Page components (Login, Register, Dashboard, Projects, TestCases, TestRuns, IssueBoard, etc.)
  - `src/components/` - Reusable components (Layout, ProtectedRoute, ChangePasswordModal)
  - `src/contexts/` - AuthContext for authentication state
  - `src/services/` - API client services
- `claude/` - Product requirement documents (Korean)
- `render.yaml` - Render.com deployment configuration
- `CLAUDE.md` - This file
- `README.md` - Project documentation

## Deployed Services

- **Frontend**: https://testcase-e27a4.web.app (Firebase Hosting)
- **Backend**: https://testcase-tool.onrender.com (Render.com)
- **API Docs**: https://testcase-tool.onrender.com/docs (Swagger UI)
- **Database**: Supabase (PostgreSQL)
- **Cost**: $0/month (all using free tiers)

## Implemented Technical Stack

### Frontend (✅ Implemented)
- Framework: React 19.2.3 with TypeScript
- Styling: Tailwind CSS v4
- Routing: React Router
- State Management: React Query (server state)
- HTTP Client: Axios with interceptors
- Build Tool: Vite
- Icons: Lucide React
- UI Pattern: TMS-style layout with sidebar navigation

### Backend (✅ Implemented)
- Language: Python 3.13
- Framework: FastAPI 0.95.2
- Database: Supabase (PostgreSQL)
- Authentication: JWT tokens with Python-Jose
- Password Hashing: pbkdf2_sha256 (pure Python, no Rust dependencies)
- Validation: Pydantic 1.10.18
- CORS: Enabled for production frontend

### Infrastructure (✅ Deployed)
- Backend Hosting: Render.com (free tier, 750 hours/month, auto-deploy from GitHub)
- Frontend Hosting: Firebase Hosting (free tier, CDN included)
- Database: Supabase (free tier, 500MB storage, PostgreSQL 15)

## User Roles (✅ Implemented)

Defined in `backend/app/schemas/user.py`:
- **admin**: Full system management, user account unlock
- **qa_manager**: Project management, test planning, test run creation
- **qa_engineer**: Test case creation and execution, issue creation
- **developer**: Read and comment access, test result viewing
- **viewer**: Read-only access (default for new registrations)

## Implementation Status

### ✅ Phase 1 - Complete
- **User Authentication & Account Management**
  - JWT-based register/login with token refresh
  - Password reset/forgot password with temporary password
  - Account lockout (5 failed attempts = 30 min lock)
  - Force password change for temporary passwords
  - My Account page with password change
  - Admin user unlock capability

- **Role-Based Access Control (RBAC)**
  - Permission checking in backend endpoints
  - Role-based UI rendering
  - Write permission checks for viewers

- **Project Management**
  - CRUD operations with validation
  - Auto-generated project keys
  - Owner tracking
  - Project detail view with test case integration

- **Test Case Management**
  - CRUD operations with version history
  - Folder structure support
  - Priority levels (Low, Medium, High, Critical)
  - Test types (Functional, Regression, Smoke, Integration, Performance, Security)
  - Tag-based categorization
  - Excel/PDF export functionality

### ✅ Phase 2 - Complete
- **Test Run Management**
  - Create and manage test runs
  - Test case selection with select all/deselect all
  - Status management (Planned, In Progress, Completed, Cancelled, Blocked)
  - Test result recording (Passed, Failed, Blocked, Skipped, Untested)
  - Execution history tracking
  - Assignee and environment tracking

- **Dashboard & Statistics**
  - Project/Test Case/Test Run count cards
  - Overall pass rate calculation
  - Priority distribution
  - Top failed test cases
  - Recent activity (projects, test cases, test runs)
  - 30-day pass rate trend chart
  - Real-time statistics updates

- **Issue Management (Kanban Board)**
  - Test run-based issue tracking
  - Kanban board UI (Todo, In Progress, In Review, Done)
  - Drag-and-drop status changes
  - Priority and issue type (Bug, Improvement, Task)
  - Test case/test run linking
  - Assignee management
  - Filter by test run
  - **File attachments** (image screenshots up to 5MB)
  - Backend file storage (/tmp directory on Render.com)
  - Issue detail modal in list view
  - Attachment preview with image grid

### 📅 Phase 3 - Planned
- Jira/GitHub issue integration
- Email notifications
- Persistent file storage (cloud storage solution)
- Test automation framework integration

### 📅 Phase 4 - Future
- SSO/MFA authentication
- AI-powered test recommendations
- Performance analytics dashboard
- Real-time collaboration features

## Working with This Repository

### Key Technical Decisions Made

1. **Database: Supabase (PostgreSQL)**
   - Migrated from Firebase Firestore to Supabase
   - Uses PostgreSQL with relational schema
   - All IDs are UUIDs (strings)
   - Foreign key relationships managed by database
   - Helper class (`SupabaseCollection`) provides Firestore-like API

2. **Python Dependencies: Pure Python Only**
   - No Rust-compiled packages (bcrypt, cryptography)
   - Uses pbkdf2_sha256 for password hashing
   - python-jose without [cryptography] extra
   - Compatible with Render.com free tier

3. **Pydantic: v1.10.18 (not v2)**
   - Compatible with Python 3.13
   - Uses `.dict()` instead of `.model_dump()`
   - pydantic-settings removed (using python-dotenv)

4. **React: v19.2.3 (Latest)**
   - Upgraded from v18 for security (CVE-2025-55182)
   - All hooks and patterns updated to React 19

5. **Frontend API URL**
   - Development: `http://localhost:8000/api/v1`
   - Production: `https://testcase-tool.onrender.com/api/v1`
   - Configured in `frontend/src/lib/axios.ts`

6. **Deployment Strategy**
   - Backend: Auto-deploy from GitHub main branch to Render.com
   - Frontend: Manual deploy via `npm run build && npx firebase-tools deploy --only hosting`
   - **Important**: Always deploy frontend after code changes per user request

7. **File Storage: Backend /tmp Directory (not Firebase Storage)**
   - Uses backend file upload via multipart/form-data
   - Files stored in `/tmp/issue_attachments` on Render.com
   - Image files only (validated by content-type)
   - Max file size: 5MB
   - **Trade-off**: Files are ephemeral (lost on server restart due to free tier)
   - Avoided Firebase Storage to maintain $0/month cost (requires Blaze plan)

### Important Files

**Backend:**
- `backend/app/schemas/*.py` - All enums (UserRole, TestPriority, TestRunStatus, IssueStatus, etc.) defined here
- `backend/app/db/supabase.py` - Supabase helper class with CRUD operations (Firestore-like API)
- `backend/app/db/firestore.py` - Legacy Firestore helper (deprecated)
- `backend/app/core/security.py` - JWT token handling, password hashing, account lockout logic
- `backend/app/core/permissions.py` - Role-based permission checks
- `backend/create_admin.py` - Creates admin user (interactive password prompt)
- `backend/requirements.txt` - Pure Python dependencies (includes supabase==2.10.0)
- `render.yaml` - Render.com deployment configuration

**Frontend:**
- `frontend/src/lib/axios.ts` - Axios instance with auth interceptors
- `frontend/src/contexts/AuthContext.tsx` - Global auth state management
- `frontend/src/components/Layout.tsx` - Main layout with sidebar navigation
- `frontend/src/pages/*.tsx` - All page components
- `frontend/package.json` - React 19 and dependencies

### Common Tasks

#### Create Admin User
```bash
cd backend
# Interactive mode (prompts for password)
python create_admin.py
```

#### Local Development
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

#### Deploy to Production
```bash
# Backend (automatic via GitHub push)
git add .
git commit -m "feat: description"
git push

# Frontend (manual - REQUIRED after code changes)
cd frontend
npm run build
npx firebase-tools deploy --only hosting
```

**User Requirement**: Always deploy frontend to production after making source code changes.

### Environment Variables (Render.com)

Required environment variables:
- `SECRET_KEY` - JWT secret (generate with `openssl rand -hex 32`)
- `SUPABASE_URL` - Supabase project URL (e.g., https://xxxxx.supabase.co)
- `SUPABASE_SERVICE_KEY` - Supabase service role key (from project settings)

### Supabase Database Tables

**Main Tables:**
- `users` - User accounts with roles and security fields
- `projects` - Projects with keys and ownership
- `folders` - Folder hierarchy for test cases
- `testcases` - Test cases with versions
- `testcase_history` - Version history snapshots
- `testruns` - Test run configurations
- `testresults` - Test execution results with history
- `issues` - Issues linked to test runs/cases

### API Endpoints

**Authentication (`/api/v1/auth`)**
- `POST /register` - Register new user (default: viewer role)
- `POST /login` - Login (JWT token, account lockout on failure)
- `GET /me` - Get current user
- `POST /forgot-password` - Reset password (temp password)
- `POST /change-password` - Change password

**Users (`/api/v1/users`)**
- `GET /` - List all users
- `GET /{user_id}` - Get user by ID
- `POST /{user_id}/unlock` - Unlock locked account (admin only)

**Projects (`/api/v1/projects`)**
- Standard CRUD endpoints

**Test Cases (`/api/v1/testcases`)**
- CRUD + history tracking
- `GET /export/excel` - Export to Excel
- `GET /export/pdf` - Export to PDF

**Test Runs (`/api/v1/testruns`)**
- CRUD for test runs
- `GET /{testrun_id}/results` - Get results for a run

**Test Results (`/api/v1/testruns/results`)**
- `POST /` - Create result
- `PUT /{result_id}` - Update result

**Issues (`/api/v1/issues`)**
- CRUD for issues
- `PATCH /{issue_id}/status` - Update status (for kanban drag-drop)
- `POST /upload` - Upload attachment file (images only, max 5MB)
- `GET /attachments/{filename}` - Retrieve uploaded attachment
- Query params: `project_id`, `testrun_id`, `status_filter`, `assigned_to`

**Statistics (`/api/v1/statistics`)**
- `GET /dashboard` - Dashboard stats (30 days)
- `GET /trends` - Pass rate trends (monthly)

### File Attachment Implementation

**Backend (`backend/app/api/v1/issues.py`):**
- Upload directory: `/tmp/issue_attachments` (created on startup)
- Validation: Image files only (`content_type.startswith('image/')`)
- Size limit: 5MB max
- Filename: `{timestamp}_{original_filename}` for uniqueness
- Upload endpoint: `POST /api/v1/issues/upload` (multipart/form-data)
- Retrieval endpoint: `GET /api/v1/issues/attachments/{filename}` (FileResponse)
- Returns relative URL: `/api/v1/issues/attachments/{filename}`

**Frontend (`frontend/src/services/issues.ts`):**
- `uploadAttachment(file: File)` function uses FormData
- Converts backend relative URL to absolute URL
- Uses `VITE_API_URL` env variable or `window.location.origin`
- Multiple file upload support in create modal
- Image preview grid in detail modal

**Schema (`backend/app/schemas/issue.py`):**
- `attachments: Optional[List[str]]` field for URL list
- Stored as array of strings in Supabase (PostgreSQL ARRAY type)
- Displayed as clickable image thumbnails in UI

**Important Notes:**
- Files are ephemeral on Render.com free tier (/tmp cleared on restart)
- No Firebase Storage to maintain $0/month cost
- Production should migrate to S3/GCS for persistent storage

### Common Development Patterns

**Backend Patterns:**
- Use `current_user: dict = Depends(get_current_user_firestore)` for auth (function name unchanged for compatibility)
- Use `check_write_permission(current_user, "resource_name")` for write checks
- Use `collection.get(id)`, `collection.list()`, `collection.create(data)`, `collection.update(id, data)`, `collection.delete(id)` (Supabase helper provides Firestore-like API)
- Use Pydantic schemas with `.dict()` for v1 compatibility
- Enum values: lowercase with underscores (e.g., `in_progress`, not `InProgress`)
- Database: PostgreSQL via Supabase, but helper class maintains compatibility with Firestore patterns

**Frontend Patterns:**
- Use React Query for all API calls (`useQuery`, `useMutation`)
- Use `queryClient.invalidateQueries()` after mutations
- Use `navigate()` for routing
- Use Lucide React icons
- Tailwind CSS for all styling
- Always check user role before rendering admin features

### Security Features

- **Account Lockout**: 5 failed login attempts = 30 min lock (timezone-aware)
- **Temporary Passwords**: Force change on first login
- **JWT Tokens**: Short-lived with proper expiration
- **CORS**: Configured for production frontend domain
- **Password Hashing**: pbkdf2_sha256 with salt
- **Permission Checks**: Backend validation on all write operations

### Known Issues & Considerations

1. **Render.com Free Tier**: Backend spins down after 15 min inactivity (cold start ~30 sec)
2. **Supabase Free Tier**: 500MB database storage, 2GB bandwidth/month, 50MB file storage
3. **No Email Service**: Forgot password shows temp password in response (not production-ready)
4. **React 19**: Recently upgraded - monitor for compatibility issues
5. **TestRunStatus Enum**: Recently added `CANCELLED` status (line 11 in `testrun.py`)
6. **Ephemeral File Storage**: Issue attachments stored in `/tmp` are lost on server restart (acceptable for free tier, but should migrate to persistent storage like S3/GCS in production)
7. **Database Migration**: Migrated from Firebase Firestore to Supabase PostgreSQL for better relational data management

### Testing

**Test Workflow:**
1. Login with admin account
2. Create a project
3. Add test cases to project
4. Create test run with selected test cases
5. Execute tests and record results
6. View statistics on dashboard
7. Create issues for failed tests with screenshot attachments
8. Track issues on kanban board with drag-and-drop
9. View issue details in modal (list view) or dedicated page
10. Filter issues by test run, status, assignee

### Troubleshooting

**422 Validation Errors:**
- Check enum values match schema (e.g., `cancelled` not `Cancelled`)
- Verify all required fields are provided
- Check Pydantic schema validators

**Authentication Errors:**
- Check JWT token expiration
- Verify Firestore service account credentials
- Check CORS configuration for frontend domain

**Deployment Issues:**
- Backend: Check Render.com logs, verify environment variables
- Frontend: Rebuild and redeploy, clear browser cache
- Database: Check Firestore rules and indexes

## Project Philosophy

- **Simplicity**: Use built-in solutions before adding dependencies
- **Cost**: Optimize for free tier usage
- **UX**: TMS-style interface for familiar QA workflow
- **Security**: Multiple layers (JWT, RBAC, account lockout)
- **Deployment**: Automated backend, manual frontend (with user requirement to always deploy)
