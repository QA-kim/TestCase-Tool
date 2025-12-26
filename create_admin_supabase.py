#!/usr/bin/env python3
"""
Create admin user in Supabase
"""
import os
import sys
from passlib.hash import pbkdf2_sha256
from supabase import create_client, Client, ClientOptions
import uuid
from datetime import datetime

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://eclniwdhzpkzhbcrncvc.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_KEY:
    print("❌ Error: SUPABASE_SERVICE_KEY environment variable not set")
    print("Please set it with: export SUPABASE_SERVICE_KEY='your-service-key'")
    sys.exit(1)

print(f"🔍 Connecting to Supabase: {SUPABASE_URL}")

# Create Supabase client
try:
    options = ClientOptions(
        auto_refresh_token=False,
        persist_session=False
    )
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY, options=options)
    print("✅ Connected to Supabase")
except Exception as e:
    print(f"❌ Failed to connect to Supabase: {e}")
    sys.exit(1)

# Admin user details
admin_email = "admin@tcms.com"
admin_username = "admin"
admin_password = "admin123"
admin_full_name = "Administrator"

print(f"\n📝 Creating admin user:")
print(f"   Email: {admin_email}")
print(f"   Username: {admin_username}")
print(f"   Password: {admin_password}")
print(f"   Full Name: {admin_full_name}")

# Check if admin already exists
try:
    existing = supabase.table('users').select('*').eq('username', admin_username).execute()
    if existing.data:
        print(f"⚠️  Admin user '{admin_username}' already exists!")
        print(f"   User ID: {existing.data[0]['id']}")
        print(f"   Email: {existing.data[0]['email']}")
        print(f"   Role: {existing.data[0]['role']}")

        response = input("\nDo you want to update the password? (y/N): ")
        if response.lower() != 'y':
            print("❌ Operation cancelled")
            sys.exit(0)

        # Update password
        password_hash = pbkdf2_sha256.hash(admin_password)
        supabase.table('users').update({
            'password_hash': password_hash,
            'role': 'admin',
            'is_active': True,
            'failed_login_attempts': 0,
            'locked_until': None,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', existing.data[0]['id']).execute()

        print("✅ Admin password updated successfully!")
        print(f"\nYou can now login with:")
        print(f"   Username: {admin_username}")
        print(f"   Password: {admin_password}")
        sys.exit(0)

except Exception as e:
    print(f"❌ Error checking for existing user: {e}")
    sys.exit(1)

# Hash the password
password_hash = pbkdf2_sha256.hash(admin_password)
print(f"\n🔐 Password hashed successfully")

# Create admin user
user_id = str(uuid.uuid4())
now = datetime.utcnow().isoformat()

user_data = {
    'id': user_id,
    'email': admin_email,
    'username': admin_username,
    'password_hash': password_hash,
    'full_name': admin_full_name,
    'role': 'admin',
    'is_active': True,
    'failed_login_attempts': 0,
    'locked_until': None,
    'is_temp_password': False,
    'password_reset_at': None,
    'password_changed_at': None,
    'created_at': now,
    'updated_at': now
}

try:
    result = supabase.table('users').insert(user_data).execute()
    print(f"✅ Admin user created successfully!")
    print(f"   User ID: {user_id}")
    print(f"\n🎉 You can now login with:")
    print(f"   Username: {admin_username}")
    print(f"   Password: {admin_password}")
    print(f"\n⚠️  Please change the password after first login!")
except Exception as e:
    print(f"❌ Failed to create admin user: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
