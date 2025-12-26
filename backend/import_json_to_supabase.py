"""
Import data from JSON backup files to Supabase

This script imports data from JSON backup files (created by backup_firestore.py)
directly to Supabase PostgreSQL database.

Prerequisites:
1. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables
2. Ensure Supabase schema is already created (run supabase_schema.sql)
3. Have JSON backup files in backend/backup/TIMESTAMP/

Usage:
    # List available backups
    python backend/import_json_to_supabase.py --list

    # Import from latest backup
    python backend/import_json_to_supabase.py --latest

    # Import from specific backup
    python backend/import_json_to_supabase.py 20250126_143500
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

# Add backend to path
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


def list_backups(backup_dir: Path):
    """List all available backups"""
    backups = sorted([d for d in backup_dir.iterdir() if d.is_dir()], reverse=True)

    if not backups:
        print("❌ No backups found in backend/backup/")
        return []

    print("\n📁 Available backups:\n")
    for backup in backups:
        summary_file = backup / '_backup_summary.json'
        if summary_file.exists():
            with open(summary_file, 'r') as f:
                summary = json.load(f)

            print(f"  📅 {backup.name}")
            print(f"     Date: {summary.get('backup_date', 'Unknown')}")
            print(f"     Documents: {summary.get('total_documents', 0)}")
            print(f"     Collections: {len(summary.get('collections', []))}")
            print()

    return backups


def import_collection(
    collection_name: str,
    supabase_collection,
    json_file: Path,
    field_mapping: dict = None,
    skip_fields: list = None
) -> int:
    """
    Import a collection from JSON to Supabase

    Args:
        collection_name: Name of collection
        supabase_collection: Supabase collection helper
        json_file: Path to JSON backup file
        field_mapping: Dict to rename fields (old_name -> new_name)
        skip_fields: List of fields to skip

    Returns:
        Number of documents imported
    """
    field_mapping = field_mapping or {}
    skip_fields = skip_fields or []

    print(f"\n📦 Importing {collection_name}...")

    # Load JSON data
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not data:
        print(f"⚠️  {collection_name}: No data found")
        return 0

    imported_count = 0
    error_count = 0

    for doc in data:
        try:
            # Apply field mapping (rename fields)
            for old_name, new_name in field_mapping.items():
                if old_name in doc:
                    doc[new_name] = doc.pop(old_name)

            # Remove skipped fields
            for field in skip_fields:
                doc.pop(field, None)

            # Remove or fix fields that don't exist in Supabase schema
            # (already handled by skip_fields)

            # Import to Supabase using direct insert (preserve timestamps and IDs)
            # Use upsert to handle duplicates
            result = supabase_collection.table.upsert(doc).execute()
            if not result.data:
                raise Exception("Insert failed - no data returned")
            imported_count += 1

            if imported_count % 10 == 0:
                print(f"   ✓ Imported {imported_count} documents...")

        except Exception as e:
            error_count += 1
            print(f"   ✗ Error importing document {doc.get('id', 'unknown')}: {str(e)}")
            # Print first error in detail for debugging
            if error_count == 1:
                import traceback
                print(f"      First error details: {traceback.format_exc()}")

    print(f"✅ {collection_name}: {imported_count} imported, {error_count} errors")
    return imported_count


def main():
    """Main import function"""
    print("=" * 60)
    print("📥 Import JSON Backup to Supabase")
    print("=" * 60)

    # Check environment variables
    if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_SERVICE_KEY'):
        print("\n❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        print("\nSet environment variables:")
        print("  export SUPABASE_URL='your-supabase-url'")
        print("  export SUPABASE_SERVICE_KEY='your-service-role-key'")
        return

    backup_dir = Path(__file__).parent / 'backup'

    if not backup_dir.exists():
        print(f"\n❌ Backup directory not found: {backup_dir}")
        print("\nRun backup_firestore.py first to create backups")
        return

    # Handle command line arguments
    if len(sys.argv) > 1:
        arg = sys.argv[1]

        if arg == '--list':
            list_backups(backup_dir)
            return

        if arg == '--latest':
            backups = list_backups(backup_dir)
            if not backups:
                return
            timestamp = backups[0].name
            print(f"📅 Using latest backup: {timestamp}\n")
        else:
            timestamp = arg
    else:
        print("\nUsage:")
        print("  python backend/import_json_to_supabase.py --list         (list backups)")
        print("  python backend/import_json_to_supabase.py --latest       (import latest)")
        print("  python backend/import_json_to_supabase.py TIMESTAMP      (import specific)")
        print("\nExample:")
        print("  python backend/import_json_to_supabase.py 20250126_143500")
        return

    # Check if backup exists
    import_dir = backup_dir / timestamp
    if not import_dir.exists():
        print(f"\n❌ Backup not found: {import_dir}")
        print("\nAvailable backups:")
        list_backups(backup_dir)
        return

    # Show backup info
    summary_file = import_dir / '_backup_summary.json'
    if summary_file.exists():
        with open(summary_file, 'r') as f:
            summary = json.load(f)
        print(f"📊 Backup information:")
        print(f"   Date: {summary.get('backup_date', 'Unknown')}")
        print(f"   Total documents: {summary.get('total_documents', 0)}")
        print(f"   Collections: {', '.join(summary.get('collections', []))}")

    # Confirm import (skip if --yes flag)
    print(f"\n⚠️  WARNING: This will import data to Supabase")
    print(f"   Make sure Supabase schema is already created!")
    print(f"   (Run supabase_schema.sql in Supabase SQL Editor)")

    if '--yes' not in sys.argv:
        response = input("\nContinue? (yes/no): ")
        if response.lower() != 'yes':
            print("Import cancelled")
            return
    else:
        print("\n✅ Auto-confirmed with --yes flag")

    print("\n✅ Connected to Supabase")

    # Import collections
    total_imported = 0

    # 1. Users (with field name changes)
    json_file = import_dir / 'users.json'
    if json_file.exists():
        count = import_collection(
            'users',
            users_collection,
            json_file,
            field_mapping={'hashed_password': 'password_hash'},
            skip_fields=['is_locked']  # This field doesn't exist in Supabase schema
        )
        total_imported += count

    # 2. Projects (key field will be auto-generated if missing)
    json_file = import_dir / 'projects.json'
    if json_file.exists():
        import tempfile
        # Generate key from project name for projects without key
        with open(json_file, 'r', encoding='utf-8') as f:
            projects_data = json.load(f)
            for proj in projects_data:
                if 'key' not in proj or not proj['key']:
                    # Generate key from name (uppercase, remove spaces)
                    proj['key'] = proj.get('name', 'PROJ').upper().replace(' ', '')[:10]
            # Save back to temp file for import
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8') as tmp:
                json.dump(projects_data, tmp, ensure_ascii=False, indent=2)
                temp_file = tmp.name

        count = import_collection(
            'projects',
            projects_collection,
            Path(temp_file)
        )
        total_imported += count
        # Clean up temp file
        os.unlink(temp_file)

    # 3. Folders (Firestore uses 'testfolders', Supabase uses 'folders')
    json_file = import_dir / 'testfolders.json'  # Read from testfolders.json
    if json_file.exists():
        count = import_collection(
            'folders',
            folders_collection,
            json_file
        )
        total_imported += count
    else:
        # Try legacy 'folders.json' name for backward compatibility
        json_file = import_dir / 'folders.json'
        if json_file.exists():
            count = import_collection(
                'folders',
                folders_collection,
                json_file
            )
            total_imported += count

    # 4. Test Cases (preserve folder_id)
    json_file = import_dir / 'testcases.json'
    if json_file.exists():
        count = import_collection(
            'testcases',
            testcases_collection,
            json_file
        )
        total_imported += count

    # 5. Test Case History (with field mapping and skip updated_at)
    json_file = import_dir / 'testcase_history.json'
    if json_file.exists():
        count = import_collection(
            'testcase_history',
            testcase_history_collection,
            json_file,
            field_mapping={'changed_by': 'modified_by'},
            skip_fields=['updated_at']  # This field doesn't exist in testcase_history schema
        )
        total_imported += count

    # 6. Test Runs (skip milestone and test_case_ids fields)
    json_file = import_dir / 'testruns.json'
    if json_file.exists():
        count = import_collection(
            'testruns',
            testruns_collection,
            json_file,
            skip_fields=['milestone', 'test_case_ids']  # These fields don't exist in Supabase schema
        )
        total_imported += count

    # 7. Test Run - Test Cases junction
    json_file = import_dir / 'testrun_testcases.json'
    if json_file.exists():
        count = import_collection(
            'testrun_testcases',
            testrun_testcases_collection,
            json_file
        )
        total_imported += count

    # 8. Test Results (with field mapping and skip fields)
    json_file = import_dir / 'testresults.json'
    if json_file.exists():
        count = import_collection(
            'testresults',
            testresults_collection,
            json_file,
            field_mapping={
                'test_run_id': 'testrun_id',
                'test_case_id': 'testcase_id',
                'tested_at': 'executed_at',
                'tester_id': 'executed_by'
            },
            skip_fields=['defect_url', 'execution_time', 'history']  # These fields don't exist in Supabase schema
        )
        total_imported += count

    # 9. Test Result History
    json_file = import_dir / 'testresult_history.json'
    if json_file.exists():
        count = import_collection(
            'testresult_history',
            testresult_history_collection,
            json_file
        )
        total_imported += count

    # 10. Issues (skip resolution field, remove empty testcase_id)
    json_file = import_dir / 'issues.json'
    if json_file.exists():
        import tempfile
        with open(json_file, 'r', encoding='utf-8') as f:
            issues_data = json.load(f)
            for issue in issues_data:
                # Remove testcase_id if it's empty or None
                if 'testcase_id' in issue and not issue['testcase_id']:
                    issue.pop('testcase_id', None)
            # Save to temp file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8') as tmp:
                json.dump(issues_data, tmp, ensure_ascii=False, indent=2)
                temp_file = tmp.name

        count = import_collection(
            'issues',
            issues_collection,
            Path(temp_file),
            skip_fields=['resolution']  # This field doesn't exist in Supabase schema
        )
        total_imported += count
        os.unlink(temp_file)

    # Print summary
    print("\n" + "=" * 60)
    print("✅ Import Complete!")
    print("=" * 60)
    print(f"📊 Total documents imported: {total_imported}")
    print(f"📁 Imported from: {import_dir}")

    print(f"\n📝 Next steps:")
    print("   1. Verify data in Supabase Dashboard (Table Editor)")
    print("   2. Test login with imported users")
    print("   3. Test all features to ensure data integrity")
    print("   4. Deploy backend to Render (already done)")
    print("   5. Deploy frontend to Firebase Hosting")


if __name__ == '__main__':
    main()
