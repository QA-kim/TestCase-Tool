"""
Backup all Firestore data to JSON files

This script exports all data from Firestore collections to JSON files
for backup purposes before migrating to Supabase.

Prerequisites:
1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable
   OR place serviceAccountKey.json in backend/ directory

Usage:
    python backend/backup_firestore.py

Output:
    Creates backup/ directory with JSON files for each collection
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from pathlib import Path


def init_firebase():
    """Initialize Firebase Admin SDK"""
    if not firebase_admin._apps:
        # Try to use service account key file
        service_account_path = os.path.join(
            os.path.dirname(__file__),
            'serviceAccountKey.json'
        )

        if os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            print(f"✅ Using service account: {service_account_path}")
        else:
            # Use default credentials from environment variable
            cred = credentials.ApplicationDefault()
            print("✅ Using application default credentials")

        firebase_admin.initialize_app(cred)

    return firestore.client()


def serialize_firestore_data(data):
    """Convert Firestore data types to JSON-serializable format"""
    if data is None:
        return None

    if isinstance(data, dict):
        return {k: serialize_firestore_data(v) for k, v in data.items()}

    if isinstance(data, list):
        return [serialize_firestore_data(item) for item in data]

    # Convert Firestore Timestamp to ISO string
    if hasattr(data, 'to_pydatetime'):
        return data.to_pydatetime().isoformat()

    # Convert datetime to ISO string
    if isinstance(data, datetime):
        return data.isoformat()

    return data


def backup_collection(db, collection_name: str, output_dir: Path) -> int:
    """
    Backup a single collection to JSON file

    Args:
        db: Firestore client
        collection_name: Name of collection to backup
        output_dir: Directory to save backup file

    Returns:
        Number of documents backed up
    """
    print(f"\n📦 Backing up collection: {collection_name}")

    # Get all documents
    docs = db.collection(collection_name).stream()

    # Convert to list of dicts
    data = []
    count = 0

    for doc in docs:
        doc_data = doc.to_dict()
        doc_data['id'] = doc.id  # Preserve document ID

        # Serialize Firestore data types
        serialized_data = serialize_firestore_data(doc_data)
        data.append(serialized_data)

        count += 1
        if count % 10 == 0:
            print(f"   ✓ Backed up {count} documents...")

    # Save to JSON file
    output_file = output_dir / f"{collection_name}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    file_size = output_file.stat().st_size / 1024  # KB
    print(f"✅ {collection_name}: {count} documents saved ({file_size:.2f} KB)")
    print(f"   📄 File: {output_file}")

    return count


def main():
    """Main backup function"""
    print("=" * 60)
    print("🗄️  Firestore Data Backup")
    print("=" * 60)

    # Initialize Firebase
    try:
        db = init_firebase()
        print("✅ Connected to Firestore\n")
    except Exception as e:
        print(f"❌ Failed to connect to Firestore: {e}")
        print("\nMake sure you have:")
        print("  1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable")
        print("  2. OR placed serviceAccountKey.json in backend/ directory")
        return

    # Create backup directory
    backup_dir = Path(__file__).parent / 'backup'
    backup_dir.mkdir(exist_ok=True)

    # Add timestamp to backup directory name
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    timestamped_dir = backup_dir / timestamp
    timestamped_dir.mkdir(exist_ok=True)

    print(f"📁 Backup directory: {timestamped_dir}\n")

    # Collections to backup (use actual Firestore collection names)
    collections = [
        'users',
        'projects',
        'testfolders',  # Note: Firestore uses 'testfolders', not 'folders'
        'testcases',
        'testcase_history',
        'testruns',
        'testresults',
        'issues'
    ]

    # Backup each collection
    total_docs = 0
    backed_up_collections = []

    for collection_name in collections:
        try:
            count = backup_collection(db, collection_name, timestamped_dir)
            total_docs += count
            backed_up_collections.append(collection_name)
        except Exception as e:
            print(f"❌ Error backing up {collection_name}: {e}")

    # Create summary file
    summary = {
        'backup_timestamp': timestamp,
        'backup_date': datetime.now().isoformat(),
        'total_documents': total_docs,
        'collections': backed_up_collections,
        'collection_counts': {
            name: len(json.load(open(timestamped_dir / f"{name}.json")))
            for name in backed_up_collections
        }
    }

    summary_file = timestamped_dir / '_backup_summary.json'
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    # Print summary
    print("\n" + "=" * 60)
    print("✅ Backup Complete!")
    print("=" * 60)
    print(f"📊 Total documents backed up: {total_docs}")
    print(f"📁 Backup location: {timestamped_dir}")
    print(f"\n📄 Files created:")
    for name in backed_up_collections:
        print(f"   - {name}.json")
    print(f"   - _backup_summary.json")

    print(f"\n💡 To restore this backup:")
    print(f"   python backend/restore_firestore.py {timestamp}")

    print(f"\n💡 To migrate to Supabase:")
    print(f"   python backend/migrate_firestore_to_supabase.py")


if __name__ == '__main__':
    main()
