#!/usr/bin/env python
"""Test login directly"""
import hashlib
from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import verify_password, get_password_hash

db = SessionLocal()

try:
    user = db.query(User).filter(User.username == "admin").first()
    if user:
        print(f"User: {user.username}")
        print(f"Stored hash: {user.hashed_password}")
        print(f"Stored hash type: {type(user.hashed_password)}")

        password = "admin123"
        expected_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
        print(f"\nExpected hash: {expected_hash}")
        print(f"Match: {expected_hash == user.hashed_password}")

        print(f"\nTesting verify_password function...")
        try:
            result = verify_password(password, user.hashed_password)
            print(f"verify_password result: {result}")
        except Exception as e:
            print(f"Error in verify_password: {e}")
    else:
        print("User not found")
finally:
    db.close()
