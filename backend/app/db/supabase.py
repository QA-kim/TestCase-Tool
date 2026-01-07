"""
Supabase client configuration and helper functions
"""
import os
import uuid
from typing import Dict, List, Optional, Any
from supabase import create_client, Client, ClientOptions
from datetime import datetime, timezone

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")  # Use service_role key for backend

# Validate environment variables
if not SUPABASE_URL or not SUPABASE_KEY:
    error_msg = (
        "Missing required Supabase environment variables. "
        "Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in Render.com dashboard. "
        f"SUPABASE_URL={'set' if SUPABASE_URL else 'MISSING'}, "
        f"SUPABASE_SERVICE_KEY={'set' if SUPABASE_KEY else 'MISSING'}"
    )
    print(f"❌ {error_msg}")
    raise ValueError(error_msg)

# Debug logging (will be visible in Render logs)
print(f"🔍 Supabase Configuration:")
print(f"   URL: {SUPABASE_URL[:30]}... (length: {len(SUPABASE_URL)})")
print(f"   KEY: {SUPABASE_KEY[:20]}... (length: {len(SUPABASE_KEY)})")
print(f"   KEY starts with 'eyJ': {SUPABASE_KEY.startswith('eyJ')}")

# Create Supabase client with retry configuration
try:
    # Create Supabase client with ClientOptions
    # Note: Supabase SDK uses its own HTTP client internally
    options = ClientOptions(
        auto_refresh_token=False,
        persist_session=False,
        headers={
            "Connection": "keep-alive",
            "Keep-Alive": "timeout=30, max=100"
        }
    )

    supabase: Client = create_client(
        SUPABASE_URL,
        SUPABASE_KEY,
        options=options
    )
    print("✅ Supabase client created successfully")
except Exception as e:
    print(f"❌ Failed to create Supabase client: {type(e).__name__}: {e}")
    print(f"   URL format check: {SUPABASE_URL.startswith('https://')}")
    print(f"   URL ends with .supabase.co: {'.supabase.co' in SUPABASE_URL}")
    print(f"   Full error details:")
    import traceback
    traceback.print_exc()
    raise


