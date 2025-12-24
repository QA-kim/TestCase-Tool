from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.db.supabase import projects_collection
from app.core.security import get_current_user_firestore
from app.core.permissions import check_creation_permission, check_modification_permission
from app.schemas.project import ProjectCreate, ProjectUpdate, Project as ProjectSchema

router = APIRouter()


@router.post("", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    current_user: dict = Depends(get_current_user_firestore)
):
    # Check creation permission (viewer cannot create)
    check_creation_permission(current_user, "프로젝트")

    # Check if project name already exists
    existing_projects = projects_collection.query('name', '==', project_in.name)
    if existing_projects:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"프로젝트 이름 '{project_in.name}'은(는) 이미 존재합니다"
        )

    project_data = project_in.dict()  # Pydantic v1 uses .dict()
    project_data['owner_id'] = current_user['id']

    project = projects_collection.create(project_data)
    return project


@router.get("", response_model=List[ProjectSchema])
def list_projects(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user_firestore)
):
    projects = projects_collection.list(limit=limit)
    return projects[skip:skip+limit]


@router.get("/{project_id}", response_model=ProjectSchema)
def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    project = projects_collection.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project


@router.put("/{project_id}", response_model=ProjectSchema)
def update_project(
    project_id: str,
    project_in: ProjectUpdate,
    current_user: dict = Depends(get_current_user_firestore)
):
    project = projects_collection.get(project_id)

    # Check modification permission (IDOR protection)
    check_modification_permission(project, current_user, "프로젝트")

    # Check if new project name already exists (for other projects)
    update_data = project_in.dict(exclude_unset=True)  # Pydantic v1 uses .dict()
    if 'name' in update_data:
        existing_projects = projects_collection.query('name', '==', update_data['name'])
        # Filter out the current project
        other_projects = [p for p in existing_projects if p['id'] != project_id]
        if other_projects:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"프로젝트 이름 '{update_data['name']}'은(는) 이미 존재합니다"
            )

    projects_collection.update(project_id, update_data)

    # Return updated project
    updated_project = projects_collection.get(project_id)
    return updated_project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user_firestore)
):
    project = projects_collection.get(project_id)

    # Check modification permission (IDOR protection)
    check_modification_permission(project, current_user, "프로젝트")

    projects_collection.delete(project_id)
    return None
