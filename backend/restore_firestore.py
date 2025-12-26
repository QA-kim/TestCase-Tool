"""
Restore Firestore data from JSON backup

This script restores data from JSON backup files to Firestore.

Prerequisites:
1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable
   OR place serviceAccountKey.json in backend/ directory
2. Have a backup created by backup_firestore.py

Usage:
    # List available backups
    python backend/restore_firestore.py --list

    # Restore specific backup
    python backend/restore_firestore.py 20250126_143000

    # Restore latest backup
    python backend/restore_firestore.py --latest
"""

import os
import json
import sys
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from pathlib import Path


def init_firebase():
    """Initialize Firebase Admin SDK"""
    if not firebase_admin._apps:
        service_account_path = os.path.join(
            os.path.dirname(__file__),
            'serviceAccountKey.json'
        )

        if os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            print(f"✅ Using service account: {service_account_path}")
        else:
            cred = credentials.ApplicationDefault()
            print("✅ Using application default credentials")

        firebase_admin.initialize_app(cred)

    return firestore.client()


def deserialize_timestamp(value):
    """Convert ISO string back to datetime"""
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except:
            return value
    return value


def deserialize_data(data):
    """Convert data from JSON format back to Firestore format"""
    if data is None:
        return None

    if isinstance(data, dict):
        return {k: deserialize_data(v) for k, v in data.items()}

    if isinstance(data, list):
        return [deserialize_data(item) for item in data]

    # Try to convert string to datetime
    return deserialize_timestamp(data)


def restore_collection(db, collection_name: str, backup_file: Path) -> int:
    """
    Restore a collection from JSON backup

    Args:
        db: Firestore client
        collection_name: Name of collection
        backup_file: Path to backup JSON file

    Returns:
        Number of documents restored
    """
    print(f"\n📦 Restoring collection: {collection_name}")

    # Load backup data
    with open(backup_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    count = 0
    error_count = 0

    for doc_data in data:
        try:
            # Extract document ID
            doc_id = doc_data.pop('id')

            # Deserialize data
            restored_data = deserialize_data(doc_data)

            # Create/update document in Firestore
            db.collection(collection_name).document(doc_id).set(restored_data)

            count += 1
            if count % 10 == 0:
                print(f"   ✓ Restored {count} documents...")

        except Exception as e:
            error_count += 1
            print(f"   ✗ Error restoring document: {e}")

    print(f"✅ {collection_name}: {count} documents restored, {error_count} errors")
    return count


def list_backups(backup_dir: Path):
    """List all available backups"""
    backups = sorted([d for d in backup_dir.iterdir() if d.is_dir()], reverse=True)

    if not backups:
        print("❌ No backups found")
        return

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


def main():
    """Main restore function"""
    print("=" * 60)
    print("♻️  Firestore Data Restore")
    print("=" * 60)

    backup_dir = Path(__file__).parent / 'backup'

    # Handle command line arguments
    if len(sys.argv) > 1:
        arg = sys.argv[1]

        if arg == '--list':
            list_backups(backup_dir)
            return

        if arg == '--latest':
            backups = sorted([d for d in backup_dir.iterdir() if d.is_dir()], reverse=True)
            if not backups:
                print("❌ No backups found")
                return
            timestamp = backups[0].name
            print(f"📅 Using latest backup: {timestamp}")
        else:
            timestamp = arg
    else:
        print("Usage:")
        print("  python backend/restore_firestore.py --list         (list backups)")
        print("  python backend/restore_firestore.py --latest       (restore latest)")
        print("  python backend/restore_firestore.py TIMESTAMP      (restore specific)")
        print("\nExample:")
        print("  python backend/restore_firestore.py 20250126_143000")
        return

    # Check if backup exists
    restore_dir = backup_dir / timestamp
    if not restore_dir.exists():
        print(f"❌ Backup not found: {restore_dir}")
        print("\nAvailable backups:")
        list_backups(backup_dir)
        return

    # Show backup info
    summary_file = restore_dir / '_backup_summary.json'
    if summary_file.exists():
        with open(summary_file, 'r') as f:
            summary = json.load(f)
        print(f"\n📊 Backup information:")
        print(f"   Date: {summary.get('backup_date', 'Unknown')}")
        print(f"   Total documents: {summary.get('total_documents', 0)}")
        print(f"   Collections: {', '.join(summary.get('collections', []))}")

    # Confirm restore
    print(f"\n⚠️  WARNING: This will restore data to Firestore")
    print(f"   Existing data may be overwritten!")
    response = input("\nContinue? (yes/no): ")
    if response.lower() != 'yes':
        print("Restore cancelled")
        return

    # Initialize Firebase
    try:
        db = init_firebase()
        print("✅ Connected to Firestore\n")
    except Exception as e:
        print(f"❌ Failed to connect to Firestore: {e}")
        return

    # Restore collections
    collections = [
        'users',
        'projects',
        'folders',
        'testcases',
        'testcase_history',
        'testruns',
        'testrun_testcases',
        'testresults',
        'testresult_history',
        'issues'
    ]

    total_docs = 0

    for collection_name in collections:
        backup_file = restore_dir / f"{collection_name}.json"
        if backup_file.exists():
            try:
                count = restore_collection(db, collection_name, backup_file)
                total_docs += count
            except Exception as e:
                print(f"❌ Error restoring {collection_name}: {e}")
        else:
            print(f"⚠️  Skipping {collection_name} (backup file not found)")

    # Print summary
    print("\n" + "=" * 60)
    print("✅ Restore Complete!")
    print("=" * 60)
    print(f"📊 Total documents restored: {total_docs}")
    print(f"📁 Restored from: {restore_dir}")


if __name__ == '__main__':
    main()
