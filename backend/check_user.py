#!/usr/bin/env python
"""Check admin user in database"""
from app.db.database import SessionLocal
from app.models.user import User

db = SessionLocal()

try:
    user = db.query(User).filter(User.username == "admin").first()
    if user:
        print(f"User found: {user.username}")
        print(f"Email: {user.email}")
        print(f"Hashed password type: {type(user.hashed_password)}")
        print(f"Hashed password value: {user.hashed_password}")
        print(f"Hashed password length: {len(user.hashed_password)}")
    else:
        print("Admin user not found")
finally:
    db.close()
