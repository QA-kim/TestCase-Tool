"""
Permission and authorization helpers
"""
from fastapi import HTTPException, status
from typing import Optional


def check_admin_role(current_user: dict):
    """Check if user has admin role"""
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다"
        )


def check_resource_ownership(
    resource: Optional[dict],
    current_user: dict,
    resource_name: str = "리소스",
    owner_field: str = "owner_id"
):
    """
    Check if current user owns the resource or is admin.

    Args:
        resource: The resource dictionary (e.g., project, testcase)
        current_user: The current authenticated user
        resource_name: Name of the resource for error message
        owner_field: The field name that contains owner ID (default: "owner_id")

    Raises:
        HTTPException: If resource not found or user doesn't have permission
    """
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name}을(를) 찾을 수 없습니다"
        )

    # Admin can access everything
    if current_user.get('role') == 'admin':
        return

    # Check ownership
    resource_owner = resource.get(owner_field)
    if resource_owner != current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"이 {resource_name}에 대한 권한이 없습니다"
        )


def check_modification_permission(
    resource: Optional[dict],
    current_user: dict,
    resource_name: str = "리소스",
    owner_field: str = "owner_id"
):
    """
    Check if current user can modify/delete the resource.
    Only admin or owner can modify.

    Args:
        resource: The resource dictionary
        current_user: The current authenticated user
        resource_name: Name of the resource for error message
        owner_field: The field name that contains owner ID

    Raises:
        HTTPException: If user doesn't have permission to modify
    """
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name}을(를) 찾을 수 없습니다"
        )

    user_role = current_user.get('role')

    # Admin can modify everything
    if user_role == 'admin':
        return

    # Viewer cannot modify
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"이 {resource_name}을(를) 수정할 권한이 없습니다"
    )


def check_creation_permission(current_user: dict, resource_type: str = "리소스"):
    """
    Check if user can create resources.
    Viewer role cannot create resources.

    Args:
        current_user: The current authenticated user
        resource_type: Type of resource being created

    Raises:
        HTTPException: If user doesn't have permission to create
    """
    user_role = current_user.get('role')

    if user_role == 'viewer':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"{resource_type}을(를) 생성할 권한이 없습니다 (viewer 권한)"
        )


def check_write_permission(current_user: dict, resource_type: str = "리소스"):
    """
    Check if user can create/modify/delete resources.
    Only admin role can modify resources.

    Args:
        current_user: The current authenticated user
        resource_type: Type of resource being modified

    Raises:
        HTTPException: If user doesn't have permission to write
    """
    user_role = current_user.get('role')

    # Only admin can write
    if user_role == 'admin':
        return

    # Viewer cannot write
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"{resource_type}을(를) 수정할 권한이 없습니다 (viewer 권한)"
    )
