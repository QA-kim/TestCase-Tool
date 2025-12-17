#!/usr/bin/env python
"""
Create initial admin user in Firestore
Run this script once to create the first admin user
"""
import sys
import os
import getpass
from app.db.firestore import users_collection
from app.core.security import get_password_hash

def create_admin_user():
    """Create initial admin user"""
    admin_email = "admin@tcms.com"
    admin_username = "admin"

    # Get password from environment variable or prompt user
    admin_password = os.environ.get('ADMIN_PASSWORD')
    if not admin_password:
        print("관리자 비밀번호를 입력하세요 (최소 8자, 영문/숫자/특수문자 포함):")
        admin_password = getpass.getpass("Password: ")

        if len(admin_password) < 8:
            print("[ERROR] 비밀번호는 최소 8자 이상이어야 합니다.")
            sys.exit(1)

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
        print(f"          User ID: {admin['id']}")
        print(f"\n[INFO] Please save your password securely.")
        print(f"[WARNING] Change the password after first login for security!")
    except Exception as e:
        print(f"[ERROR] Error creating admin user: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    create_admin_user()
