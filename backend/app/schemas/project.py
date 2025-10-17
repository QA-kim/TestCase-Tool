from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectInDB(ProjectBase):
    id: str  # Firestore uses string IDs
    owner_id: str  # Firestore uses string IDs
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Project(ProjectInDB):
    pass
