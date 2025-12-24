# Supabase Migration Guide

This document explains how to migrate the Test Case Management System from Firestore to Supabase.

## Overview

**Current Architecture:**
- Frontend: Firebase Hosting
- Backend API: Render.com (FastAPI)
- Database: Firebase Firestore (NoSQL)
- File Storage: Backend /tmp (ephemeral)

**New Architecture:**
- Frontend: Firebase Hosting (unchanged)
- Backend API: Render.com (FastAPI, unchanged)
- Database: Supabase PostgreSQL (SQL)
- File Storage: Supabase Storage (persistent)

## Prerequisites

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Sign in with GitHub
3. Click "New Project"
4. Fill in:
   - **Organization**: Create new or select existing
   - **Name**: `testcase-tool`
   - **Database Password**: Strong password (save it!)
   - **Region**: Northeast Asia (Seoul) or closest
   - **Plan**: Free
5. Wait ~2 minutes for project creation

### 2. Get Supabase Credentials

From your Supabase project dashboard:

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: For frontend (if needed)
   - **service_role secret** key: For backend API

3. Go to **Settings** → **Database**
4. Copy **Connection string** → **URI**

## Step 1: Run Database Migration

### 1.1 Execute SQL Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy contents of `backend/supabase_schema.sql`
4. Paste and click **Run**
5. Verify all tables are created in **Table Editor**

### 1.2 Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Name: `issue-attachments`
4. **Public bucket**: Yes (for public image access)
5. Click **Create bucket**

6. Set bucket policy:
   - Go to **Policies** tab
   - Click **New policy**
   - Template: **Custom**
   - Policy name: `Public read access`
   - Check **SELECT** operation
   - Target roles: `public`
   - **Using expression**: `true`
   - Click **Review** → **Save policy**

## Step 2: Configure Environment Variables

### 2.1 Backend (.env for local development)

Create `backend/.env`:

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# JWT (keep existing)
SECRET_KEY=your-existing-secret-key

# Keep other existing variables...
```

### 2.2 Render.com Environment Variables

In Render.com dashboard, add:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

**Remove** these Firebase variables:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_CLIENT_ID`
- `FIREBASE_CLIENT_X509_CERT_URL`

## Step 3: Update Backend Code

### 3.1 Install Dependencies

```bash
cd backend
pip install supabase==2.10.0
```

### 3.2 Update Import Statements

Replace all Firestore imports with Supabase:

**Before:**
```python
from app.db.firestore import users_collection, projects_collection, ...
```

**After:**
```python
from app.db.supabase import users_collection, projects_collection, ...
```

### 3.3 Update File Upload (issues.py)

Replace `/tmp` file storage with Supabase Storage:

**Before:**
```python
UPLOAD_DIR = Path("/tmp/issue_attachments")
```

**After:**
```python
from app.db.supabase import upload_file, get_file_url

@router.post("/upload")
async def upload_attachment(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user_firestore)
):
    # Validate file...

    # Upload to Supabase Storage
    timestamp = int(time.time() * 1000)
    filename = f"{timestamp}_{file.filename}"

    file_data = await file.read()
    public_url = upload_file("issue-attachments", filename, file_data)

    return {"url": public_url}
```

## Step 4: Data Migration (Optional)

If you have existing data in Firestore that needs to be migrated:

### 4.1 Export Firestore Data

```python
# Create migration script: backend/migrate_data.py
import firebase_admin
from firebase_admin import credentials, firestore
from app.db.supabase import *

# Initialize Firebase
cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Migrate users
users = db.collection('users').stream()
for user_doc in users:
    user_data = user_doc.to_dict()
    user_data['id'] = user_doc.id
    users_collection.create(user_data)

# Repeat for other collections...
```

### 4.2 Run Migration

```bash
cd backend
python migrate_data.py
```

## Step 5: Testing

### 5.1 Test Database Connection

```bash
cd backend
python -c "from app.db.supabase import supabase; print(supabase.table('users').select('*').execute())"
```

### 5.2 Test File Upload

1. Start backend server
2. Login to application
3. Create an issue with screenshot attachment
4. Verify file appears in Supabase Storage dashboard
5. Verify image loads in issue detail view

### 5.3 Test All API Endpoints

Run through the complete workflow:
1. Register/Login
2. Create project
3. Create test cases
4. Create test run
5. Record test results
6. Create issue with attachment
7. View dashboard statistics

## Step 6: Deploy

### 6.1 Commit and Push

```bash
git add .
git commit -m "feat: Migrate from Firestore to Supabase"
git push origin supabase
```

### 6.2 Verify Render.com Deployment

1. Check Render.com logs for errors
2. Verify environment variables are set
3. Test production API endpoints

### 6.3 Merge to Main (after testing)

```bash
git checkout main
git merge supabase
git push origin main
```

## Rollback Plan

If migration fails, rollback is simple:

```bash
git checkout main
```

All Firestore code remains intact on `main` branch.

## Benefits After Migration

1. **Persistent File Storage**: Files won't be lost on server restart
2. **Stronger Database**: PostgreSQL with relations, joins, transactions
3. **Better Queries**: Complex filtering and sorting
4. **Still $0/month**: Using only free tiers
5. **Scalability**: Easier to scale in the future

## Troubleshooting

### Error: "relation does not exist"

- Solution: Re-run `supabase_schema.sql` in SQL Editor

### Error: "Invalid API key"

- Solution: Verify `SUPABASE_SERVICE_KEY` is the **service_role** key, not anon key

### Files not uploading

- Solution: Check bucket exists and is public in Supabase Storage dashboard

### Connection timeout

- Solution: Verify `SUPABASE_URL` is correct and includes `https://`

## Support

For issues during migration:
1. Check Supabase logs in dashboard
2. Check Render.com logs
3. Review this migration guide
4. Create GitHub issue with error details
