from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.db.firestore import projects_collection
from app.core.security import get_current_user_firestore
from app.schemas.project import ProjectCreate, ProjectUpdate, Project as ProjectSchema

router = APIRouter()


@router.post("/", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    current_user: dict = Depends(get_current_user_firestore)
):
    project_data = project_in.model_dump()
    project_data['owner_id'] = current_user['id']

    project = projects_collection.create(project_data)
    return project


@router.get("/", response_model=List[ProjectSchema])
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
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    update_data = project_in.model_dump(exclude_unset=True)
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
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    projects_collection.delete(project_id)
    return None
