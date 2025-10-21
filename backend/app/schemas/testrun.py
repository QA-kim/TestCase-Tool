from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TestRunStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class TestResultStatus(str, Enum):
    UNTESTED = "untested"
    PASSED = "passed"
    FAILED = "failed"
    BLOCKED = "blocked"
    RETEST = "retest"
    SKIPPED = "skipped"


class TestRunBase(BaseModel):
    name: str
    description: Optional[str] = None
    assignee_id: Optional[str] = None  # Firestore uses string IDs
    environment: Optional[str] = None
    milestone: Optional[str] = None


class TestRunCreate(TestRunBase):
    project_id: str  # Firestore uses string IDs
    test_case_ids: list[str] = []  # Firestore uses string IDs


class TestRunUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    assignee_id: Optional[str] = None  # Firestore uses string IDs
    status: Optional[TestRunStatus] = None
    environment: Optional[str] = None
    milestone: Optional[str] = None
    test_case_ids: Optional[list[str]] = None  # Firestore uses string IDs


# Simple TestCase schema to avoid circular imports
class TestCaseSimple(BaseModel):
    id: str  # Firestore uses string IDs
    title: str
    priority: str
    test_type: str

    class Config:
        from_attributes = True


class TestRunInDB(TestRunBase):
    id: str  # Firestore uses string IDs
    project_id: str  # Firestore uses string IDs
    test_case_ids: List[str] = []  # Firestore uses string IDs
    status: TestRunStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TestRun(TestRunInDB):
    pass


class TestResultBase(BaseModel):
    status: TestResultStatus = TestResultStatus.UNTESTED
    actual_result: Optional[str] = None
    comment: Optional[str] = None
    defect_url: Optional[str] = None
    execution_time: Optional[int] = None


class TestResultCreate(TestResultBase):
    test_run_id: str  # Firestore uses string IDs
    test_case_id: str  # Firestore uses string IDs
    tester_id: Optional[str] = None  # Firestore uses string IDs


class TestResultUpdate(BaseModel):
    status: Optional[TestResultStatus] = None
    actual_result: Optional[str] = None
    comment: Optional[str] = None
    defect_url: Optional[str] = None
    execution_time: Optional[int] = None


class TestResultInDB(TestResultBase):
    id: str  # Firestore uses string IDs
    test_run_id: str  # Firestore uses string IDs
    test_case_id: str  # Firestore uses string IDs
    tester_id: Optional[str] = None  # Firestore uses string IDs
    tested_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TestResult(TestResultInDB):
    pass
