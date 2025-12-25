"""
Supabase client configuration and helper functions
"""
import os
from typing import Dict, List, Optional, Any
from supabase import create_client, Client
from datetime import datetime

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")  # Use service_role key for backend

# Validate environment variables
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "Missing required Supabase environment variables. "
        "Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in Render.com dashboard. "
        f"SUPABASE_URL={'set' if SUPABASE_URL else 'MISSING'}, "
        f"SUPABASE_SERVICE_KEY={'set' if SUPABASE_KEY else 'MISSING'}"
    )

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class SupabaseCollection:
    """Helper class for Supabase table operations (similar to Firestore collection)"""

    def __init__(self, table_name: str):
        self.table_name = table_name
        self.table = supabase.table(table_name)

    def get(self, doc_id: str) -> Optional[Dict]:
        """Get a single document by ID"""
        result = self.table.select("*").eq("id", doc_id).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None

    def list(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """List all documents with pagination"""
        result = self.table.select("*").range(offset, offset + limit - 1).execute()
        return result.data or []

    def query(self, field: str, operator: str, value: Any) -> List[Dict]:
        """Query documents by field"""
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

    def create(self, data: Dict) -> Dict:
        """Create a new document"""
        # Remove id if present (will be auto-generated)
        data_copy = data.copy()
        if 'id' in data_copy and not data_copy['id']:
            del data_copy['id']

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
