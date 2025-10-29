from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.db.firestore import FirestoreHelper
from app.core.security import get_current_user_firestore
from app.core.permissions import check_write_permission
from app.schemas.testcase import (
    TestFolderCreate,
    TestFolderUpdate,
    TestFolder as TestFolderSchema
)

router = APIRouter()

# Create folder collection helper
folders_collection = FirestoreHelper('testfolders')


@router.post("/", response_model=TestFolderSchema, status_code=status.HTTP_201_CREATED)
def create_folder(
    folder_in: TestFolderCreate,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Create a new test folder"""
    check_write_permission(current_user, "테스트 폴더")

    folder_data = folder_in.dict()
    folder_data['owner_id'] = current_user['id']
    folder = folders_collection.create(folder_data)
    return folder


@router.get("/", response_model=List[TestFolderSchema])
def list_folders(
    project_id: str = None,
    parent_id: str = None,
    current_user: dict = Depends(get_current_user_firestore)
):
    """List folders, optionally filtered by project_id or parent_id"""
    if project_id:
        folders = folders_collection.query('project_id', '==', project_id)
        if parent_id:
            # Filter by parent_id in Python (Firestore doesn't support multiple equality filters)
            folders = [f for f in folders if f.get('parent_id') == parent_id]
        elif parent_id is None:
            # Get root folders (no parent_id or parent_id is None)
            folders = [f for f in folders if not f.get('parent_id')]
    else:
        folders = folders_collection.list(limit=1000)

    return folders


@router.get("/{folder_id}", response_model=TestFolderSchema)
def get_folder(
    folder_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Get a specific folder by ID"""
    folder = folders_collection.get(folder_id)
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="폴더를 찾을 수 없습니다"
        )
    return folder


@router.put("/{folder_id}", response_model=TestFolderSchema)
def update_folder(
    folder_id: str,
    folder_in: TestFolderUpdate,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Update a folder"""
    folder = folders_collection.get(folder_id)
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="폴더를 찾을 수 없습니다"
        )

    check_write_permission(current_user, "테스트 폴더")

    update_data = folder_in.dict(exclude_unset=True)
    folders_collection.update(folder_id, update_data)

    updated_folder = folders_collection.get(folder_id)
    return updated_folder


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    """Delete a folder"""
    folder = folders_collection.get(folder_id)
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="폴더를 찾을 수 없습니다"
        )

    check_write_permission(current_user, "테스트 폴더")

    folders_collection.delete(folder_id)
    return None
