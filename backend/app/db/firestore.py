"""
Firestore database helper functions
"""
import firebase_admin
from firebase_admin import credentials, firestore
from typing import Optional, Dict, Any, List
import os
from datetime import datetime


# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    if not firebase_admin._apps:
        # Check if service account key file exists
        cred_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 'firebase-service-account.json')

        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
        else:
            # Use environment variable for production (Render.com)
            cred_dict = {
                "type": "service_account",
                "project_id": os.getenv('FIREBASE_PROJECT_ID'),
                "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
                "private_key": os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
                "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
                "client_id": os.getenv('FIREBASE_CLIENT_ID'),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": os.getenv('FIREBASE_CLIENT_X509_CERT_URL'),
                "universe_domain": "googleapis.com"
            }

            # Validate required fields
            required_fields = ['project_id', 'private_key_id', 'private_key', 'client_email']
            missing_fields = [field for field in required_fields if not cred_dict.get(field)]
            if missing_fields:
                raise ValueError(f"Missing required Firebase credentials: {', '.join(missing_fields)}")

            cred = credentials.Certificate(cred_dict)

        firebase_admin.initialize_app(cred)

    return firestore.client()


# Get Firestore client
db = None


def get_db():
    """Get Firestore database client"""
    global db
    if db is None:
        db = initialize_firebase()
    return db


# Helper functions for CRUD operations
class FirestoreHelper:
    """Helper class for Firestore operations"""

    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        self.db = get_db()

    def create(self, data: Dict[str, Any], doc_id: Optional[str] = None) -> Dict[str, Any]:
        """Create a new document"""
        data['created_at'] = datetime.utcnow()
        data['updated_at'] = datetime.utcnow()

        if doc_id:
            doc_ref = self.db.collection(self.collection_name).document(doc_id)
            doc_ref.set(data)
            data['id'] = doc_id
        else:
            doc_ref = self.db.collection(self.collection_name).add(data)[1]
            data['id'] = doc_ref.id

        return data

    def get(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get a document by ID"""
        doc = self.db.collection(self.collection_name).document(doc_id).get()
        if doc.exists:
            data = doc.to_dict()
            data['id'] = doc.id
            return data
        return None

    def get_by_field(self, field: str, value: Any) -> Optional[Dict[str, Any]]:
        """Get first document matching a field value"""
        docs = self.db.collection(self.collection_name).where(field, '==', value).limit(1).stream()
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            return data
        return None

    def list(self, filters: Optional[Dict[str, Any]] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """List documents with optional filters"""
        query = self.db.collection(self.collection_name)

        if filters:
            for field, value in filters.items():
                query = query.where(field, '==', value)

        docs = query.limit(limit).stream()
        result = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            result.append(data)

        return result

    def update(self, doc_id: str, data: Dict[str, Any]) -> bool:
        """Update a document"""
        data['updated_at'] = datetime.utcnow()
        doc_ref = self.db.collection(self.collection_name).document(doc_id)

        if doc_ref.get().exists:
            doc_ref.update(data)
            return True
        return False

    def delete(self, doc_id: str) -> bool:
        """Delete a document"""
        doc_ref = self.db.collection(self.collection_name).document(doc_id)
        if doc_ref.get().exists:
            doc_ref.delete()
            return True
        return False

    def query(self, field: str, operator: str, value: Any) -> List[Dict[str, Any]]:
        """Query documents"""
        docs = self.db.collection(self.collection_name).where(field, operator, value).stream()
        result = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            result.append(data)
        return result


# Collection helpers
users_collection = FirestoreHelper('users')
projects_collection = FirestoreHelper('projects')
testcases_collection = FirestoreHelper('testcases')
testcase_history_collection = FirestoreHelper('testcase_history')
testruns_collection = FirestoreHelper('testruns')
testresults_collection = FirestoreHelper('testresults')
issues_collection = FirestoreHelper('issues')
