# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **fully implemented** Test Case Management System (TCMS) - a modern test management platform similar to TMS, with a complete MVP deployed and running in production.

**Current Status**: MVP complete and deployed - Phase 1 implementation finished.

## Repository Structure

- `backend/` - FastAPI backend with Firebase Firestore
  - `app/api/v1/` - API endpoints (auth, projects, testcases)
  - `app/core/` - Security and configuration
  - `app/db/` - Firestore database helpers
  - `app/schemas/` - Pydantic schemas with enums
  - `create_admin.py` - Admin account creation script
  - `requirements.txt` - Python dependencies
- `frontend/` - React + TypeScript + Tailwind CSS v4
  - `src/pages/` - Page components
  - `src/components/` - Reusable components (Layout, ProtectedRoute)
  - `src/contexts/` - AuthContext
  - `src/services/` - API client
- `claude/` - Product requirement documents (Korean)
- `render.yaml` - Render.com deployment configuration
- `CLAUDE.md` - This file

## Deployed Services

- **Frontend**: https://testcase-e27a4.web.app (Firebase Hosting)
- **Backend**: https://testcase-tool.onrender.com (Render.com)
- **Database**: Firebase Firestore
- **Cost**: $0/month (all using free tiers)

## Implemented Technical Stack

### Frontend (✅ Implemented)
- Framework: React 18 with TypeScript
- Styling: Tailwind CSS v4
- Routing: React Router
- HTTP Client: Axios
- Build Tool: Vite
- UI Pattern: TMS-style 3-column layout

### Backend (✅ Implemented)
- Language: Python 3.13
- Framework: FastAPI 0.95.2
- Database: Firebase Firestore (NoSQL)
- Authentication: JWT tokens with Python-Jose
- Password Hashing: pbkdf2_sha256 (pure Python, no Rust)
- Validation: Pydantic 1.10.18

### Infrastructure (✅ Deployed)
- Backend Hosting: Render.com (free tier, 750 hours/month)
- Frontend Hosting: Firebase Hosting
- Database: Firebase Firestore (free tier, 1GB storage)

## User Roles (✅ Implemented)

Defined in `backend/app/schemas/user.py`:
- **admin**: Full system management
- **qa_manager**: Project management, test planning
- **qa_engineer**: Test case creation and execution
- **developer**: Read and comment access
- **viewer**: Read-only access (default for new registrations)

## Implementation Status

### ✅ Phase 1 - MVP Complete
- User authentication (JWT-based register/login)
- Project management (CRUD operations)
- Test case management (CRUD + version history)
- Role-based access control (RBAC)
- TMS-style UI with 3-column layout
- Firestore integration
- Deployed to production ($0/month)

### 🔄 Phase 2 - In Progress
- Test execution management
- Dashboard and statistics
- Advanced reporting

### 📅 Phase 3 - Planned
- Jira integration
- Email notifications
- File attachments
- Test automation framework integration

### 📅 Phase 4 - Future
- SSO/MFA
- AI-powered test recommendations
- Performance analytics

## Working with This Repository

### Key Technical Decisions Made

1. **Database: Firestore (not PostgreSQL)**
   - All IDs are strings, not integers
   - No foreign key constraints
   - Document-based, not relational

2. **Python Dependencies: Pure Python Only**
   - No Rust-compiled packages (bcrypt, cryptography)
   - Uses pbkdf2_sha256 for password hashing
   - python-jose without [cryptography] extra

3. **Pydantic: v1.10.18 (not v2)**
   - Compatible with Python 3.13
   - pydantic-settings removed (using python-dotenv)

4. **Frontend API URL**
   - Development: `http://localhost:8000/api/v1`
   - Production: `https://testcase-tool.onrender.com/api/v1`

### Important Files

- `backend/app/schemas/*.py` - All enums (UserRole, TestPriority, etc.) defined here
- `backend/app/db/firestore.py` - Firestore helper class with CRUD operations
- `backend/create_admin.py` - Creates admin user (admin@tcms.com / admin123)
- `backend/requirements.txt` - Pure Python dependencies only
- `render.yaml` - Render.com deployment configuration

### Common Tasks

#### Create Admin User
```bash
cd backend
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

#### Deploy
- Backend: Push to GitHub → Render.com auto-deploys
- Frontend: `npm run build && firebase deploy`

### Environment Variables (Render.com)

Required environment variables:
- `SECRET_KEY` - JWT secret
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY_ID`
- `FIREBASE_PRIVATE_KEY` (with \n, not actual newlines)
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_CLIENT_ID`
- `FIREBASE_CLIENT_X509_CERT_URL`
