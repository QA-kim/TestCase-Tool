from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.db.supabase import users_collection
from app.core.security import get_current_user_firestore
from app.core.permissions import check_admin_role
from app.schemas.user import User as UserSchema, UserNotificationSettings

router = APIRouter(redirect_slashes=False)


@router.get("", response_model=List[UserSchema])
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

    # Unlock account (Supabase doesn't have is_locked field)
    users_collection.update(user_id, {
        'failed_login_attempts': 0,
        'locked_until': None
    })

    return {
        "message": f"계정 '{user.get('email')}'의 잠금이 해제되었습니다",
        "user_id": user_id
    }


@router.get("/{user_id}/notifications", response_model=UserNotificationSettings)
def get_notification_settings(
    user_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Get user notification settings (user can only get their own settings)"""
    # Users can only get their own notification settings
    if current_user['id'] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="자신의 알림 설정만 조회할 수 있습니다"
        )

    # Get user
    user = users_collection.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )

    # Return notification settings with defaults if not set
    return UserNotificationSettings(
        email_notifications=user.get('email_notifications', True),
        notify_issue_assigned=user.get('notify_issue_assigned', True),
        notify_issue_updated=user.get('notify_issue_updated', True),
        notify_testrun_completed=user.get('notify_testrun_completed', True),
        notify_testrun_assigned=user.get('notify_testrun_assigned', True)
    )


@router.put("/{user_id}/notifications", response_model=UserNotificationSettings)
def update_notification_settings(
    user_id: str,
    settings: UserNotificationSettings,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Update user notification settings (user can only update their own settings)"""
    # Users can only update their own notification settings
    if current_user['id'] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="자신의 알림 설정만 변경할 수 있습니다"
        )

    # Get user
    user = users_collection.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )

    # Update notification settings
    users_collection.update(user_id, settings.dict())

    return settings


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Delete a user account (admin only)"""
    # Only admin can delete accounts
    check_admin_role(current_user)

    # Prevent self-deletion
    if current_user['id'] == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="자신의 계정은 삭제할 수 없습니다"
        )

    # Get user
    user = users_collection.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )

    # Delete user
    users_collection.delete(user_id)

    return None