class SupabaseCollection:
    """Helper class for Supabase table operations (similar to Firestore collection)"""

    def __init__(self, table_name: str):
        self.table_name = table_name
        self.table = supabase.table(table_name)

    def get(self, doc_id: str) -> Optional[Dict]:
        """Get a single document by ID"""
        import time
        max_retries = 3
        retry_delay = 0.5

        for attempt in range(max_retries):
            try:
                result = self.table.select("*").eq("id", doc_id).execute()
                if result.data and len(result.data) > 0:
                    return result.data[0]
                return None
            except Exception as e:
                error_msg = str(e).lower()
                if attempt < max_retries - 1 and any(err in error_msg for err in ['timeout', 'connection', 'temporarily unavailable', 'resource']):
                    print(f"⚠️  Retry {attempt + 1}/{max_retries} for get({self.table_name}, {doc_id}): {type(e).__name__}")
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                print(f"❌ Error in get({self.table_name}, {doc_id}): {type(e).__name__}: {e}")
                raise

    def get_by_field(self, field: str, value: Any) -> Optional[Dict]:
        """Get a single document by field value"""
        import time
        max_retries = 3
        retry_delay = 0.5

        for attempt in range(max_retries):
            try:
                result = self.table.select("*").eq(field, value).execute()
                if result.data and len(result.data) > 0:
                    return result.data[0]
                return None
            except Exception as e:
                error_msg = str(e).lower()
                if attempt < max_retries - 1 and any(err in error_msg for err in ['timeout', 'connection', 'temporarily unavailable', 'resource']):
                    print(f"⚠️  Retry {attempt + 1}/{max_retries} for get_by_field({self.table_name}, {field}): {type(e).__name__}")
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                print(f"❌ Error in get_by_field({self.table_name}, {field}={value}): {type(e).__name__}: {e}")
                raise

    def list(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """List all documents with pagination"""
        import time
        max_retries = 3
        retry_delay = 0.5

        for attempt in range(max_retries):
            try:
                result = self.table.select("*").range(offset, offset + limit - 1).execute()
                return result.data or []
            except Exception as e:
                error_msg = str(e).lower()
                # Retry on connection errors
                if attempt < max_retries - 1 and any(err in error_msg for err in ['timeout', 'connection', 'temporarily unavailable', 'resource']):
                    print(f"⚠️  Retry {attempt + 1}/{max_retries} for list({self.table_name}): {type(e).__name__}")
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                print(f"❌ Error in list({self.table_name}): {type(e).__name__}: {e}")
                raise

    def query(self, field: str, operator: str, value: Any) -> List[Dict]:
        """Query documents by field"""
        import time
        max_retries = 3
        retry_delay = 0.5

        for attempt in range(max_retries):
            try:
                query = self.table.select("*")

                if operator == "==":
                    query = query.eq(field, value)
                elif operator == "!=":
                    query = query.neq(field, value)
                elif operator == ">":
                    query = query.gt(field, value)
                elif operator == ">=":
                    query = query.gte(field, value)
                elif operator == "<":
                    query = query.lt(field, value)
                elif operator == "<=":
                    query = query.lte(field, value)
                elif operator == "in":
                    query = query.in_(field, value)

                result = query.execute()
                return result.data or []
            except Exception as e:
                error_msg = str(e).lower()
                if attempt < max_retries - 1 and any(err in error_msg for err in ['timeout', 'connection', 'temporarily unavailable', 'resource']):
                    print(f"⚠️  Retry {attempt + 1}/{max_retries} for query({self.table_name}, {field}): {type(e).__name__}")
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                print(f"❌ Error in query({self.table_name}, {field}={value}): {type(e).__name__}: {e}")
                raise

    def create(self, data: Dict) -> Dict:
        """Create a new document"""
        # Generate UUID if id is missing or empty
        data_copy = data.copy()
        if 'id' not in data_copy or not data_copy['id']:
            data_copy['id'] = str(uuid.uuid4())

        # Set timestamps
        now = datetime.utcnow().isoformat()
        if 'created_at' not in data_copy:
            data_copy['created_at'] = now
        if 'updated_at' not in data_copy:
            data_copy['updated_at'] = now

        result = self.table.insert(data_copy).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
        raise Exception("Failed to create document")

    def update(self, doc_id: str, data: Dict) -> Dict:
        """Update a document"""
        # Add updated_at timestamp
        data_copy = data.copy()
        data_copy['updated_at'] = datetime.utcnow().isoformat()

        result = self.table.update(data_copy).eq("id", doc_id).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
        raise Exception("Failed to update document")

    def delete(self, doc_id: str) -> None:
        """Delete a document"""
        self.table.delete().eq("id", doc_id).execute()

    def query_complex(self, filters: List[tuple]) -> List[Dict]:
        """Complex query with multiple filters
        Args:
            filters: List of (field, operator, value) tuples
        """
        query = self.table.select("*")

        for field, operator, value in filters:
            if operator == "==":
                query = query.eq(field, value)
            elif operator == "!=":
                query = query.neq(field, value)
            elif operator == ">":
                query = query.gt(field, value)
            elif operator == ">=":
                query = query.gte(field, value)
            elif operator == "<":
                query = query.lt(field, value)
            elif operator == "<=":
                query = query.lte(field, value)
            elif operator == "in":
                query = query.in_(field, value)

        result = query.execute()
        return result.data or []


# Initialize collections
users_collection = SupabaseCollection("users")
projects_collection = SupabaseCollection("projects")
folders_collection = SupabaseCollection("folders")
testcases_collection = SupabaseCollection("testcases")
testcase_history_collection = SupabaseCollection("testcase_history")
testruns_collection = SupabaseCollection("testruns")
testrun_testcases_collection = SupabaseCollection("testrun_testcases")
testresults_collection = SupabaseCollection("testresults")
testresult_history_collection = SupabaseCollection("testresult_history")
issues_collection = SupabaseCollection("issues")
issue_history_collection = SupabaseCollection("issue_history")


# Supabase Storage for file uploads
def upload_file(bucket_name: str, file_path: str, file_data: bytes) -> str:
    """Upload file to Supabase Storage

    Args:
        bucket_name: Name of the storage bucket
        file_path: Path/name for the file in storage
        file_data: Binary file data

    Returns:
        Public URL of the uploaded file
    """
    result = supabase.storage.from_(bucket_name).upload(file_path, file_data)

    # Get public URL
    public_url = supabase.storage.from_(bucket_name).get_public_url(file_path)
    return public_url


def delete_file(bucket_name: str, file_path: str) -> None:
    """Delete file from Supabase Storage"""
    supabase.storage.from_(bucket_name).remove([file_path])


def get_file_url(bucket_name: str, file_path: str) -> str:
    """Get public URL for a file in Supabase Storage"""
    return supabase.storage.from_(bucket_name).get_public_url(file_path)
