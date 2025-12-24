# Supabase Branch - Migration In Progress

This branch contains the migration from Firebase Firestore to Supabase PostgreSQL.

## Current Branch Status

🚧 **Migration branch - Not yet production ready**

## What's Changed

### Added Files
1. **`backend/supabase_schema.sql`** - Complete PostgreSQL schema for all tables
2. **`backend/app/db/supabase.py`** - Supabase client and helper functions
3. **`SUPABASE_MIGRATION.md`** - Complete migration guide with step-by-step instructions

### Modified Files
1. **`backend/requirements.txt`** - Added `supabase==2.10.0` dependency

## Next Steps

To complete the migration, you need to:

### 1. Create Supabase Project

Visit https://supabase.com and create a new project:
- Name: `testcase-tool`
- Region: Northeast Asia (Seoul) or closest
- Plan: Free tier

### 2. Run Database Schema

In Supabase SQL Editor, run the contents of:
```
backend/supabase_schema.sql
```

### 3. Create Storage Bucket

In Supabase Storage, create bucket:
- Name: `issue-attachments`
- Public: Yes

### 4. Get Credentials

From Supabase dashboard Settings → API:
- Copy **Project URL**
- Copy **service_role** key (secret)

### 5. Set Environment Variables

Add to your `.env` file or Render.com:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### 6. Update Backend Code

Replace Firestore imports with Supabase:
```python
# Before
from app.db.firestore import users_collection

# After
from app.db.supabase import users_collection
```

The helper functions remain the same (get, list, create, update, delete).

### 7. Update File Upload

In `backend/app/api/v1/issues.py`, replace `/tmp` storage with Supabase Storage using the `upload_file()` function from `app.db.supabase`.

## Architecture Comparison

### Before (main branch)
```
Frontend: Firebase Hosting
Backend: Render.com (FastAPI)
Database: Firebase Firestore (NoSQL)
File Storage: /tmp (ephemeral)
```

### After (supabase branch)
```
Frontend: Firebase Hosting (unchanged)
Backend: Render.com (FastAPI, unchanged)
Database: Supabase PostgreSQL (SQL)
File Storage: Supabase Storage (persistent)
```

## Benefits

1. ✅ **Persistent file storage** - No more ephemeral /tmp
2. ✅ **Stronger database** - PostgreSQL with relations, joins, transactions
3. ✅ **Better queries** - Complex filtering and sorting
4. ✅ **Still $0/month** - Using only free tiers
5. ✅ **Scalability** - Easier to scale in the future

## Testing Checklist

Before merging to main, verify:

- [ ] All database tables created successfully
- [ ] Storage bucket created and configured
- [ ] User authentication working
- [ ] Project CRUD operations working
- [ ] Test case CRUD operations working
- [ ] Test run creation and execution working
- [ ] Issue creation with file upload working
- [ ] File attachments display correctly
- [ ] Dashboard statistics loading
- [ ] All API endpoints responding correctly

## Rollback

If issues occur, simply checkout main branch:
```bash
git checkout main
```

All Firestore code remains intact.

## Documentation

See **`SUPABASE_MIGRATION.md`** for complete migration guide.

## Questions?

Create an issue on GitHub with the `supabase-migration` label.
