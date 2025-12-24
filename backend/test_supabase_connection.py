"""
Test Supabase connection and setup
Run this to verify:
1. Environment variables are set correctly
2. Can connect to Supabase
3. Check if tables exist
4. Check if storage bucket exists
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

print("=" * 60)
print("SUPABASE CONNECTION TEST")
print("=" * 60)

# 1. Check environment variables
print("\n1. Checking environment variables...")
if not SUPABASE_URL:
    print("❌ SUPABASE_URL is not set")
else:
    print(f"✅ SUPABASE_URL: {SUPABASE_URL}")

if not SUPABASE_KEY:
    print("❌ SUPABASE_SERVICE_KEY is not set")
else:
    print(f"✅ SUPABASE_SERVICE_KEY: {SUPABASE_KEY[:20]}...")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("\n❌ Missing environment variables. Please set them and try again.")
    exit(1)

# 2. Try to connect to Supabase
print("\n2. Testing Supabase connection...")
try:
    from supabase import create_client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase client created successfully")
except Exception as e:
    print(f"❌ Failed to create Supabase client: {e}")
    exit(1)

# 3. Check if tables exist
print("\n3. Checking if database tables exist...")
required_tables = [
    "users", "projects", "folders", "testcases", "testcase_history",
    "testruns", "testrun_testcases", "testresults", "testresult_history", "issues"
]

tables_exist = {}
for table in required_tables:
    try:
        result = supabase.table(table).select("*").limit(1).execute()
        tables_exist[table] = True
        print(f"✅ Table '{table}' exists")
    except Exception as e:
        tables_exist[table] = False
        print(f"❌ Table '{table}' does not exist - {str(e)[:50]}")

# 4. Check if storage bucket exists
print("\n4. Checking if storage bucket exists...")
try:
    buckets = supabase.storage.list_buckets()
    bucket_names = [b.name for b in buckets]

    if "issue-attachments" in bucket_names:
        print("✅ Storage bucket 'issue-attachments' exists")
    else:
        print("❌ Storage bucket 'issue-attachments' does not exist")
        print(f"   Existing buckets: {bucket_names}")
except Exception as e:
    print(f"❌ Failed to check storage buckets: {e}")

# 5. Summary
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)

all_tables_exist = all(tables_exist.values())
if all_tables_exist:
    print("✅ All database tables are set up correctly")
else:
    print("❌ Some database tables are missing. You need to run the SQL schema.")
    print("\nMissing tables:")
    for table, exists in tables_exist.items():
        if not exists:
            print(f"  - {table}")

    print("\n📝 Next step: Run backend/supabase_schema.sql in Supabase SQL Editor")
    print("   1. Go to https://supabase.com/dashboard")
    print("   2. Select your project")
    print("   3. Go to 'SQL Editor'")
    print("   4. Click 'New query'")
    print("   5. Copy and paste the contents of backend/supabase_schema.sql")
    print("   6. Click 'Run' to execute")

print("\n" + "=" * 60)
