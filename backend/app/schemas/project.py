from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)

    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('프로젝트 이름은 비어있을 수 없습니다')
        v = v.strip()
        if len(v) > 200:
            raise ValueError('프로젝트 이름은 200자를 초과할 수 없습니다')
        return v

    @validator('description')
    def validate_description(cls, v):
        if v and len(v) > 2000:
            raise ValueError('프로젝트 설명은 2000자를 초과할 수 없습니다')
        return v.strip() if v else v


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)

    @validator('name')
    def validate_name(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('프로젝트 이름은 비어있을 수 없습니다')
            v = v.strip()
            if len(v) > 200:
                raise ValueError('프로젝트 이름은 200자를 초과할 수 없습니다')
        return v

    @validator('description')
    def validate_description(cls, v):
        if v and len(v) > 2000:
            raise ValueError('프로젝트 설명은 2000자를 초과할 수 없습니다')
        return v.strip() if v else v


class ProjectInDB(ProjectBase):
    id: str  # Firestore uses string IDs
    key: str  # Project key (auto-generated from name)
    owner_id: str  # Firestore uses string IDs
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Project(ProjectInDB):
    pass
