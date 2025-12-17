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
- **Database**: Firebase Firestore
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
- Database: Firebase Firestore (NoSQL)
- Authentication: JWT tokens with Python-Jose
- Password Hashing: pbkdf2_sha256 (pure Python, no Rust dependencies)
- Validation: Pydantic 1.10.18
- CORS: Enabled for production frontend

### Infrastructure (✅ Deployed)
- Backend Hosting: Render.com (free tier, 750 hours/month, auto-deploy from GitHub)
- Frontend Hosting: Firebase Hosting (free tier, CDN included)
- Database: Firebase Firestore (free tier, 1GB storage)

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

### 📅 Phase 3 - Planned
- Jira/GitHub issue integration
- Email notifications
- File attachments
- Test automation framework integration

### 📅 Phase 4 - Future
- SSO/MFA authentication
- AI-powered test recommendations
- Performance analytics dashboard
- Real-time collaboration features

## Working with This Repository

### Key Technical Decisions Made

1. **Database: Firestore (not PostgreSQL)**
   - All IDs are strings, not integers
   - No foreign key constraints (manual reference tracking)
   - Document-based, not relational
   - Queries use collection helpers with filters

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

### Important Files

**Backend:**
- `backend/app/schemas/*.py` - All enums (UserRole, TestPriority, TestRunStatus, IssueStatus, etc.) defined here
- `backend/app/db/firestore.py` - Firestore helper class with CRUD operations
- `backend/app/core/security.py` - JWT token handling, password hashing, account lockout logic
- `backend/app/core/permissions.py` - Role-based permission checks
- `backend/create_admin.py` - Creates admin user (prompts for password or uses ADMIN_PASSWORD env var)
- `backend/requirements.txt` - Pure Python dependencies only
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

# Or use environment variable
ADMIN_PASSWORD="your_secure_password" python create_admin.py
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
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_PRIVATE_KEY_ID` - From service account JSON
- `FIREBASE_PRIVATE_KEY` - From service account JSON (with \n, not actual newlines)
- `FIREBASE_CLIENT_EMAIL` - From service account JSON
- `FIREBASE_CLIENT_ID` - From service account JSON
- `FIREBASE_CLIENT_X509_CERT_URL` - From service account JSON

### Firestore Collections

**Main Collections:**
- `users/` - User accounts with roles and security fields
- `projects/` - Projects with keys and ownership
- `folders/` - Folder hierarchy for test cases
- `testcases/` - Test cases with versions
- `testcase_history/` - Version history snapshots
- `testruns/` - Test run configurations
- `testresults/` - Test execution results with history
- `issues/` - Issues linked to test runs/cases

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
- Query params: `project_id`, `testrun_id`, `status_filter`, `assigned_to`

**Statistics (`/api/v1/statistics`)**
- `GET /dashboard` - Dashboard stats (30 days)
- `GET /trends` - Pass rate trends (monthly)

### Common Development Patterns

**Backend Patterns:**
- Use `current_user: dict = Depends(get_current_user_firestore)` for auth
- Use `check_write_permission(current_user, "resource_name")` for write checks
- Use `collection.get(id)`, `collection.list()`, `collection.create(data)`, `collection.update(id, data)`, `collection.delete(id)`
- Use Pydantic schemas with `.dict()` for v1 compatibility
- Enum values: lowercase with underscores (e.g., `in_progress`, not `InProgress`)

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
2. **Firestore Limits**: 1 write/second per document (not an issue for current scale)
3. **No Email Service**: Forgot password shows temp password in response (not production-ready)
4. **React 19**: Recently upgraded - monitor for compatibility issues
5. **TestRunStatus Enum**: Recently added `CANCELLED` status (line 11 in `testrun.py`)

### Testing

**Default Admin Account:**
- Email: admin@tcms.com
- Password: admin123

**Test Workflow:**
1. Login with admin account
2. Create a project
3. Add test cases to project
4. Create test run with selected test cases
5. Execute tests and record results
6. View statistics on dashboard
7. Create issues for failed tests
8. Track issues on kanban board

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
