"""
Check all Firestore collections and document counts

This script lists all collections in Firestore and counts documents in each.
"""

import os
import firebase_admin
from firebase_admin import credentials, firestore
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


def main():
    print("=" * 60)
    print("🔍 Firestore Collections Check")
    print("=" * 60)

    # Initialize Firebase
    try:
        db = init_firebase()
        print("✅ Connected to Firestore\n")
    except Exception as e:
        print(f"❌ Failed to connect to Firestore: {e}")
        return

    # Get all root collections
    print("📁 Root Collections:")
    collections = db.collections()

    total_docs = 0
    collection_info = []

    for collection in collections:
        collection_name = collection.id
        # Count documents
        docs = list(collection.stream())
        doc_count = len(docs)
        total_docs += doc_count

        collection_info.append({
            'name': collection_name,
            'count': doc_count
        })

        print(f"\n📦 {collection_name}: {doc_count} documents")

        # Show first few document IDs as sample
        if docs:
            sample_ids = [doc.id for doc in docs[:3]]
            print(f"   Sample IDs: {', '.join(sample_ids)}")
            if doc_count > 3:
                print(f"   ... and {doc_count - 3} more")

    print("\n" + "=" * 60)
    print("📊 Summary")
    print("=" * 60)
    print(f"Total collections: {len(collection_info)}")
    print(f"Total documents: {total_docs}")

    print("\n📋 Collection List:")
    for info in sorted(collection_info, key=lambda x: x['name']):
        print(f"   - {info['name']}: {info['count']} docs")


if __name__ == '__main__':
    main()
