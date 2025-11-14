"""
Admin 계정 상태 확인 및 실패 횟수 리셋 스크립트
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from app.db.firestore import users_collection
from app.core.security import verify_password, get_password_hash

def check_admin_account():
    """Check admin account status and reset failed attempts"""

    # Find admin account
    admin = users_collection.get_by_field('email', 'admin@tcms.com')

    if not admin:
        print("[ERROR] Admin 계정을 찾을 수 없습니다.")
        return

    print("[OK] Admin 계정 발견")
    print(f"   - ID: {admin['id']}")
    print(f"   - Email: {admin['email']}")
    print(f"   - Username: {admin.get('username', 'N/A')}")
    print(f"   - Role: {admin['role']}")
    print(f"   - Active: {admin.get('is_active', False)}")
    print(f"   - Locked: {admin.get('is_locked', False)}")
    print(f"   - Failed Login Attempts: {admin.get('failed_login_attempts', 0)}")

    if admin.get('locked_until'):
        print(f"   - Locked Until: {admin['locked_until']}")

    # Test password
    test_password = "admin123"
    is_correct = verify_password(test_password, admin['hashed_password'])

    print(f"\n비밀번호 테스트 ('{test_password}'):")
    print(f"   - 결과: {'[OK] 올바름' if is_correct else '[ERROR] 틀림'}")

    # Show hash info
    print(f"\n저장된 해시:")
    print(f"   - {admin['hashed_password'][:50]}...")

    # Reset failed attempts if any
    if admin.get('failed_login_attempts', 0) > 0 or admin.get('is_locked', False):
        print(f"\n[INFO] 실패 횟수 및 잠금 상태 초기화 중...")
        users_collection.update(admin['id'], {
            'failed_login_attempts': 0,
            'is_locked': False,
            'locked_until': None
        })
        print("[OK] 초기화 완료!")

    # If password is wrong, update to correct one
    if not is_correct:
        print(f"\n[INFO] 비밀번호가 틀립니다. 올바른 해시로 업데이트 중...")
        correct_hash = get_password_hash(test_password)
        users_collection.update(admin['id'], {
            'hashed_password': correct_hash
        })
        print("[OK] 비밀번호 업데이트 완료!")

if __name__ == "__main__":
    check_admin_account()
