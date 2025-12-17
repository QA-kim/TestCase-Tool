#!/usr/bin/env python
"""
Create initial admin user in Firestore
Run this script once to create the first admin user
"""
import sys
from app.db.firestore import users_collection
from app.core.security import get_password_hash

def create_admin_user():
    """Create initial admin user"""
    admin_email = "admin@tcms.com"
    admin_username = "admin"
    admin_password = "admin123!"

    # Check if admin already exists
    existing_admin = users_collection.get_by_field('email', admin_email)
    if existing_admin:
        print(f"[WARNING] Admin user already exists with ID: {existing_admin['id']}")
        print(f"          Email: {admin_email}")
        print(f"          Username: {admin_username}")
        return

    # Create admin user
    admin_data = {
        'email': admin_email,
        'username': admin_username,
        'full_name': 'System Administrator',
        'role': 'admin',
        'hashed_password': get_password_hash(admin_password),
        'is_active': True
    }

    try:
        admin = users_collection.create(admin_data)
        print(f"[SUCCESS] Admin user created successfully!")
        print(f"          Email: {admin_email}")
        print(f"          Username: {admin_username}")
        print(f"          Password: {admin_password}")
        print(f"          User ID: {admin['id']}")
        print(f"\n[WARNING] Please change the password after first login!")
    except Exception as e:
        print(f"[ERROR] Error creating admin user: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    create_admin_user()
