from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TestPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TestType(str, Enum):
    FUNCTIONAL = "functional"
    REGRESSION = "regression"
    SMOKE = "smoke"
    INTEGRATION = "integration"
    PERFORMANCE = "performance"
    SECURITY = "security"


class TestFolderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    parent_id: Optional[str] = None  # Firestore uses string IDs

    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('폴더 이름은 비어있을 수 없습니다')
        v = v.strip()
        if len(v) > 200:
            raise ValueError('폴더 이름은 200자를 초과할 수 없습니다')
        return v

    @validator('description')
    def validate_description(cls, v):
        if v and len(v) > 1000:
            raise ValueError('폴더 설명은 1000자를 초과할 수 없습니다')
        return v.strip() if v else v


class TestFolderCreate(TestFolderBase):
    project_id: str  # Firestore uses string IDs


class TestFolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    parent_id: Optional[str] = None  # Firestore uses string IDs

    @validator('name')
    def validate_name(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('폴더 이름은 비어있을 수 없습니다')
            v = v.strip()
            if len(v) > 200:
                raise ValueError('폴더 이름은 200자를 초과할 수 없습니다')
        return v

    @validator('description')
    def validate_description(cls, v):
        if v and len(v) > 1000:
            raise ValueError('폴더 설명은 1000자를 초과할 수 없습니다')
        return v.strip() if v else v


class TestFolderInDB(TestFolderBase):
    id: str  # Firestore uses string IDs
    project_id: str  # Firestore uses string IDs
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TestFolder(TestFolderInDB):
    pass


class TestCaseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    preconditions: Optional[str] = Field(None, max_length=5000)
    steps: Optional[str] = Field(None, max_length=10000)
    expected_result: Optional[str] = Field(None, max_length=5000)
    priority: TestPriority = TestPriority.MEDIUM
    test_type: TestType = TestType.FUNCTIONAL
    tags: Optional[List[str]] = Field(default_factory=list)
    folder_id: Optional[str] = None  # Firestore uses string IDs

    @validator('title')
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('테스트 케이스 제목은 비어있을 수 없습니다')
        v = v.strip()
        if len(v) > 500:
            raise ValueError('테스트 케이스 제목은 500자를 초과할 수 없습니다')
        return v

    @validator('description', 'preconditions', 'expected_result')
    def validate_text_fields(cls, v):
        if v and len(v) > 5000:
            raise ValueError('필드는 5000자를 초과할 수 없습니다')
        return v.strip() if v else v

    @validator('steps')
    def validate_steps(cls, v):
        if v and len(v) > 10000:
            raise ValueError('테스트 단계는 10000자를 초과할 수 없습니다')
        return v.strip() if v else v

    @validator('tags')
    def validate_tags(cls, v):
        if v and len(v) > 10:
            raise ValueError('태그는 10개를 초과할 수 없습니다')
        return v


class TestCaseCreate(TestCaseBase):
    project_id: str  # Firestore uses string IDs


class TestCaseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    preconditions: Optional[str] = Field(None, max_length=5000)
    steps: Optional[str] = Field(None, max_length=10000)
    expected_result: Optional[str] = Field(None, max_length=5000)
    priority: Optional[TestPriority] = None
    test_type: Optional[TestType] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    folder_id: Optional[str] = None  # Firestore uses string IDs
    change_note: Optional[str] = Field(None, max_length=1000)  # For version history

    @validator('title')
    def validate_title(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('테스트 케이스 제목은 비어있을 수 없습니다')
            v = v.strip()
            if len(v) > 500:
                raise ValueError('테스트 케이스 제목은 500자를 초과할 수 없습니다')
        return v

    @validator('description', 'preconditions', 'expected_result')
    def validate_text_fields(cls, v):
        if v and len(v) > 5000:
            raise ValueError('필드는 5000자를 초과할 수 없습니다')
        return v.strip() if v else v

    @validator('steps')
    def validate_steps(cls, v):
        if v and len(v) > 10000:
            raise ValueError('테스트 단계는 10000자를 초과할 수 없습니다')
        return v.strip() if v else v

    @validator('tags')
    def validate_tags(cls, v):
        if v and len(v) > 10:
            raise ValueError('태그는 10개를 초과할 수 없습니다')
        return v

    @validator('change_note')
    def validate_change_note(cls, v):
        if v and len(v) > 1000:
            raise ValueError('변경 노트는 1000자를 초과할 수 없습니다')
        return v.strip() if v else v


class TestCaseInDB(TestCaseBase):
    id: str  # Firestore uses string IDs
    project_id: str  # Firestore uses string IDs
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TestCase(TestCaseInDB):
    pass
