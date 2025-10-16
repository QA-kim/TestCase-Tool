#!/usr/bin/env python
"""Script to create admin user directly in database"""
import hashlib
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.models.user import User, UserRole

# Create tables
Base.metadata.create_all(bind=engine)

# Create session
db = SessionLocal()

try:
    # Delete existing admin if exists
    existing_user = db.query(User).filter(User.username == "admin").first()
    if existing_user:
        db.delete(existing_user)
        db.commit()
        print("Deleted existing admin user")

    # Hash password using SHA256 (simple for development)
    password = "admin123"
    hashed_password = hashlib.sha256(password.encode('utf-8')).hexdigest()

    # Create admin user
    admin_user = User(
        email="admin@tcms.com",
        username="admin",
        hashed_password=hashed_password,
        full_name="Administrator",
        role=UserRole.ADMIN,
        is_active=True
    )

    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    print(f"[OK] Admin user created successfully!")
    print(f"  Username: admin")
    print(f"  Password: admin123")
    print(f"  Email: admin@tcms.com")
    print(f"  Role: {admin_user.role}")
    print(f"  Hash: {hashed_password}")

finally:
    db.close()
