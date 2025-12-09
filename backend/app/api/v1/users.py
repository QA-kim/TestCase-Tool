from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.db.firestore import users_collection
from app.core.security import get_current_user_firestore
from app.core.permissions import check_admin_role
from app.schemas.user import User as UserSchema

router = APIRouter()


@router.get("/", response_model=List[UserSchema])
def get_users(current_user: dict = Depends(get_current_user_firestore)):
    """Get all users (for displaying names in history)"""
    users = users_collection.list(limit=1000)
    return users


@router.get("/{user_id}", response_model=UserSchema)
def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Get a specific user by ID"""
    user = users_collection.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )
    return user


@router.post("/{user_id}/unlock")
def unlock_user_account(
    user_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Unlock a locked user account (admin only)"""
    # Only admin can unlock accounts
    check_admin_role(current_user)

    # Get user
    user = users_collection.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )

    # Unlock account
    users_collection.update(user_id, {
        'is_locked': False,
        'failed_login_attempts': 0,
        'locked_until': None
    })

    return {
        "message": f"계정 '{user.get('email')}'의 잠금이 해제되었습니다",
        "user_id": user_id
    }
