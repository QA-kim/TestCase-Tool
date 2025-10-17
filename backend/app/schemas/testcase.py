from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class TestPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TestType(str, Enum):
    FUNCTIONAL = "functional"
    REGRESSION = "regression"
    SMOKE = "smoke"
    INTEGRATION = "integration"
    PERFORMANCE = "performance"
    SECURITY = "security"


class TestFolderBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None


class TestFolderCreate(TestFolderBase):
    project_id: int


class TestFolderUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None


class TestFolderInDB(TestFolderBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TestFolder(TestFolderInDB):
    pass


class TestCaseBase(BaseModel):
    title: str
    description: Optional[str] = None
    preconditions: Optional[str] = None
    steps: Optional[str] = None
    expected_result: Optional[str] = None
    priority: TestPriority = TestPriority.MEDIUM
    test_type: TestType = TestType.FUNCTIONAL
    tags: Optional[str] = None
    folder_id: Optional[int] = None


class TestCaseCreate(TestCaseBase):
    project_id: int


class TestCaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    preconditions: Optional[str] = None
    steps: Optional[str] = None
    expected_result: Optional[str] = None
    priority: Optional[TestPriority] = None
    test_type: Optional[TestType] = None
    tags: Optional[str] = None
    folder_id: Optional[int] = None
    change_note: Optional[str] = None  # For version history


class TestCaseInDB(TestCaseBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TestCase(TestCaseInDB):
    pass
