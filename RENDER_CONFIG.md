# Render.com Configuration Guide for Supabase Migration

This guide explains how to configure Render.com environment variables after migrating to Supabase.

## Prerequisites

Before configuring Render.com, you must:

1. ✅ Create Supabase project
2. ✅ Run database schema (`supabase_schema.sql`)
3. ✅ Create `issue-attachments` storage bucket
4. ✅ Have Supabase credentials ready

## Step 1: Get Supabase Credentials

From your Supabase project dashboard:

### 1.1 Project URL and API Keys

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **service_role** key (secret key for backend)

### 1.2 Database Connection (Optional)

1. Go to **Settings** → **Database**
2. Copy **Connection string** → **URI** (for direct database access if needed)

## Step 2: Configure Render.com Environment Variables

### 2.1 Access Render.com Dashboard

1. Go to https://dashboard.render.com
2. Select your **testcase-tool** web service
3. Click **Environment** in the left sidebar

### 2.2 Add New Environment Variables

Click **Add Environment Variable** and add the following:

#### Required Supabase Variables

| Key | Value | Notes |
|-----|-------|-------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOi...` | service_role key (NOT anon key) |

#### Keep Existing Variables

**Do NOT remove these:**

| Key | Purpose |
|-----|---------|
| `SECRET_KEY` | JWT token signing |
| Any other custom variables | |

### 2.3 Remove Firebase Variables

**Delete these environment variables** (no longer needed):

- ❌ `FIREBASE_PROJECT_ID`
- ❌ `FIREBASE_PRIVATE_KEY_ID`
- ❌ `FIREBASE_PRIVATE_KEY`
- ❌ `FIREBASE_CLIENT_EMAIL`
- ❌ `FIREBASE_CLIENT_ID`
- ❌ `FIREBASE_CLIENT_X509_CERT_URL`

### 2.4 Final Environment Variables List

After configuration, you should have:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOi...
SECRET_KEY=your-jwt-secret-key
```

## Step 3: Deploy to Render.com

### 3.1 Trigger Deployment

After adding environment variables, Render.com will automatically redeploy.

**Or manually trigger deployment:**

1. Go to **Manual Deploy** tab
2. Click **Deploy latest commit**

### 3.2 Monitor Deployment

1. Go to **Logs** tab
2. Watch for successful startup
3. Look for lines like:
   ```
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://0.0.0.0:10000
   ```

### 3.3 Verify Deployment

Check the following endpoints:

1. **Health Check**: `https://testcase-tool.onrender.com/docs`
2. **Login**: Try logging in through frontend
3. **File Upload**: Create an issue with attachment

## Step 4: Troubleshooting

### Error: "relation does not exist"

**Cause**: Database schema not applied in Supabase

**Solution**:
1. Go to Supabase SQL Editor
2. Run `supabase_schema.sql` contents
3. Redeploy Render.com

### Error: "Invalid API key"

**Cause**: Wrong Supabase key used

**Solution**:
1. Verify you're using **service_role** key (not anon key)
2. Update `SUPABASE_SERVICE_KEY` in Render.com
3. Redeploy

### Error: "Bucket not found"

**Cause**: Storage bucket not created

**Solution**:
1. Go to Supabase Storage
2. Create `issue-attachments` bucket
3. Set bucket to **Public**
4. Test file upload again

### Cold Start is Slow

**This is normal** on Render.com free tier:
- First request after 15 min inactivity takes ~30 seconds
- Subsequent requests are fast
- **Not a Supabase issue** - this is Render.com's behavior

## Step 5: Verify Migration Success

### 5.1 Test Authentication

```bash
curl -X POST https://testcase-tool.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=yourpassword"
```

Should return JWT token.

### 5.2 Test Database Connection

```bash
curl https://testcase-tool.onrender.com/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Should return project list (or empty array if no projects).

### 5.3 Test File Upload

1. Login to frontend: https://testcase-e27a4.web.app
2. Create a new issue
3. Upload a screenshot
4. Verify image displays in issue detail

**Expected behavior:**
- File uploads to Supabase Storage
- URL returned like: `https://xxxxx.supabase.co/storage/v1/object/public/issue-attachments/...`
- Image loads directly from Supabase CDN

## Architecture After Migration

```
┌─────────────────┐
│ Firebase Hosting│ (Frontend - unchanged)
│  testcase-e27a4 │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Render.com     │ (Backend API - unchanged)
│  FastAPI        │
└────────┬────────┘
         │ Supabase Client
         ▼
┌─────────────────┐
│    Supabase     │ (Database + Storage - NEW)
│  - PostgreSQL   │
│  - Storage      │
└─────────────────┘
```

## Benefits Achieved

✅ **Persistent File Storage** - No more /tmp ephemeral files
✅ **PostgreSQL Database** - Stronger than Firestore NoSQL
✅ **Better Queries** - SQL joins, complex filtering
✅ **Still $0/month** - All free tiers
✅ **No Code Rewrite** - FastAPI unchanged

## Next Steps

After successful migration:

1. ✅ Test all features thoroughly
2. ✅ Monitor Render.com logs for errors
3. ✅ Check Supabase dashboard for usage
4. 📝 Update frontend if API URL changes
5. 🎉 Enjoy persistent file storage!

## Rollback Plan

If something goes wrong:

### Quick Rollback

```bash
git checkout main
git push -f origin main
```

This reverts to Firestore-based code.

### Render.com Rollback

1. Go to Render.com Dashboard
2. **Settings** → **Build & Deploy**
3. Find previous deploy
4. Click **Redeploy**

## Support

For issues:

1. Check Render.com logs
2. Check Supabase logs (Dashboard → Logs)
3. Review `SUPABASE_MIGRATION.md`
4. Create GitHub issue with error details
