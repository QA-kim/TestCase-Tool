"""
Migrate data from Firebase Firestore to Supabase PostgreSQL

Prerequisites:
1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable
2. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables
3. Ensure Supabase schema is already created (run supabase_schema.sql)

Usage:
    python backend/migrate_firestore_to_supabase.py
"""

import os
import sys
from datetime import datetime
from typing import Dict, List, Any

# Firebase imports
import firebase_admin
from firebase_admin import credentials, firestore

# Supabase imports
sys.path.insert(0, os.path.dirname(__file__))
from app.db.supabase import (
    users_collection,
    projects_collection,
    folders_collection,
    testcases_collection,
    testcase_history_collection,
    testruns_collection,
    testrun_testcases_collection,
    testresults_collection,
    testresult_history_collection,
    issues_collection
)


def init_firebase():
    """Initialize Firebase Admin SDK"""
    # Check if already initialized
    if not firebase_admin._apps:
        # Use default credentials or service account
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)

    return firestore.client()


def convert_timestamp(timestamp) -> str:
    """Convert Firestore timestamp to ISO 8601 string"""
    if timestamp is None:
        return None
    if isinstance(timestamp, datetime):
        return timestamp.isoformat()
    if hasattr(timestamp, 'to_pydatetime'):
        return timestamp.to_pydatetime().isoformat()
    if isinstance(timestamp, str):
        return timestamp
    return None


def migrate_collection(
    firestore_db,
    collection_name: str,
    supabase_collection,
    field_mapping: Dict[str, str] = None,
    skip_fields: List[str] = None
) -> int:
    """
    Generic migration function for a collection

    Args:
        firestore_db: Firestore client
        collection_name: Name of Firestore collection
        supabase_collection: Supabase collection helper
        field_mapping: Dict to rename fields (old_name -> new_name)
        skip_fields: List of fields to skip

    Returns:
        Number of documents migrated
    """
    field_mapping = field_mapping or {}
    skip_fields = skip_fields or []

    print(f"\n📦 Migrating {collection_name}...")

    # Get all documents from Firestore
    docs = firestore_db.collection(collection_name).stream()

    migrated_count = 0
    error_count = 0

    for doc in docs:
        try:
            data = doc.to_dict()

            # Preserve original ID
            data['id'] = doc.id

            # Apply field mapping (rename fields)
            for old_name, new_name in field_mapping.items():
                if old_name in data:
                    data[new_name] = data.pop(old_name)

            # Remove skipped fields
            for field in skip_fields:
                data.pop(field, None)

            # Convert timestamps
            for key, value in data.items():
                if hasattr(value, 'to_pydatetime'):
                    data[key] = convert_timestamp(value)

            # Create in Supabase
            supabase_collection.create(data)
            migrated_count += 1

            if migrated_count % 10 == 0:
                print(f"   ✓ Migrated {migrated_count} documents...")

        except Exception as e:
            error_count += 1
            print(f"   ✗ Error migrating {doc.id}: {e}")

    print(f"✅ {collection_name}: {migrated_count} migrated, {error_count} errors")
    return migrated_count


def main():
    """Main migration function"""
    print("=" * 60)
    print("🚀 Firestore to Supabase Migration")
    print("=" * 60)

    # Check environment variables
    if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_SERVICE_KEY'):
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        return

    # Initialize Firebase
    try:
        firestore_db = init_firebase()
        print("✅ Connected to Firestore")
    except Exception as e:
        print(f"❌ Failed to connect to Firestore: {e}")
        return

    # Confirm migration
    print("\n⚠️  WARNING: This will migrate data from Firestore to Supabase")
    print("   Make sure Supabase schema is already created!")
    response = input("\nContinue? (yes/no): ")
    if response.lower() != 'yes':
        print("Migration cancelled")
        return

    total_migrated = 0

    # Migrate collections
    try:
        # 1. Users (with field name changes)
        count = migrate_collection(
            firestore_db,
            'users',
            users_collection,
            field_mapping={'hashed_password': 'password_hash'},
            skip_fields=['is_locked']  # This field doesn't exist in Supabase schema
        )
        total_migrated += count

        # 2. Projects
        count = migrate_collection(
            firestore_db,
            'projects',
            projects_collection
        )
        total_migrated += count

        # 3. Folders
        count = migrate_collection(
            firestore_db,
            'folders',
            folders_collection
        )
        total_migrated += count

        # 4. Test Cases
        count = migrate_collection(
            firestore_db,
            'testcases',
            testcases_collection
        )
        total_migrated += count

        # 5. Test Case History
        count = migrate_collection(
            firestore_db,
            'testcase_history',
            testcase_history_collection
        )
        total_migrated += count

        # 6. Test Runs
        count = migrate_collection(
            firestore_db,
            'testruns',
            testruns_collection
        )
        total_migrated += count

        # 7. Test Run - Test Cases junction
        count = migrate_collection(
            firestore_db,
            'testrun_testcases',
            testrun_testcases_collection
        )
        total_migrated += count

        # 8. Test Results
        count = migrate_collection(
            firestore_db,
            'testresults',
            testresults_collection
        )
        total_migrated += count

        # 9. Test Result History
        count = migrate_collection(
            firestore_db,
            'testresult_history',
            testresult_history_collection
        )
        total_migrated += count

        # 10. Issues
        count = migrate_collection(
            firestore_db,
            'issues',
            issues_collection
        )
        total_migrated += count

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        return

    print("\n" + "=" * 60)
    print(f"✅ Migration complete! Total documents: {total_migrated}")
    print("=" * 60)
    print("\n📝 Next steps:")
    print("   1. Verify data in Supabase Dashboard")
    print("   2. Test login with migrated users")
    print("   3. Test all features to ensure data integrity")
    print("   4. Update frontend API URL if needed")


if __name__ == '__main__':
    main()
